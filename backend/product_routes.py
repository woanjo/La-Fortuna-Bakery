
from functools import wraps
from decimal import Decimal, InvalidOperation
from datetime import datetime, timezone
import re

from flask import Blueprint, jsonify, current_app, request, session
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from extensions import db
from models import (
    User,
    Product,
    ProductCategory,
    Ingredient,
    Allergen,
    AuditLog
)

products_bp = Blueprint("products", __name__, url_prefix="/api")


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
# PRODUCT SERIALIZER
# =====================================================

def serialize_product(product):
    return {
        "id": product.id,
        "code": product.code,
        "name": product.name,
        "sub": product.subtitle,
        "flag": product.recipe_update_flag,

        "categoryId": product.category_id,
        "cat": product.category.name if product.category else None,

        "desc": product.description,
        "image": product.image_url,
        "imageName": product.image_filename,
        "imageMeta": product.image_metadata,

        "ingredients": [
            ingredient.name for ingredient in product.ingredients
        ],

        "allergens": [
            allergen.name for allergen in product.allergens
        ],

        "cross": product.cross_contact_notes,
        "verify": product.verification_status,
        "serving": product.serving_size,

        "kcal": float(product.calories) if product.calories is not None else None,
        "sugar": float(product.sugar_g) if product.sugar_g is not None else None,
        "protein": float(product.protein_g) if product.protein_g is not None else None,
        "fat": float(product.fat_g) if product.fat_g is not None else None,
        "fiber": float(product.fiber_g) if product.fiber_g is not None else None,
        "sodium": float(product.sodium_mg) if product.sodium_mg is not None else None,

        "status": product.status,

        "added": product.created_at.date().isoformat() if product.created_at else None,
        "updated": product.updated_at.date().isoformat() if product.updated_at else None
    }


def product_query():
    return (
        Product.query
        .options(
            selectinload(Product.category),
            selectinload(Product.ingredients),
            selectinload(Product.allergens)
        )
    )


# =====================================================
# INPUT VALIDATION
# =====================================================

def clean_text(value, field, max_length=None, required=False):
    if value is None:
        value = ""

    if not isinstance(value, str):
        raise ValueError(f"{field} must be text.")

    value = value.strip()

    if required and not value:
        raise ValueError(f"{field} is required.")

    if max_length and len(value) > max_length:
        raise ValueError(
            f"{field} must not exceed {max_length} characters."
        )

    return value or None


def clean_number(value, field):
    if value is None or value == "":
        return None

    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f"{field} must be a valid number.")

    if not number.is_finite() or number < 0:
        raise ValueError(f"{field} cannot be negative or invalid.")

    if number > Decimal("999999.99"):
        raise ValueError(f"{field} is too large.")

    return number.quantize(Decimal("0.01"))


def clean_boolean(value, field):
    if isinstance(value, bool):
        return value

    if value in (None, 0, 1):
        return bool(value)

    raise ValueError(f"{field} must be true or false.")


def resolve_category(value):
    if value is None or value == "":
        return None

    if isinstance(value, int):
        category = db.session.get(ProductCategory, value)
    else:
        category = ProductCategory.query.filter(
            ProductCategory.name.ilike(str(value).strip())
        ).first()

    if category is None:
        raise ValueError("The selected product category does not exist.")

    return category


def resolve_related_records(model, names, field_name):
    if names is None:
        return []

    if not isinstance(names, list):
        raise ValueError(f"{field_name} must be a list.")

    cleaned_names = []

    for item in names:
        if not isinstance(item, str) or not item.strip():
            raise ValueError(f"{field_name} contains an invalid entry.")

        name = item.strip()

        if name.casefold() not in {
            existing.casefold() for existing in cleaned_names
        }:
            cleaned_names.append(name)

    if not cleaned_names:
        return []

    records = model.query.filter(
        db.func.lower(model.name).in_([
            name.lower() for name in cleaned_names
        ])
    ).all()

    found = {record.name.casefold(): record for record in records}

    missing = [
        name for name in cleaned_names
        if name.casefold() not in found
    ]

    if missing:
        raise ValueError(
            f"Unknown {field_name}: {', '.join(missing)}"
        )

    return [found[name.casefold()] for name in cleaned_names]


