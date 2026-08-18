#import os
#import psycopg2


#def get_connection():
#    # Kama ina-run local (nje ya docker container), itatumia DB_HOST=localhost na DB_PORT=5433
#    host = os.getenv("LOCAL_DB_HOST") or os.getenv("DB_HOST", "localhost")
#    port = os.getenv("LOCAL_DB_PORT") or os.getenv("DB_PORT", "5433")

#    # Kama host iko 'fraud-postgres' lakini tunarun local execution, ibadilishe kwenda localhost
#    if host == "fraud-postgres" and not os.path.exists("/.dockerenv"):
#        host = "localhost"
#        port = "5433"

#    user = os.getenv("DB_USER", "postgres")
#    password = os.getenv("DB_PASSWORD", "Fraud@2026")
#    dbname = os.getenv("DB_NAME", "FraudDB")

#    return psycopg2.connect(
#        host=host,
#        port=port,
#        user=user,
#        password=password,
#        dbname=dbname
#    )


import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    if os.path.exists("/.dockerenv"):
        host = os.getenv("DB_HOST", "fraud-postgres")
        port = os.getenv("DB_PORT", "5432")
    else:
        host = "127.0.0.1"
        port = "5433"

    # Jaribu kusoma FRAUD_POSTGRES_*, ikikosekana tumia DB_*
    user = os.getenv("FRAUD_POSTGRES_USER") or os.getenv("DB_USER")
    password = os.getenv("FRAUD_POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD")
    dbname = os.getenv("FRAUD_POSTGRES_DB") or os.getenv("DB_NAME")

    if not all([user, password, dbname]):
        raise ValueError(
            f"🚨 Mfumo hauwezi ku-connect na Database! Missing values: "
            f"user={user}, password={'***' if password else None}, dbname={dbname}"
        )

    return psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname
    )
