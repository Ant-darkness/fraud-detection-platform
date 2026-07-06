from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password
from backend.app.core.password_utils import generate_temporary_password


def seed_initial_admin():
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT COUNT(*)
            FROM officers
            WHERE role='ADMIN'
        """)

        count = cursor.fetchone()[0]

        if count > 0:
            return  # admin already exists

        temp_password = generate_temporary_password()

        cursor.execute("""
            INSERT INTO officers (
                full_name,
                username,
                email,
                password_hash,
                role,
                is_active,
                must_change_password
            )
            VALUES (%s,%s,%s,%s,'ADMIN',TRUE,TRUE)
        """, (
            "System Administrator",
            "admin",
            "admin@bot.local",
            hash_password(temp_password)
        ))

        conn.commit()

        print("ADMIN CREATED ON FIRST RUN")
        print("TEMP PASSWORD:", temp_password)

    finally:
        cursor.close()
        conn.close()