def generate_product_code(name):
    base = re.sub(r"[^A-Z0-9]+", "-", name.upper()).strip("-")
    base = (base[:42] or "BREAD")

    candidate = base
    counter = 2

    while Product.query.filter_by(code=candidate).first():
        suffix = f"-{counter}"
        candidate = base[:50 - len(suffix)] + suffix
        counter += 1

    return candidate


# =====================================================
# APPLY PRODUCT DATA
# =====================================================

def apply_product_data(product, data, creating=False):
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    name = clean_text(
        data.get("name"),
        "Product name",
        max_length=150,
        required=creating
    )

    if name is not None:
        product.name = name

    if creating and not product.name:
        raise ValueError("Product name is required.")

    if "code" in data or creating:
        code = clean_text(
            data.get("code"),
            "Product code",
            max_length=50
        )

        product.code = code or generate_product_code(product.name)

    if "sub" in data:
        product.subtitle = clean_text(
            data["sub"], "Subtitle", max_length=180
        )

    if "flag" in data:
        product.recipe_update_flag = clean_boolean(
            data["flag"], "Recipe update flag"
        )

    if "categoryId" in data or "cat" in data:
        category_value = data.get("categoryId")

        if category_value is None:
            category_value = data.get("cat")

        product.category = resolve_category(category_value)

    elif creating:
        raise ValueError("A product category is required.")

    if "desc" in data:
        product.description = clean_text(data["desc"], "Description")

    # Image hosting will be connected in a later step.
    # Only accept an actual URL, never a Base64 data URL.
    if "image" in data:
        image_url = clean_text(
            data["image"], "Image URL", max_length=500
        )

        if image_url and (
            not image_url.startswith("https://")
            and not image_url.startswith("http://")
        ):
            raise ValueError("Image must be a valid HTTP or HTTPS URL.")

        product.image_url = image_url

    if "imageName" in data:
        product.image_filename = clean_text(
            data["imageName"], "Image filename", max_length=255
        )

    if "imageMeta" in data:
        product.image_metadata = clean_text(
            data["imageMeta"], "Image metadata", max_length=255
        )

    if "ingredients" in data:
        product.ingredients = resolve_related_records(
            Ingredient, data["ingredients"], "ingredients"
        )

    elif creating:
        product.ingredients = []

    if "allergens" in data:
        product.allergens = resolve_related_records(
            Allergen, data["allergens"], "allergens"
        )

    elif creating:
        product.allergens = []

    if "cross" in data:
        product.cross_contact_notes = clean_text(
            data["cross"], "Cross-contact notes"
        )

    if "verify" in data:
        verification = clean_text(
            data["verify"], "Verification status", max_length=20
        )

        allowed = {"Unknown", "Pending", "Verified", "Unverified"}

        if verification not in allowed:
            raise ValueError("Invalid verification status.")

        product.verification_status = verification

    if "serving" in data:
        product.serving_size = clean_text(
            data["serving"], "Serving size", max_length=100
        )

    nutrition_fields = {
        "kcal": ("calories", "Calories"),
        "sugar": ("sugar_g", "Sugar"),
        "protein": ("protein_g", "Protein"),
        "fat": ("fat_g", "Fat"),
        "fiber": ("fiber_g", "Fiber"),
        "sodium": ("sodium_mg", "Sodium")
    }

    for key, (attribute, label) in nutrition_fields.items():
        if key in data:
            setattr(
                product,
                attribute,
                clean_number(data[key], label)
            )

    if "status" in data:
        status = clean_text(
            data["status"], "Product status", max_length=20
        )

        if status not in {"Active", "Inactive"}:
            raise ValueError("Product status must be Active or Inactive.")

        product.status = status

    elif creating:
        product.status = "Active"


# =====================================================
# AUDIT LOG
# =====================================================

def record_product_action(user_id, action, product):
    log = AuditLog(
        actor_id=user_id,
        action=action,
        entity_type="Product",
        entity_id=str(product.id),
        details=f"{action}: {product.name}"
    )

    db.session.add(log)


# =====================================================
# PUBLIC PRODUCT LIST
# Customers can retrieve active products only.
# =====================================================

@products_bp.route("/products", methods=["GET"])
def get_products():
    try:
        products = (
            product_query()
            .filter(Product.status == "Active")
            .order_by(Product.updated_at.desc())
            .all()
        )

        return jsonify({
            "status": "success",
            "count": len(products),
            "products": [
                serialize_product(product) for product in products
            ]
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Failed to retrieve products.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve bread products."
        }), 500


