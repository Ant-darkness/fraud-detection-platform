from backend.app.services.officer_service import get_officer_by_email, update_last_login
from backend.app.core.security import verify_password, create_access_token


def login(email: str, password: str):
    # Hakikisha email inafanyiwa strip
    officer = get_officer_by_email(email.strip())
    if officer is None:
        raise Exception("Invalid credentials")
    if not officer["is_active"]:
        raise Exception("Account disabled")

    # Usafi wa password kabla ya uhakiki
    password_clean = password.strip() if password else ""

    if not verify_password(password_clean, officer["password_hash"]):
        raise Exception("Invalid credentials")

    update_last_login(officer["officer_id"])
    token = create_access_token({
        "officer_id": officer["officer_id"],
        "email": officer["email"],
        "role": officer["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "must_change_password": officer["must_change_password"],
        "officer": {
            "officer_id": officer["officer_id"],
            "full_name": officer["full_name"],
            "role": officer["role"]
        }
    }
