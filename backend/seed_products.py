
from datetime import datetime, timezone
from pathlib import PurePosixPath

from app import app
from extensions import db
from models import Product, ProductCategory, Ingredient, Allergen


# Existing sample products from admin_bread_management.js
SEED_PRODUCTS = [
    {
        "code": "LFB-022",
        "name": "Hopia Munggo",
        "sub": "Classic Mung Filling",
        "cat": "Flaky Pastries",
        "desc": "Flaky layered pastry with sweet yellow mung bean filling.",
        "image": "images/hopia-munggo.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Sweet Yellow Mung Bean Paste",
            "Cane Sugar", "Vegetable Shortening", "Sesame Seeds"
        ],
        "allergens": ["Wheat / Gluten", "Sesame"],
        "cross": "Shared equipment with tree nuts.",
        "kcal": 175,
        "sugar": 4.2,
        "added": "2026-09-02",
        "updated": "2026-11-20"
    },
    {
        "code": "LFB-031",
        "name": "Steamed Sourdough Bun",
        "sub": "Wintermelon Infusion",
        "cat": "Steamed & Glutinous",
        "desc": "Slow-fermented sourdough bun steamed with wintermelon.",
        "image": "images/steamed-sourdough-bun.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Sourdough Starter",
            "Wintermelon", "Purified Water"
        ],
        "allergens": ["Wheat / Gluten"],
        "kcal": 140,
        "sugar": 2.1,
        "added": "2026-09-10",
        "updated": "2026-11-19"
    },
    {
        "code": "LFB-002",
        "name": "Traditional Hopia Baboy",
        "sub": "",
        "flag": True,
        "cat": "Flaky Pastries",
        "desc": "Savory candied wintermelon and scallion filling.",
        "image": "images/hopia-baboy.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Pork Lard",
            "Wintermelon", "Cane Sugar"
        ],
        "allergens": ["Pork Lard", "Wheat / Gluten"],
        "verify": "Unverified",
        "kcal": 210,
        "sugar": 7.5,
        "added": "2026-08-14",
        "updated": "2026-11-18"
    },
    {
        "code": "LFB-009",
        "name": "Masi de Cebu",
        "sub": "Glutinous Peanut Confection",
        "cat": "Steamed & Glutinous",
        "desc": "Steamed glutinous rice dumpling with ground peanut filling.",
        "image": "images/masi-de-cebu.jpg",
        "ingredients": [
            "Glutinous Rice Flour", "Roasted Peanuts",
            "Cane Sugar", "Purified Water"
        ],
        "allergens": ["Peanuts"],
        "kcal": 160,
        "sugar": 6.1,
        "added": "2026-08-20",
        "updated": "2026-11-17"
    },
    {
        "code": "LFB-001",
        "name": "Pan de Coco Tradisyonal",
        "sub": "",
        "cat": "Bread (Hearth & Pan)",
        "desc": "Traditional Filipino sweet bread filled with grated coconut and muscovado sugar, with a soft texture and lightly golden crust.",
        "image": "images/pan-de-coco.jpg",
        "imageName": "pan_de_coco_demo.webp",
        "imageMeta": "WebP · 1200×900",
        "ingredients": [
            "Unbleached Bread Flour", "Fresh Grated Coconut",
            "Raw Muscovado Sugar", "Purified Water",
            "Active Dry Yeast", "Ilocos Sea Salt"
        ],
        "allergens": ["Wheat / Gluten", "Coconut"],
        "cross": "Prepared in a bakery handling dairy, eggs, and sesame. Shared equipment and tables may result in cross-contact.",
        "verify": "Unverified",
        "serving": "65 g (1 pc)",
        "kcal": 185,
        "sugar": 6.2,
        "added": "2026-11-10",
        "updated": "2026-11-12"
    },
    {
        "code": "LFB-003",
        "name": "Traditional Pan de Sal",
        "sub": "",
        "cat": "Bread (Hearth & Pan)",
        "desc": "Artisan wood-fired rolls baked with slow fermentation.",
        "image": "images/traditional-pan-de-sal.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Purified Water",
            "Cane Sugar", "Ilocos Sea Salt", "Active Dry Yeast"
        ],
        "allergens": ["Wheat / Gluten"],
        "serving": "35 g (1 roll)",
        "kcal": 140,
        "sugar": 3,
        "added": "2026-06-01",
        "updated": "2026-11-10"
    },
    {
        "code": "LFB-004",
        "name": "Sprouted Whole Wheat Pan de Sal",
        "sub": "",
        "cat": "Bread (Hearth & Pan)",
        "desc": "Cold-milled sprouted grains with low glycemic load.",
        "image": "images/sprouted-pan-de-sal.jpg",
        "ingredients": [
            "Sprouted Whole Wheat Flour", "Purified Water",
            "Ilocos Sea Salt", "Sourdough Starter"
        ],
        "allergens": ["Wheat / Gluten"],
        "kcal": 130,
        "sugar": 1.8,
        "added": "2026-06-12",
        "updated": "2026-11-08"
    },
    {
        "code": "LFB-005",
        "name": "Traditional Pan de Suelo",
        "sub": "",
        "cat": "Bread (Hearth & Pan)",
        "desc": "Hearth-floor baked using ancestral leavening techniques.",
        "image": "images/pan-de-suelo.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Purified Water",
            "Ilocos Sea Salt", "Sourdough Starter"
        ],
        "allergens": ["Wheat / Gluten"],
        "kcal": 145,
        "sugar": 2.1,
        "added": "2026-06-20",
        "updated": "2026-11-05"
    },
    {
        "code": "LFB-006",
        "name": "Ensaymada Especial Cebuana",
        "sub": "",
        "cat": "Sweet Merienda",
        "desc": "Butter-rich sweet bread topped with aged cheese.",
        "image": "images/ensaymada-especial.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Butter", "Egg Yolks",
            "Cane Sugar", "Aged Cheese"
        ],
        "allergens": ["Wheat / Gluten", "Milk (Dairy)", "Egg"],
        "kcal": 260,
        "sugar": 12,
        "added": "2026-07-02",
        "updated": "2026-11-02"
    },
    {
        "code": "LFB-007",
        "name": "Brown Sugar Tikoy Slices",
        "sub": "",
        "cat": "Steamed & Glutinous",
        "desc": "Slow-steamed sweet rice cake with dark caramel.",
        "image": "images/brown-sugar-tikoy.jpg",
        "ingredients": [
            "Glutinous Rice Flour", "Dark Brown Sugar",
            "Purified Water", "Sesame Seeds"
        ],
        "allergens": ["Sesame"],
        "kcal": 175,
        "sugar": 10.5,
        "added": "2026-07-15",
        "updated": "2026-10-28"
    },
    {
        "code": "LFB-008",
        "name": "Mamon Tostado",
        "sub": "",
        "cat": "Sweet Merienda",
        "desc": "Twice-baked sponge slices.",
        "image": "images/mamon-tostado.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Egg Yolks", "Cane Sugar"
        ],
        "allergens": ["Wheat / Gluten", "Egg"],
        "verify": "Unknown",
        "kcal": None,
        "sugar": None,
        "status": "Inactive",
        "added": "2026-05-30",
        "updated": "2026-10-20"
    },
    {
        "code": "LFB-010",
        "name": "Siopao Asado",
        "sub": "",
        "cat": "Steamed & Glutinous",
        "desc": "Steamed bun with sweet-savory pork filling.",
        "image": "images/siopao-asado.jpg",
        "ingredients": [
            "Enriched Wheat Flour", "Pork Lard",
            "Cane Sugar", "Active Dry Yeast"
        ],
        "allergens": ["Wheat / Gluten", "Soy", "Pork Lard"],
        "kcal": 290,
        "sugar": 5.5,
        "added": "2026-05-12",
        "updated": "2026-10-15"
    }
]


