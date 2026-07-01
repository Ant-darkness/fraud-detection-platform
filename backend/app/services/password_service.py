from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password


def change_password(officer_id: int, new_password: str):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            UPDATE officers
            SET
                password_hash = %s,
                must_change_password = FALSE,
                password_changed_at = NOW()
            WHERE officer_id = %s
            """,
            (
                hash_password(new_password),
                officer_id
            )
        )

        conn.commit()

    finally:
        cursor.close()
        conn.close()
