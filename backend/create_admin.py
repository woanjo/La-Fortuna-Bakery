
from getpass import getpass

from werkzeug.security import generate_password_hash

from app import app
from extensions import db
from models import User


def create_admin():
    print("\n=== La Fortuna Bakeshop ===")
    print("Create Administrator Account\n")

    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()
    email = input("Email address: ").strip().lower()
    username = input("Username: ").strip()

    if not all([first_name, last_name, email, username]):
        print("Error: All fields are required.")
        return

    password = getpass("Administrator password: ")
    confirm_password = getpass("Confirm password: ")

    if len(password) < 12:
        print("Error: Password must contain at least 12 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    with app.app_context():
        existing = User.query.filter(
            (db.func.lower(User.email) == email) |
            (db.func.lower(User.username) == username.lower())
        ).first()

        if existing:
            print("Error: Email address or username already exists.")
            return

        admin = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password_hash=generate_password_hash(password),
            role="admin",
            is_active=True
        )

        try:
            db.session.add(admin)
            db.session.commit()

            print("\nAdministrator account created successfully!")
            print("Account ID:", admin.id)
            print("Username:", admin.username)
            print("Role:", admin.role)

        except Exception:
            db.session.rollback()
            print("Account creation failed.")
            raise

        finally:
            db.session.remove()


if __name__ == "__main__":
    create_admin()
