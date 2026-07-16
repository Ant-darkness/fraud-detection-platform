import secrets
from datetime import datetime, timedelta
from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password


def change_password(officer_id: int, new_password: str):
    """Inabadilisha password kwa officer aliyelogin ndani ya mfumo"""
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


def generate_and_save_token(email: str) -> str:
    """Inazalisha token ya password reset, inafuta za zamani, na kuihifadhi database"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Mtafute afisa kwa email yake
        cursor.execute(
            "SELECT officer_id FROM officers WHERE email = %s AND is_active = TRUE", (email,))
        officer = cursor.fetchone()
        if not officer:
            return None

        officer_id = officer[0]

        # 2. KUOKOA STORAGE: Futa token zote zilizowahi kuzalishwa kwa huyu afisa huko nyuma au zilizo-expire
        cursor.execute(
            "DELETE FROM password_reset_tokens WHERE officer_id = %s OR expires_at < %s",
            (officer_id, datetime.utcnow())
        )

        # 3. Tengeneza secure cryptographical token ya kipekee
        raw_token = secrets.token_urlsafe(32)
        expiration_time = datetime.utcnow() + timedelta(minutes=15)  # Inadumu dika 15 tu

        # 4. Hifadhi Token mpya kwenye database
        cursor.execute(
            """
            INSERT INTO password_reset_tokens (officer_id, token_hash, expires_at, is_used)
            VALUES (%s, %s, %s, FALSE)
            """,
            (officer_id, raw_token, expiration_time)
        )
        conn.commit()
        return raw_token

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def verify_token_and_reset_password(token: str, new_password: str) -> bool:
    """Inahakiki token ya reset password, na kuweka password mpya ikikubaliwa"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Hakiki kama token ipo na haijatumika au ku-expire
        cursor.execute(
            """
            SELECT token_id, officer_id FROM password_reset_tokens
            WHERE token_hash = %s AND is_used = FALSE AND expires_at > %s
            """,
            (token, datetime.utcnow())
        )
        token_record = cursor.fetchone()
        if not token_record:
            return False

        token_id, officer_id = token_record

        # 2. Badilisha password ya afisa (Tumia password hashing hapa!)
        hashed_pwd = hash_password(new_password)
        cursor.execute(
            """
            UPDATE officers 
            SET password_hash = %s, must_change_password = FALSE, password_changed_at = NOW()
            WHERE officer_id = %s
            """,
            (hashed_pwd, officer_id)
        )

        # 3. Weka alama kuwa token imetumika
        cursor.execute(
            "UPDATE password_reset_tokens SET is_used = TRUE WHERE token_id = %s",
            (token_id,)
        )

        # 4. Safisha database kwa kufuta token zote zilizo-expire
        cursor.execute(
            "DELETE FROM password_reset_tokens WHERE expires_at < %s", (datetime.utcnow(),))

        conn.commit()
        return True

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
