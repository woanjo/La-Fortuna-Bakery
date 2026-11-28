import os

from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import text

from extensions import db, migrate

# Load environment variables from backend/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

# Retrieve environment variables by their names
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from .env")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is missing from .env")

# Initialize Flask
app = Flask(__name__)

# Configure PostgreSQL
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Configure sessions
app.config["SECRET_KEY"] = SECRET_KEY
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

# Initialize database and migrations
db.init_app(app)
migrate.init_app(app, db)

# Register database models
import models

# Register product API routes
from product_routes import products_bp
app.register_blueprint(products_bp)

# Register ingredient API routes
from ingredient_routes import ingredients_bp
app.register_blueprint(ingredients_bp)

# Register authentication routes
from auth_routes import auth_bp
app.register_blueprint(auth_bp)

from feedback_routes import feedback_bp
app.register_blueprint(feedback_bp)

# Local development CORS configuration
allowed_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
]

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    supports_credentials=True
)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "La Fortuna Bakeshop API is running!"
    }), 200


@app.route("/api/health/db", methods=["GET"])
def database_health_check():
    try:
        with db.engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()

        return jsonify({
            "status": "success",
            "message": "Flask is connected to PostgreSQL!",
            "database": database_name
        }), 200

    except Exception:
        app.logger.exception("Database health check failed.")
        return jsonify({
            "status": "error",
            "message": "Database connection unavailable."
        }), 503


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
