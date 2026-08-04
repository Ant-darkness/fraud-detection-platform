import os
from urllib.parse import quote_plus

# Gemini Configurations
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-3.6-flash")

# Database Basic Configurations
DB_HOST = os.getenv("DB_HOST", "fraud-postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "FraudDB")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Fraud@2026")

# URL-encode user na password kuzuia matatizo ya alama kama '@'
encoded_user = quote_plus(DB_USER)
encoded_password = quote_plus(DB_PASSWORD)

# Construct DATABASE_URL if not provided directly in .env
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
