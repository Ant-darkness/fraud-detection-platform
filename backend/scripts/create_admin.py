import secrets

from backend.app.services.officer_service import (
    create_initial_admin
)

password = secrets.token_urlsafe(16)

create_initial_admin(

    full_name="System Administrator",

    username="admin",

    password=password

)

print("=" * 60)

print("INITIAL ADMIN CREATED")

print()

print("email : admin@1234")

print(f"Password : {password}")

print()

print("=" * 60)
