from backend.app.services.officer_service import get_officer_by_email
from backend.app.core.security import verify_password, create_access_token
from backend.app.database.connection import get_connection


def update_last_login(officer_id: int):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            UPDATE officers
            SET last_login = NOW()
            WHERE officer_id = %s
            """,
            (officer_id,)
        )

        conn.commit()

    finally:
        cursor.close()
        conn.close()


def login(email: str, password: str):

    officer = get_officer_by_email(email)
    print(officer)
    print(len(password))

    if officer is None:
        raise Exception("Invalid credentials")

    if not officer["is_active"]:
        raise Exception("Account disabled")

    if not verify_password(password, officer["password_hash"]):
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
        "must_change_password":officer["must_change_password"],
        "officer": {
            "officer_id": officer["officer_id"],
            "full_name": officer["full_name"],
            "role": officer["role"]
        }
    }
    

login("admin@bot.go.tz", "reVr%5e07aD5")
