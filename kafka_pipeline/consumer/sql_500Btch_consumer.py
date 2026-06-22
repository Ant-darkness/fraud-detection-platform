from kafka import KafkaConsumer
import json
import pyodbc
import time

BATCH_SIZE = 500

# -----------------------
# DB CONNECTION
# -----------------------
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost,1455;"
    "DATABASE=FraudDB;"
    "UID=sa;"
    "PWD=Fraud@2026;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=30;"
)

cursor = conn.cursor()

# -----------------------
# KAFKA CONSUMER
# -----------------------
consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="fraud-sql-v3",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    enable_auto_commit=True
)

print("Consumer running...")

batch = []
start = time.time()

def insert_batch(batch):
    query = """
    INSERT INTO transactions (
        step, type, amount, nameOrig,
        oldbalanceOrg, newbalanceOrig,
        nameDest, oldbalanceDest,
        newbalanceDest, isFraud, isFlaggedFraud
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    cursor.executemany(query, batch)
    conn.commit()

for message in consumer:
    tx = message.value

    try:
        batch.append((
            int(tx.get("step", 0)),
            str(tx.get("type", "")),
            float(tx.get("amount", 0)),
            str(tx.get("nameOrig", "")),
            float(tx.get("oldbalanceOrg", 0)),
            float(tx.get("newbalanceOrig", 0)),
            str(tx.get("nameDest", "")),
            float(tx.get("oldbalanceDest", 0)),
            float(tx.get("newbalanceDest", 0)),
            int(tx.get("isFraud", 0)),
            int(tx.get("isFlaggedFraud", 0))
        ))

        if len(batch) >= BATCH_SIZE:
            insert_batch(batch)
            print(f"Inserted batch: {len(batch)}")
            batch = []

    except Exception as e:
        print("ERROR:", e)
        continue

# flush mwisho
if batch:
    insert_batch(batch)

print("CONSUMER DONE ✅")
print("Time:", time.time() - start)
