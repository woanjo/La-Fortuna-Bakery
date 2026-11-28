from datetime import datetime, timezone
import re
from functools import wraps

from flask import Blueprint, current_app, jsonify, request, session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from extensions import db
from models import User, Feedback, AuditLog

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api")

ALLOWED_CATEGORIES = {"Feedback", "Inquiry", "Complaint", "Suggestion"}
ALLOWED_STATUSES = {"Pending", "In Progress", "Resolved"}


# =====================================================
# ADMIN AUTHORIZATION
# =====================================================
def admin_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Administrator login required."
            }), 401

        user = db.session.get(User, user_id)

        if user is None or not user.is_active or user.role != "admin":
            session.clear()
            return jsonify({
                "status": "error",
                "message": "Administrator access denied."
            }), 403

        return function(*args, **kwargs)

    return wrapper


# =====================================================
# SERIALIZATION AND VALIDATION
# =====================================================
def serialize_feedback(item):
    return {
        "id": item.id,
        "customerName": item.customer_name,
        "customerEmail": item.customer_email,
        "category": item.category,
        "subject": item.subject,
        "message": item.message,
        "status": item.status,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None
    }


def clean_text(value, field, max_length, required=True):
    if not isinstance(value, str):
        if value is None and not required:
            return None
        raise ValueError(f"{field} must be text.")

    value = value.strip()

    if required and not value:
        raise ValueError(f"{field} is required.")

    if len(value) > max_length:
        raise ValueError(f"{field} must not exceed {max_length} characters.")

    return value or None


# =====================================================
# CUSTOMER SUBMISSION
# Public endpoint: no customer account integration is assumed.
# =====================================================
@feedback_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    # Hidden honeypot field used as a basic spam trap.
    if data.get("website"):
        return jsonify({
            "status": "error",
            "message": "Unable to process this submission."
        }), 400

    try:
        customer_name = clean_text(data.get("name"), "Name", 150)
        customer_email = clean_text(data.get("email"), "Email", 255)
        category = clean_text(data.get("category"), "Category", 30)
        subject = clean_text(data.get("subject"), "Subject", 180)
        message = clean_text(data.get("message"), "Message", 5000)

        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", customer_email):
            raise ValueError("Please provide a valid email address.")

        if category not in ALLOWED_CATEGORIES:
            raise ValueError("Please select a valid submission category.")

        item = Feedback(
            customer_name=customer_name,
            customer_email=customer_email.lower(),
            category=category,
            subject=subject,
            message=message,
            status="Pending"
        )

        db.session.add(item)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Thank you. Your message has been sent to La Fortuna Bakeshop.",
            "submission": {
                "id": item.id,
                "status": item.status,
                "createdAt": item.created_at.isoformat() if item.created_at else None
            }
        }), 201

    except ValueError as error:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except (IntegrityError, SQLAlchemyError):
        db.session.rollback()
        current_app.logger.exception("Feedback submission failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to submit your message right now. Please try again."
        }), 500


# =====================================================
# ADMIN FEEDBACK LIST
# =====================================================
@feedback_bp.route("/admin/feedback", methods=["GET"])
@admin_required
def admin_get_feedback():
    try:
        query = Feedback.query
        search = (request.args.get("q") or "").strip()
        status = (request.args.get("status") or "").strip()
        category = (request.args.get("category") or "").strip()

        if len(search) > 180:
            return jsonify({
                "status": "error",
                "message": "Search text is too long."
            }), 400

        if status:
            if status not in ALLOWED_STATUSES:
                return jsonify({
                    "status": "error",
                    "message": "Invalid feedback status filter."
                }), 400
            query = query.filter(Feedback.status == status)

        if category:
            if category not in ALLOWED_CATEGORIES:
                return jsonify({
                    "status": "error",
                    "message": "Invalid feedback category filter."
                }), 400
            query = query.filter(Feedback.category == category)

        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                Feedback.customer_name.ilike(pattern),
                Feedback.customer_email.ilike(pattern),
                Feedback.subject.ilike(pattern),
                Feedback.message.ilike(pattern)
            ))

        items = query.order_by(Feedback.created_at.desc(), Feedback.id.desc()).all()

        return jsonify({
            "status": "success",
            "count": len(items),
            "feedback": [serialize_feedback(item) for item in items]
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Admin feedback retrieval failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve feedback submissions."
        }), 500


# =====================================================
# ADMIN FEEDBACK DETAIL
# =====================================================
@feedback_bp.route("/admin/feedback/<int:feedback_id>", methods=["GET"])
@admin_required
def admin_get_feedback_detail(feedback_id):
    try:
        item = db.session.get(Feedback, feedback_id)

        if item is None:
            return jsonify({
                "status": "error",
                "message": "Feedback submission not found."
            }), 404

        return jsonify({
            "status": "success",
            "feedback": serialize_feedback(item)
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Feedback detail retrieval failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve this submission."
        }), 500


# =====================================================
# ADMIN UPDATE STATUS
# =====================================================
@feedback_bp.route("/admin/feedback/<int:feedback_id>", methods=["PATCH"])
@admin_required
def admin_update_feedback(feedback_id):
    item = db.session.get(Feedback, feedback_id)

    if item is None:
        return jsonify({
            "status": "error",
            "message": "Feedback submission not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    status = data.get("status")

    if not isinstance(status, str) or status not in ALLOWED_STATUSES:
        return jsonify({
            "status": "error",
            "message": "Status must be Pending, In Progress, or Resolved."
        }), 400

    try:
        previous_status = item.status
        item.status = status
        item.updated_at = datetime.now(timezone.utc)

        db.session.add(AuditLog(
            actor_id=session.get("user_id"),
            action="UPDATE_STATUS",
            entity_type="Feedback",
            entity_id=str(item.id),
            details=f"Feedback #{item.id}: {previous_status} -> {status}"
        ))

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Feedback status updated successfully.",
            "feedback": serialize_feedback(item)
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Feedback status update failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to update feedback status."
        }), 500
