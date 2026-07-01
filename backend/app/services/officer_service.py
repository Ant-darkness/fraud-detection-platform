from psycopg2.extras import RealDictCursor
from backend.app.database.connection import get_connection
from backend.app.core.security import hash_password
from backend.app.core.password_utils import generate_temporary_password



def create_initial_admin(

    full_name: str,
    username: str,
    password: str

):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT officer_id
            FROM officers
            WHERE LOWER(username)=LOWER(%s)
            """,
            (username,)
        )

        if cursor.fetchone():
            raise Exception(
                "Admin already exists."
            )

        password_hash = hash_password(
            password
        )

        cursor.execute(
            """
            INSERT INTO officers(

                full_name,

                username,

                password_hash,

                role,

                is_active,

                must_change_password

            )

            VALUES
            (
                %s,
                %s,
                %s,
                'ADMIN',
                TRUE,
                FALSE
            )

            RETURNING officer_id
            """,
            (
                full_name,
                username.lower(),
                password_hash
            )
        )

        officer_id = cursor.fetchone()[0]

        conn.commit()

        return officer_id

    except:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()
        
        

def create_officer(

    full_name: str,
    email: str,
    username: str,
    password_hash: str,
    role: str

):

    username = username.lower().strip()

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT officer_id
            FROM officers
            WHERE LOWER(email)=LOWER(%s)
            """,
            (email,)
        )

        if cursor.fetchone():
            raise Exception("Email already exists.")

        temporary_password = generate_temporary_password()

        password_hash = hash_password(
            temporary_password
        )

        cursor.execute(
            """
            INSERT INTO officers(
                full_name,
                email,
                username,
                password_hash,
                role,
                is_active,
                must_change_password
            )
            VALUES(%s,%s,%s,%s,%s,TRUE,TRUE)
            RETURNING officer_id
            """,
            (
                full_name,
                email,
                username,
                password_hash,
                role
            )
        )

        officer_id = cursor.fetchone()[0]

        conn.commit()

        return {
            "officer_id": officer_id,
            "email": email,
            "username": username,
            "temporary_password": temporary_password
        }

    finally:
        cursor.close()
        conn.close()
    

def get_officer_by_username(username: str):
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT *
            FROM officers
            WHERE username=%s
            """,
            (username,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


def get_officer_by_email(email: str):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT *
            FROM officers
            WHERE email = %s
            """,
            (email,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()

def get_officer_by_id(officer_id: int):
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT
                officer_id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at
            FROM officers
            WHERE officer_id=%s
            """,
            (officer_id,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


def list_officers():
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT
                officer_id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at
            FROM officers
            ORDER BY created_at DESC
            """
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        conn.close()


def enable_officer(officer_id: int):
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            UPDATE officers
            SET is_active=TRUE
            WHERE officer_id=%s
            RETURNING
                officer_id,
                full_name,
                is_active
            """,
            (officer_id,)
        )

        officer = cursor.fetchone()

        conn.commit()

        return officer

    finally:
        cursor.close()
        conn.close()


def disable_officer(officer_id: int):
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            UPDATE officers
            SET is_active=FALSE
            WHERE officer_id=%s
            RETURNING
                officer_id,
                full_name,
                is_active
            """,
            (officer_id,)
        )

        officer = cursor.fetchone()

        conn.commit()

        return officer

    finally:
        cursor.close()
        conn.close()


def reset_password(officer_id: int):

    temporary_password = (generate_temporary_password())

    password_hash = hash_password( temporary_password)

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute(

            """
            UPDATE officers

            SET

            password_hash=%s,

            must_change_password=TRUE

            WHERE officer_id=%s
            """,

            ( password_hash, officer_id)
        )

        conn.commit()

        return {

            "temporary_password":

            temporary_password

        }
    finally:
        cursor.close()
        conn.close()
