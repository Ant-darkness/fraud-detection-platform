import random
import string
from datetime import datetime, timedelta
from typing import Optional
from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password, verify_password


def change_password(officer_id: int, old_password: Optional[str], new_password: str):
    """Inabadilisha password kwa mfumo thabiti na salama wa bcrypt."""
    new_password_clean = new_password.strip() if new_password else ""
    if not new_password_clean:
        raise Exception("Nenosiri jipya haliwezi kuwa tupu.")

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT password_hash FROM officers WHERE officer_id = %s",
            (officer_id,)
        )
        officer = cursor.fetchone()
        if not officer:
            raise Exception("Afisa hatambuliki kwenye mfumo.")

        current_password_hash = officer[0]

        if old_password is not None:
            old_password_clean = old_password.strip()
            try:
                if not verify_password(old_password_clean, current_password_hash):
                    if old_password_clean != current_password_hash:
                        raise Exception(
                            "Nenosiri la sasa uliloingiza si sahihi!")
            except ValueError:
                if old_password_clean != current_password_hash:
                    raise Exception("Nenosiri la sasa uliloingiza si sahihi!")

        try:
            if current_password_hash and verify_password(new_password_clean, current_password_hash):
                raise Exception(
                    "Nenosiri jipya haliwezi kufanana na nenosiri la sasa.")
        except ValueError:
            if new_password_clean == current_password_hash:
                raise Exception(
                    "Nenosiri jipya haliwezi kufanana na nenosiri la sasa.")

        new_hash = hash_password(new_password_clean)

        cursor.execute(
            """
            UPDATE officers
            SET
                password_hash = %s,
                must_change_password = FALSE,
                password_changed_at = NOW()
            WHERE officer_id = %s
            """,
            (new_hash, officer_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def generate_and_save_token(email: str) -> Optional[str]:
    """Inazalisha 6-digit Secure Security Token ya reset password na kuihifadhi DB."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT officer_id FROM officers WHERE LOWER(email) = LOWER(%s) AND is_active = TRUE",
            (email.strip(),)
        )
        officer = cursor.fetchone()
        if not officer:
            return None

        officer_id = officer[0]

        cursor.execute(
            "DELETE FROM password_reset_tokens WHERE officer_id = %s OR expires_at < %s",
            (officer_id, datetime.utcnow())
        )

        # Inatengeneza Token ya tarakimu 6 (Standard Banking Security OTP)
        raw_token = ''.join(random.choices(string.digits, k=6))
        expiration_time = datetime.utcnow() + timedelta(minutes=15)

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
    """Inahakiki token na kuweka nenosiri jipya."""
    new_password_clean = new_password.strip()
    token_clean = token.strip()

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT token_id, officer_id FROM password_reset_tokens
            WHERE token_hash = %s AND is_used = FALSE AND expires_at > %s
            """,
            (token_clean, datetime.utcnow())
        )
        token_record = cursor.fetchone()
        if not token_record:
            return False

        token_id, officer_id = token_record

        hashed_pwd = hash_password(new_password_clean)
        cursor.execute(
            """
            UPDATE officers 
            SET password_hash = %s, must_change_password = FALSE, password_changed_at = NOW()
            WHERE officer_id = %s
            """,
            (hashed_pwd, officer_id)
        )

        cursor.execute(
            "UPDATE password_reset_tokens SET is_used = TRUE WHERE token_id = %s",
            (token_id,)
        )

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
