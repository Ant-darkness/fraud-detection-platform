# backend/app/services/officer_service.py

from psycopg2.extras import RealDictCursor
from backend.app.database.connection import get_connection


def register_officer(
    full_name: str,
    username: str,
    email: str,
    password_hash: str,
    role: str = "OFFICER"
):
    conn = get_connection()

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            INSERT INTO officers
            (
                full_name,
                username,
                email,
                password_hash,
                role
            )
            VALUES
            (%s,%s,%s,%s,%s)
            RETURNING
                officer_id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at
            """,
            (
                full_name,
                username,
                email,
                password_hash,
                role
            )
        )

        officer = cursor.fetchone()

        conn.commit()

        return officer

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
