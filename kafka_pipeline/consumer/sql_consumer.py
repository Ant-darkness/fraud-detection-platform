from kafka import KafkaConsumer
from backend.app.database.connection import get_connection
import json
import psycopg2
import time

conn = get_connection()
cursor = conn.cursor()


consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="sql-consumer-group-v3",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

print("Transactions Consumer running...")

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
                    newbalanceDest
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    tx.get("transaction_id"),
                    int(tx["step"]),
                    str(tx["type"]),
                    float(tx["amount"]),
                    str(tx["nameOrig"]),
                    float(tx["oldbalanceOrg"]),
                    float(tx["newbalanceOrig"]),
                    str(tx["nameDest"]),
                    float(tx["oldbalanceDest"]),
                    float(tx["newbalanceDest"])
                    
                )
            )

            count += 1

            if count % BATCH_SIZE == 0:
                conn.commit()
                print(f"Committed {count} rows")

    except psycopg2.Error as e:
        print("DB error:", e)
        time.sleep(5)
        conn = get_connection()
        cursor = conn.cursor()

    except Exception as e:
        print("Error:", e)
        time.sleep(5)
