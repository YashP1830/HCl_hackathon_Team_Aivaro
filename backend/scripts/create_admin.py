"""Manually create/promote the first admin account in a trusted local environment.

Run from backend/: python -m scripts.create_admin
Do not expose this as a public API endpoint.
"""
from getpass import getpass

from sqlalchemy import select

from app.api.dependencies import hash_password
from app.db.session import SessionLocal
from app.models.entities import User


def main() -> None:
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password (10+ characters): ")
    if len(password) < 10:
        raise SystemExit("Password must contain at least 10 characters.")
    if not name or not email or "@" not in email:
        raise SystemExit("Enter a valid name and email address.")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(name=name, email=email, password_hash=hash_password(password), role="admin")
            db.add(user)
        else:
            user.name = name
            user.password_hash = hash_password(password)
            user.role = "admin"
        db.commit()
        print(f"Admin account ready: {email}")


if __name__ == "__main__":
    main()
