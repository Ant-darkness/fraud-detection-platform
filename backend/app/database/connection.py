import os
import psycopg2


def get_connection():
    print(
        "Connecting to:",
        os.getenv("DB_HOST", "localhost"),
        os.getenv("DB_PORT", "5433"),
    )
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5433"),
        database=os.getenv("DB_NAME","FraudDB"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "Fraud@2026")
    )
    
    return conn
  