# =====================================================
# ADMIN PRODUCT LIST
# Includes active AND inactive products.
# =====================================================

@products_bp.route("/admin/products", methods=["GET"])
@admin_required
def admin_get_products():
    try:
        products = (
            product_query()
            .order_by(Product.updated_at.desc())
            .all()
        )

        return jsonify({
            "status": "success",
            "count": len(products),
            "products": [
                serialize_product(product) for product in products
            ]
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Admin product retrieval failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve products."
        }), 500


# =====================================================
# ADMIN CATALOG
# Categories, ingredients, and allergens.
# =====================================================

@products_bp.route("/admin/product-catalog", methods=["GET"])
@admin_required
def admin_product_catalog():
    try:
        categories = ProductCategory.query.order_by(
            ProductCategory.name.asc()
        ).all()

        ingredients = Ingredient.query.order_by(
            Ingredient.name.asc()
        ).all()

        allergens = Allergen.query.order_by(
            Allergen.name.asc()
        ).all()

        return jsonify({
            "status": "success",
            "categories": [
                {"id": item.id, "name": item.name}
                for item in categories
            ],
            "ingredients": [
                {"id": item.id, "name": item.name}
                for item in ingredients
            ],
            "allergens": [
                {"id": item.id, "name": item.name}
                for item in allergens
            ]
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Product catalog retrieval failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve product catalog."
        }), 500


# =====================================================
# CREATE PRODUCT
# =====================================================

@products_bp.route("/admin/products", methods=["POST"])
@admin_required
def admin_create_product():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    try:
        product = Product(
            code="TEMP",
            name="Temporary",
            status="Active",
            verification_status="Unknown"
        )

        apply_product_data(product, data, creating=True)

        # Ensure generated or supplied product code is unique.
        existing = Product.query.filter_by(code=product.code).first()

        if existing:
            return jsonify({
                "status": "error",
                "message": "That product code is already in use."
            }), 409

        db.session.add(product)
        db.session.flush()

        user_id = session.get("user_id")
        record_product_action(user_id, "CREATE", product)

        db.session.commit()

        saved = product_query().filter_by(id=product.id).first()

        return jsonify({
            "status": "success",
            "message": "Product created successfully.",
            "product": serialize_product(saved)
        }), 201

    except ValueError as error:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "A product with that code already exists."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Product creation failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to create product."
        }), 500


# =====================================================
# UPDATE PRODUCT
# =====================================================

@products_bp.route("/admin/products/<int:product_id>", methods=["PUT"])
@admin_required
def admin_update_product(product_id):
    product = product_query().filter_by(id=product_id).first()

    if product is None:
        return jsonify({
            "status": "error",
            "message": "Product not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    try:
        apply_product_data(product, data)

        duplicate = Product.query.filter(
            Product.code == product.code,
            Product.id != product.id
        ).first()

        if duplicate:
            return jsonify({
                "status": "error",
                "message": "That product code is already in use."
            }), 409

        product.updated_at = datetime.now(timezone.utc)

        record_product_action(
            session.get("user_id"),
            "UPDATE",
            product
        )

        db.session.commit()

        saved = product_query().filter_by(id=product.id).first()

        return jsonify({
            "status": "success",
            "message": "Product updated successfully.",
            "product": serialize_product(saved)
        }), 200

    except ValueError as error:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "A product with that code already exists."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Product update failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to update product."
        }), 500


# =====================================================
# DEACTIVATE PRODUCT
# Soft delete: keeps product history and relationships.
# =====================================================

@products_bp.route(
    "/admin/products/<int:product_id>",
    methods=["DELETE"]
)
@admin_required
def admin_deactivate_product(product_id):
    try:
        product = db.session.get(Product, product_id)

        if product is None:
            return jsonify({
                "status": "error",
                "message": "Product not found."
            }), 404

        product.status = "Inactive"
        product.updated_at = datetime.now(timezone.utc)

        record_product_action(
            session.get("user_id"),
            "DEACTIVATE",
            product
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Product deactivated successfully."
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Product deactivation failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to deactivate product."
        }), 500
