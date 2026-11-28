
from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint

from extensions import db


# =====================================================
# ASSOCIATION TABLES
# These connect records that can have multiple values.
# =====================================================

user_allergens = db.Table(
    "user_allergens",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("allergen_id", db.Integer, db.ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True)
)

user_avoided_ingredients = db.Table(
    "user_avoided_ingredients",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("ingredient_id", db.Integer, db.ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True)
)

user_bread_preferences = db.Table(
    "user_bread_preferences",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("bread_preference_id", db.Integer, db.ForeignKey("bread_preference_types.id", ondelete="CASCADE"), primary_key=True)
)

product_ingredients = db.Table(
    "product_ingredients",
    db.Column("product_id", db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    db.Column("ingredient_id", db.Integer, db.ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True)
)

product_allergens = db.Table(
    "product_allergens",
    db.Column("product_id", db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    db.Column("allergen_id", db.Integer, db.ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True)
)

product_bread_preferences = db.Table(
    "product_bread_preferences",
    db.Column("product_id", db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    db.Column("bread_preference_id", db.Integer, db.ForeignKey("bread_preference_types.id", ondelete="CASCADE"), primary_key=True)
)


# =====================================================
# USERS
# Customers and administrators share one account table.
# =====================================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    birthdate = db.Column(db.Date, nullable=True)
    role = db.Column(db.String(20), nullable=False, default="customer")
    profile_image_url = db.Column(db.String(500), nullable=True)

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    joined_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    preferences = db.relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    allergens = db.relationship(
        "Allergen",
        secondary=user_allergens,
        back_populates="users"
    )

    avoided_ingredients = db.relationship(
        "Ingredient",
        secondary=user_avoided_ingredients,
        back_populates="users"
    )

    bread_preferences = db.relationship(
        "BreadPreferenceType",
        secondary=user_bread_preferences,
        back_populates="users"
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# =====================================================
# USER DIETARY PREFERENCES
# =====================================================

class UserPreference(db.Model):
    __tablename__ = "user_preferences"

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    sugar_limit = db.Column(db.String(100), nullable=False, default="Not set")
    fiber_goal = db.Column(db.String(100), nullable=False, default="Not set")
    primary_style = db.Column(db.String(100), nullable=False, default="Not set")

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="preferences")


# =====================================================
# ALLERGENS
# =====================================================

class Allergen(db.Model):
    __tablename__ = "allergens"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), unique=True, nullable=False)

    users = db.relationship(
        "User",
        secondary=user_allergens,
        back_populates="allergens"
    )

    products = db.relationship(
        "Product",
        secondary=product_allergens,
        back_populates="allergens"
    )


# =====================================================
# INGREDIENTS
# =====================================================

class Ingredient(db.Model):
    __tablename__ = "ingredients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)

    users = db.relationship(
        "User",
        secondary=user_avoided_ingredients,
        back_populates="avoided_ingredients"
    )

    products = db.relationship(
        "Product",
        secondary=product_ingredients,
        back_populates="ingredients"
    )


# =====================================================
# ADMIN PRODUCT CATEGORIES
# =====================================================

class ProductCategory(db.Model):
    __tablename__ = "product_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)

    products = db.relationship("Product", back_populates="category")


# =====================================================
# CUSTOMER BREAD PREFERENCE CATEGORIES
# =====================================================

class BreadPreferenceType(db.Model):
    __tablename__ = "bread_preference_types"

    id = db.Column(db.Integer, primary_key=True)

    slug = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(150), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    tag = db.Column(db.String(100), nullable=True)

    users = db.relationship(
        "User",
        secondary=user_bread_preferences,
        back_populates="bread_preferences"
    )

    products = db.relationship(
        "Product",
        secondary=product_bread_preferences,
        back_populates="bread_preferences"
    )


# =====================================================
# BREAD PRODUCTS
# =====================================================

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("product_categories.id"),
        nullable=True
    )

    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

    # Additional admin product information
    subtitle = db.Column(db.String(180), nullable=True)

    recipe_update_flag = db.Column(
        db.Boolean,
        nullable=False,
        default=False
)

    image_filename = db.Column(db.String(255), nullable=True)
    image_metadata = db.Column(db.String(255), nullable=True)

    # Serving and nutrition information
    serving_size = db.Column(db.String(100), nullable=True)

    calories = db.Column(db.Numeric(8, 2), nullable=True)
    sugar_g = db.Column(db.Numeric(8, 2), nullable=True)
    protein_g = db.Column(db.Numeric(8, 2), nullable=True)
    fat_g = db.Column(db.Numeric(8, 2), nullable=True)
    fiber_g = db.Column(db.Numeric(8, 2), nullable=True)
    sodium_mg = db.Column(db.Numeric(8, 2), nullable=True)

    # Product safety information
    cross_contact_notes = db.Column(db.Text, nullable=True)

    verification_status = db.Column(
        db.String(20),
        nullable=False,
        default="Unknown"
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Active"
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    category = db.relationship("ProductCategory", back_populates="products")

    ingredients = db.relationship(
        "Ingredient",
        secondary=product_ingredients,
        back_populates="products"
    )

    allergens = db.relationship(
        "Allergen",
        secondary=product_allergens,
        back_populates="products"
    )

    bread_preferences = db.relationship(
        "BreadPreferenceType",
        secondary=product_bread_preferences,
        back_populates="products"
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="product",
        cascade="all, delete-orphan"
    )


# =====================================================
# CUSTOMER FAVORITES
# =====================================================

class Favorite(db.Model):
    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="favorites")
    product = db.relationship("Product", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="unique_user_favorite"),
    )


# =====================================================
# ADMIN ACTIVITY LOGS
# =====================================================

# =====================================================
# CUSTOMER FEEDBACK AND INQUIRIES
# =====================================================

class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)

    customer_name = db.Column(db.String(150), nullable=False)
    customer_email = db.Column(db.String(255), nullable=False)

    category = db.Column(db.String(30), nullable=False)
    subject = db.Column(db.String(180), nullable=False)
    message = db.Column(db.Text, nullable=False)

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Pending"
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


# =====================================================
# ADMIN ACTIVITY LOGS
# =====================================================

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)

    actor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(100), nullable=True)
    entity_id = db.Column(db.String(100), nullable=True)
    details = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    actor = db.relationship("User")
