import os
from dotenv import load_dotenv

from backend.app.services.officer_service import create_initial_admin

load_dotenv()


def main():

    officer_id = create_initial_admin(
        full_name="System Administrator2",
        username=os.getenv("ADMIN_USERNAME"),
        email=os.getenv("ADMIN_EMAIL"),
        password=os.getenv("ADMIN_PASSWORD")
    )

    print("=" * 60)
    print("SYSTEM ADMIN CREATED SUCCESSFULLY")
    print("=" * 60)
    print("Officer ID :", officer_id)
    print("Username   :", os.getenv("ADMIN_USERNAME"))
    print("Email      :", os.getenv("ADMIN_EMAIL"))
    print("Password   :", os.getenv("ADMIN_PASSWORD"))
    print("=" * 60)
    print("IMPORTANT: Login and change password immediately")
    print("=" * 60)


if __name__ == "__main__":
    main()
