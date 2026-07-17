import os
from dotenv import load_dotenv
from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password
from backend.app.core.password_utils import generate_temporary_password

load_dotenv()  # Hakikisha anakumbuka kusoma .env yako!


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
            return  # Kama tayari kuna Admin, usifanye kitu yoyote

        # 1. Soma taarifa kutoka kwenye .env zilizowekwa na Developer
        env_username = os.getenv("ADMIN_USERNAME", "admin")
        env_email = os.getenv("ADMIN_EMAIL", "admin@bot.go.tz")
        env_password = os.getenv("ADMIN_PASSWORD")

        # 2. Kama hakuna password kwenye .env, ndipo tuzalishe ya dharura
        if env_password:
            admin_password = env_password
            is_temp = False
        else:
            admin_password = generate_temporary_password()
            is_temp = True

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
            VALUES (%s, %s, %s, %s, 'ADMIN', TRUE, TRUE)
        """, (
            "System Administrator",
            env_username.lower().strip(),
            env_email.lower().strip(),
            hash_password(admin_password)
        ))

        conn.commit()

        print("=" * 60)
        print("ADMIN CREATED SUCCESSFULLY ON INITIAL SEED")
        print("=" * 60)
        print("Username   :", env_username)
        print("Email      :", env_email)
        if is_temp:
            print("TEMP PASSWORD (GENERATED):", admin_password)
        else:
            print("PASSWORD   : [Iliyopo kwenye .env yako ya siri]")
        print("=" * 60)

    finally:
        cursor.close()
        conn.close()
