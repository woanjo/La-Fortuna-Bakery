from functools import wraps

from flask import Blueprint, current_app, jsonify, request, session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import selectinload

from extensions import db
from models import AuditLog, Ingredient, User

ingredients_bp = Blueprint("ingredients", __name__, url_prefix="/api")


# =====================================================
# ADMIN AUTHORIZATION
# Uses the same session contract as product_routes.py.
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
# SERIALIZATION AND QUERY HELPERS
# =====================================================
def ingredient_query():
    return Ingredient.query.options(
        selectinload(Ingredient.products),
        selectinload(Ingredient.users)
    )


def serialize_ingredient(ingredient):
    product_names = sorted(
        [product.name for product in ingredient.products],
        key=str.casefold
    )
    product_count = len(ingredient.products)
    customer_count = len(ingredient.users)

    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "productUsage": product_count,
        "customerUsage": customer_count,
        "totalUsage": product_count + customer_count,
        "productNames": product_names,
        "canDelete": product_count == 0 and customer_count == 0
    }


def clean_ingredient_name(value):
    if not isinstance(value, str):
        raise ValueError("Ingredient name must be text.")

    name = value.strip()

    if not name:
        raise ValueError("Ingredient name is required.")

    if len(name) > 150:
        raise ValueError("Ingredient name must not exceed 150 characters.")

    return name


def find_duplicate_name(name, exclude_id=None):
    query = Ingredient.query.filter(
        db.func.lower(Ingredient.name) == name.casefold()
    )

    if exclude_id is not None:
        query = query.filter(Ingredient.id != exclude_id)

    return query.first()


def record_ingredient_action(user_id, action, ingredient_id, name):
    db.session.add(AuditLog(
        actor_id=user_id,
        action=action,
        entity_type="Ingredient",
        entity_id=str(ingredient_id),
        details=f"{action}: {name}"
    ))


# =====================================================
# ADMIN INGREDIENT LIST
# Includes relationship counts for safe management.
# =====================================================
@ingredients_bp.route("/admin/ingredients", methods=["GET"])
@admin_required
def admin_get_ingredients():
    try:
        ingredients = (
            ingredient_query()
            .order_by(Ingredient.name.asc())
            .all()
        )

        serialized = [serialize_ingredient(item) for item in ingredients]

        return jsonify({
            "status": "success",
            "count": len(serialized),
            "ingredients": serialized
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Admin ingredient retrieval failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve ingredients."
        }), 500


# =====================================================
# CREATE INGREDIENT
# =====================================================
@ingredients_bp.route("/admin/ingredients", methods=["POST"])
@admin_required
def admin_create_ingredient():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    try:
        name = clean_ingredient_name(data.get("name"))

        if find_duplicate_name(name):
            return jsonify({
                "status": "error",
                "message": "An ingredient with that name already exists."
            }), 409

        ingredient = Ingredient(name=name)
        db.session.add(ingredient)
        db.session.flush()

        record_ingredient_action(
            session.get("user_id"),
            "CREATE",
            ingredient.id,
            ingredient.name
        )

        db.session.commit()

        saved = ingredient_query().filter_by(id=ingredient.id).first()

        return jsonify({
            "status": "success",
            "message": "Ingredient created successfully.",
            "ingredient": serialize_ingredient(saved)
        }), 201

    except ValueError as error:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(error)}), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "An ingredient with that name already exists."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Ingredient creation failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to create ingredient."
        }), 500


# =====================================================
# UPDATE INGREDIENT
# Existing product/customer relationships are preserved.
# =====================================================
@ingredients_bp.route("/admin/ingredients/<int:ingredient_id>", methods=["PUT"])
@admin_required
def admin_update_ingredient(ingredient_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    try:
        ingredient = ingredient_query().filter_by(id=ingredient_id).first()

        if ingredient is None:
            return jsonify({
                "status": "error",
                "message": "Ingredient not found."
            }), 404

        name = clean_ingredient_name(data.get("name"))

        if find_duplicate_name(name, exclude_id=ingredient.id):
            return jsonify({
                "status": "error",
                "message": "Another ingredient already uses that name."
            }), 409

        old_name = ingredient.name
        ingredient.name = name

        record_ingredient_action(
            session.get("user_id"),
            "UPDATE",
            ingredient.id,
            f"{old_name} -> {name}"
        )

        db.session.commit()

        saved = ingredient_query().filter_by(id=ingredient.id).first()

        return jsonify({
            "status": "success",
            "message": "Ingredient updated successfully.",
            "ingredient": serialize_ingredient(saved)
        }), 200

    except ValueError as error:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(error)}), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "An ingredient with that name already exists."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Ingredient update failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to update ingredient."
        }), 500


# =====================================================
# DELETE INGREDIENT
# Deletion is blocked while any product or customer uses it.
# =====================================================
@ingredients_bp.route("/admin/ingredients/<int:ingredient_id>", methods=["DELETE"])
@admin_required
def admin_delete_ingredient(ingredient_id):
    try:
        ingredient = ingredient_query().filter_by(id=ingredient_id).first()

        if ingredient is None:
            return jsonify({
                "status": "error",
                "message": "Ingredient not found."
            }), 404

        product_count = len(ingredient.products)
        customer_count = len(ingredient.users)

        if product_count or customer_count:
            return jsonify({
                "status": "error",
                "message": (
                    "This ingredient cannot be deleted because it is still "
                    "referenced by existing products or customer preferences."
                ),
                "productUsage": product_count,
                "customerUsage": customer_count
            }), 409

        ingredient_id_value = ingredient.id
        ingredient_name = ingredient.name

        db.session.delete(ingredient)
        record_ingredient_action(
            session.get("user_id"),
            "DELETE",
            ingredient_id_value,
            ingredient_name
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Ingredient deleted successfully."
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Ingredient deletion failed.")
        return jsonify({
            "status": "error",
            "message": "Unable to delete ingredient."
        }), 500
