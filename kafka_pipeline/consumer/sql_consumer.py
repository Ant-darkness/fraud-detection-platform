from kafka import KafkaConsumer
import json
import pyodbc
import time


def create_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=localhost,1455;"
        "DATABASE=FraudDB;"
        "UID=sa;"
        "PWD=Fraud@2026;"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )
    cursor = conn.cursor()
    cursor.fast_executemany = True
    return conn, cursor


conn, cursor = create_connection()

consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="sql-consumer-group-v3",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

print("SQL Consumer running...")

count = 0
BATCH_SIZE = 500

while True:
    try:
        for message in consumer:
            tx = message.value

            cursor.execute(
                """
                INSERT INTO transactions(
                    transaction_id,
                    step,
                    type,
                    amount,
                    nameOrig,
                    oldbalanceOrg,
                    newbalanceOrig,
                    nameDest,
                    oldbalanceDest,
                    newbalanceDest,
                    isFraud,
                    isFlaggedFraud
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                tx.get("transaction_id"),
                int(tx["step"]),
                str(tx["type"]),
                float(tx["amount"]),
                str(tx["nameOrig"]),
                float(tx["oldbalanceOrg"]),
                float(tx["newbalanceOrig"]),
                str(tx["nameDest"]),
                float(tx["oldbalanceDest"]),
                float(tx["newbalanceDest"]),
                int(tx.get("isFraud", 0)),
                int(tx.get("isFlaggedFraud", 0))
            )

            count += 1

            if count % BATCH_SIZE == 0:
                conn.commit()
                print(f"Committed {count} rows")

    except pyodbc.Error as e:
        print("DB error:", e)
        time.sleep(5)
        conn, cursor = create_connection()

    except Exception as e:
        print("Error:", e)
        time.sleep(5)
