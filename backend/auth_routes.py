
from datetime import datetime, timezone
import re

from flask import Blueprint, jsonify, request, session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.security import check_password_hash

from extensions import db
from models import User, AuditLog

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def serialize_admin(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_image_url": user.profile_image_url,
        "role": user.role
    }


def get_current_admin():
    user_id = session.get("user_id")

    if not user_id:
        return None

    user = db.session.get(User, user_id)

    if user is None or not user.is_active or user.role != "admin":
        session.clear()
        return None

    return user


@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}

    identifier = str(data.get("username", "")).strip()
    password = data.get("password", "")
    remember_me = data.get("remember_me") is True

    if not identifier or not isinstance(password, str) or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password are required."
        }), 400

    user = User.query.filter(
        or_(
            User.username.ilike(identifier),
            User.email.ilike(identifier)
        )
    ).first()

    if (
        user is None
        or not user.is_active
        or user.role != "admin"
        or not check_password_hash(user.password_hash, password)
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid login credentials."
        }), 401

    session.clear()
    session["user_id"] = user.id
    session["role"] = user.role
    session.permanent = remember_me

    return jsonify({
        "status": "success",
        "message": "Administrator login successful.",
        "user": serialize_admin(user)
    }), 200


@auth_bp.route("/me", methods=["GET"])
def current_user():
    user = get_current_admin()

    if user is None:
        return jsonify({
            "status": "error",
            "message": "Not authenticated."
        }), 401

    return jsonify({
        "status": "success",
        "user": serialize_admin(user)
    }), 200


@auth_bp.route("/profile", methods=["PUT"])
def update_admin_profile():
    user = get_current_admin()

    if user is None:
        return jsonify({
            "status": "error",
            "message": "Administrator login required."
        }), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    full_name = data.get("full_name")
    username = data.get("username")
    email = data.get("email")

    if not all(isinstance(value, str) for value in (
        full_name, username, email
    )):
        return jsonify({
            "status": "error",
            "message": "Name, username, and email are required."
        }), 400

    full_name = full_name.strip()
    username = username.strip()
    email = email.strip().lower()

    if not full_name or not username or not email:
        return jsonify({
            "status": "error",
            "message": "Name, username, and email cannot be empty."
        }), 400

    if len(full_name) > 201:
        return jsonify({
            "status": "error",
            "message": "Full name is too long."
        }), 400

    if len(username) > 80 or any(character.isspace() for character in username):
        return jsonify({
            "status": "error",
            "message": "Username must be 80 characters or fewer and cannot contain spaces."
        }), 400

    if len(email) > 255 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+", email
    ):
        return jsonify({
            "status": "error",
            "message": "Please enter a valid email address."
        }), 400

    name_parts = full_name.split()
    first_name = name_parts[0]
    last_name = " ".join(name_parts[1:])

    if len(first_name) > 100 or len(last_name) > 100:
        return jsonify({
            "status": "error",
            "message": "First name or last name is too long."
        }), 400

    duplicate = User.query.filter(
        User.id != user.id,
        or_(
            db.func.lower(User.username) == username.lower(),
            db.func.lower(User.email) == email.lower()
        )
    ).first()

    if duplicate:
        return jsonify({
            "status": "error",
            "message": "That username or email is already being used by another account."
        }), 409

    # Profile photos must be hosted URLs.
    # Base64 uploads will be connected later through image hosting.
    if "profile_image_url" in data:
        photo_url = data["profile_image_url"]

        if photo_url is not None:
            if not isinstance(photo_url, str):
                return jsonify({
                    "status": "error",
                    "message": "Invalid profile image URL."
                }), 400

            photo_url = photo_url.strip() or None

            if photo_url and (
                not photo_url.startswith("https://")
                and not photo_url.startswith("http://")
            ):
                return jsonify({
                    "status": "error",
                    "message": "Profile image must be an HTTP or HTTPS URL."
                }), 400

            if photo_url and len(photo_url) > 500:
                return jsonify({
                    "status": "error",
                    "message": "Profile image URL is too long."
                }), 400

        user.profile_image_url = photo_url

    try:
        user.first_name = first_name
        user.last_name = last_name
        user.username = username
        user.email = email
        user.updated_at = datetime.now(timezone.utc)

        db.session.add(AuditLog(
            actor_id=user.id,
            action="UPDATE",
            entity_type="User",
            entity_id=str(user.id),
            details="Administrator profile updated."
        ))

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Administrator profile updated successfully.",
            "user": serialize_admin(user)
        }), 200

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "That username or email is already in use."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        from flask import current_app
        current_app.logger.exception("Administrator profile update failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to save administrator profile."
        }), 500


@auth_bp.route("/logout", methods=["POST"])
def admin_logout():
    session.clear()

    return jsonify({
        "status": "success",
        "message": "Administrator logged out."
    }), 200
