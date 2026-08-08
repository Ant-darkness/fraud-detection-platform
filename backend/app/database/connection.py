import os
import psycopg2


#def get_connection():
#    print(
#        "Connecting to:",
#        os.getenv("DB_HOST", "localhost"),
#        os.getenv("DB_PORT", "5433"),
#    )
    
#    conn = psycopg2.connect(
#        host=os.getenv("DB_HOST", "localhost"),
#        port=os.getenv("DB_PORT", "5433"),
#        database=os.getenv("DB_NAME","FraudDB"),
#        user=os.getenv("DB_USER", "postgres"),
#        password=os.getenv("DB_PASSWORD", "Fraud@2026")
#    )
    
#    return conn
  

def get_connection():
    # Kama ina-run local (nje ya docker container), itatumia DB_HOST=localhost na DB_PORT=5433
    host = os.getenv("LOCAL_DB_HOST") or os.getenv("DB_HOST", "localhost")
    port = os.getenv("LOCAL_DB_PORT") or os.getenv("DB_PORT", "5433")

    # Kama host iko 'fraud-postgres' lakini tunarun local execution, ibadilishe kwenda localhost
    if host == "fraud-postgres" and not os.path.exists("/.dockerenv"):
        host = "localhost"
        port = "5433"

    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "Fraud@2026")
    dbname = os.getenv("DB_NAME", "FraudDB")

    return psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname
    )