def convert_date(value):
    """Convert a YYYY-MM-DD string into a timezone-aware datetime."""
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def seed_products():
    with app.app_context():

        # Load existing catalog records
        categories = {
            item.name: item
            for item in ProductCategory.query.all()
        }

        ingredients = {
            item.name: item
            for item in Ingredient.query.all()
        }

        allergens = {
            item.name: item
            for item in Allergen.query.all()
        }

        # Validate catalog references before inserting anything
        missing_categories = set()
        missing_ingredients = set()
        missing_allergens = set()

        for item in SEED_PRODUCTS:
            if item["cat"] not in categories:
                missing_categories.add(item["cat"])

            for name in item["ingredients"]:
                if name not in ingredients:
                    missing_ingredients.add(name)

            for name in item["allergens"]:
                # Pork Lard is an ingredient restriction,
                # not an entry in the medical allergen catalog.
                if name != "Pork Lard" and name not in allergens:
                    missing_allergens.add(name)

        if missing_categories or missing_ingredients or missing_allergens:
            raise RuntimeError(
                "Missing catalog entries. "
                f"Categories: {sorted(missing_categories)}; "
                f"Ingredients: {sorted(missing_ingredients)}; "
                f"Allergens: {sorted(missing_allergens)}"
            )

        inserted = 0
        skipped = 0

        for item in SEED_PRODUCTS:

            # Prevent duplicate product codes when rerunning this script
            existing = Product.query.filter_by(code=item["code"]).first()

            if existing:
                print(f"Skipped existing product: {item['code']}")
                skipped += 1
                continue

            image = item.get("image")

            product = Product(
                code=item["code"],
                name=item["name"],
                subtitle=item.get("sub") or None,
                recipe_update_flag=item.get("flag", False),

                category=categories[item["cat"]],
                description=item.get("desc"),
                image_url=image,

                image_filename=(
                    item.get("imageName")
                    or (PurePosixPath(image).name if image else None)
                ),
                image_metadata=item.get("imageMeta"),

                ingredients=[
                    ingredients[name] for name in item["ingredients"]
                ],

                # Exclude Pork Lard from the allergen relationship.
                # It remains recorded in product.ingredients.
                allergens=[
                    allergens[name]
                    for name in item["allergens"]
                    if name != "Pork Lard"
                ],

                cross_contact_notes=item.get("cross", ""),
                verification_status=item.get("verify", "Verified"),
                serving_size=item.get("serving", "1 piece"),

                calories=item.get("kcal"),
                sugar_g=item.get("sugar"),
                protein_g=item.get("protein"),
                fat_g=item.get("fat"),
                fiber_g=item.get("fiber"),
                sodium_mg=item.get("sodium"),

                status=item.get("status", "Active"),

                created_at=convert_date(item["added"]),
                updated_at=convert_date(item["updated"])
            )

            db.session.add(product)
            inserted += 1

        try:
            db.session.commit()

            print("\nProduct import completed!")
            print("Inserted:", inserted)
            print("Skipped:", skipped)
            print("Total sample records:", len(SEED_PRODUCTS))

            print(
                "\nNote: Pork Lard was retained as an ingredient "
                "and was not classified as a medical allergen."
            )

        except Exception:
            db.session.rollback()
            raise


if __name__ == "__main__":
    seed_products()
