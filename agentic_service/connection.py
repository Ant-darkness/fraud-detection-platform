import psycopg2
from sqlalchemy import create_engine
from agentic_service.config import (
    DATABASE_URL,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
)

# 1. SQLAlchemy Engine (Inatumika na QueryAgent)
engine = create_engine(DATABASE_URL)

# 2. Raw Psycopg2 Connection (Kama unaihitaji mahali kando)


def get_connection():
    print(f"Connecting via psycopg2 to: {DB_HOST}:{DB_PORT}")

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

    return conn
