from backend.app.services.officer_service import (
    get_officer_by_username
)

from backend.app.core.security import (
    verify_password,
    create_access_token
)


def login(username: str, password: str):

    officer = get_officer_by_username(username)

    if officer is None:
        raise Exception("Invalid username or password")

    if not officer["is_active"]:
        raise Exception("Officer disabled")

    if not verify_password(
        password,
        officer["password_hash"]
    ):
        raise Exception("Invalid username or password")

    token = create_access_token(
        {
            "officer_id": officer["officer_id"],
            "username": officer["username"],
            "role": officer["role"]
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "officer": {
            "id": officer["officer_id"],
            "name": officer["full_name"],
            "role": officer["role"]
        }
    }
