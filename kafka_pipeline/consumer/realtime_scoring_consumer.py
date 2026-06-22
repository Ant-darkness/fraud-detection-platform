from kafka import KafkaConsumer
from ml.inference.predictor import FraudPredictor
import json
import pyodbc
import time


predictor = FraudPredictor()

THRESHOLD = 0.9


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
    return conn, cursor


conn, cursor = create_connection()

consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="latest",
    group_id="fraud-scoring-group-v3",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

print("Fraud scoring consumer running...")

while True:
    try:
        for message in consumer:
            tx = message.value

            features = {
                "step": tx["step"],
                "type": tx["type"],
                "amount": tx["amount"],
                "oldbalanceOrg": tx["oldbalanceOrg"],
                "newbalanceOrig": tx["newbalanceOrig"],
                "oldbalanceDest": tx["oldbalanceDest"],
                "newbalanceDest": tx["newbalanceDest"]
            }

            result = predictor.predict(features)

            probability = float(result["fraud_probability"])
            prediction = int(result["prediction"])

            # 1. Save prediction
            cursor.execute(
                """
                INSERT INTO fraud_predictions(
                    transaction_id,
                    fraud_probability,
                    prediction
                )
                VALUES (?, ?, ?)
                """,
                tx.get("transaction_id"),
                probability,
                prediction
            )

            # 2. Push to review queue if risky
            if probability >= THRESHOLD:
                cursor.execute(
                    """
                    INSERT INTO fraud_review_queue(
                        transaction_id,
                        fraud_probability,
                        status
                    )
                    VALUES (?, ?, ?)
                    """,
                    tx.get("transaction_id"),
                    probability,
                    "PENDING"
                )

            conn.commit()

            print(
                f"TYPE={tx['type']} | "
                f"AMOUNT={tx['amount']} | "
                f"PROB={probability:.6f} | "
                f"PRED={prediction}"
            )

    except pyodbc.Error as e:
        print("DB error:", e)
        time.sleep(5)
        conn, cursor = create_connection()

    except Exception as e:
        print("Error:", e)
        time.sleep(5)
