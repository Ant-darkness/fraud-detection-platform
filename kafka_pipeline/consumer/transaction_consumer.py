import json
import time
import psycopg2
import pandas as pd
import logging
import requests  # <-- Ongeza requests
from kafka import KafkaConsumer
from ml.inference.predictor import FraudPredictor
from backend.app.database.connection import get_connection

TOPIC = "transactions"
THRESHOLD = 0.9
GROUP_ID = "fraud-realtime-group-v3"
FASTAPI_BROADCAST_URL = "http://localhost:8000/ws/broadcast"  # Backend Broadcast API

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")

predictor = FraudPredictor()


def get_db():
    conn = get_connection()
    return conn, conn.cursor()


conn, cursor = get_db()

consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers="localhost:9092",
    auto_offset_reset="latest",
    enable_auto_commit=False,
    group_id=GROUP_ID,
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

logging.info("BoT Compliant Fraud Realtime Consumer started...")

while True:
    try:
        for message in consumer:
            feature = message.value
            transaction_id = str(feature.get("transaction_id"))

            if not transaction_id:
                logging.warning("Muamala umekosa transaction_id! Skipped.")
                continue

            try:
                conn.autocommit = False

                # STEP 1: STORE transactions in Transactions Table
                cursor.execute(
                    """
                    INSERT INTO transactions (
                        transaction_id, step, type, amount, nameOrig,
                        oldbalanceOrg, newbalanceOrig, nameDest, oldbalanceDest, newbalanceDest
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (transaction_id) DO NOTHING
                    """,
                    (
                        transaction_id, int(feature["step"]), str(
                            feature["type"]), float(feature["amount"]),
                        str(feature["nameOrig"]), float(
                            feature["oldbalanceOrg"]), float(feature["newbalanceOrig"]),
                        str(feature["nameDest"]), float(
                            feature["oldbalanceDest"]), float(feature["newbalanceDest"])
                    )
                )

                # STEP 2: Feature Engineering & Model Prediction
                features = pd.DataFrame([{
                    "step": feature["step"],
                    "type": feature["type"],
                    "amount": feature["amount"],
                    "oldbalanceOrg": feature["oldbalanceOrg"],
                    "newbalanceOrig": feature["newbalanceOrig"],
                    "oldbalanceDest": feature["oldbalanceDest"],
                    "newbalanceDest": feature["newbalanceDest"]
                }])

                result = predictor.predict(features)
                probability = float(result["fraud_probability"])
                is_fraud = probability >= THRESHOLD

                # STEP 3: (i) FRAUD -> Fraud_review_queue Table
                if is_fraud:
                    cursor.execute(
                        """
                        INSERT INTO fraud_review_queue (transaction_id, fraud_probability, status)
                        VALUES (%s, %s, 'PENDING')
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"TX={transaction_id} | RISK={probability:.4f} -> Sent to Officer Queue (Pending Review).")
                else:
                    # (ii) NON-FRAUD -> Fraud_predictions Table
                    cursor.execute(
                        """
                        INSERT INTO fraud_predictions (transaction_id, fraud_probability, prediction)
                        VALUES (%s, %s, FALSE)
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"TX={transaction_id} | RISK={probability:.4f} -> Saved directly to Predictions (Non-Fraud).")

                conn.commit()

                # STEP 4: WEBSOCKET BROADCAST TRIGGER (MIAKA YA LIVE DATA FRONTEND)
                try:
                    payload = {
                        "event_type": "NEW_TRANSACTION",
                        "transaction": {
                            "transaction_id": transaction_id,
                            "step": int(feature["step"]),
                            "type": str(feature["type"]),
                            "amount": float(feature["amount"]),
                            "nameorig": str(feature["nameOrig"]),
                            "oldbalanceorg": float(feature["oldbalanceOrg"]),
                            "newbalanceorig": float(feature["newbalanceOrig"]),
                            "namedest": str(feature["nameDest"]),
                            "oldbalancedest": float(feature["oldbalanceDest"]),
                            "newbalancedest": float(feature["newbalanceDest"]),
                            "created_at": time.strftime('%Y-%m-%d %H:%M:%S')
                        },
                        "fraud_probability": probability,
                        "is_fraud": is_fraud
                    }
                    requests.post(FASTAPI_BROADCAST_URL,
                                  json=payload, timeout=0.5)
                except Exception as ws_err:
                    logging.warning(
                        f"Could not trigger WebSocket broadcast: {ws_err}")

            except psycopg2.Error as db_err:
                logging.error(f"Database Error: {db_err}")
                try:
                    conn.rollback()
                except:
                    pass
                conn.close()
                time.sleep(3)
                conn, cursor = get_db()

            except Exception as e:
                logging.error(f"Processing Error: {e}")
                try:
                    conn.rollback()
                except:
                    pass

    except Exception as kafka_err:
        logging.error(f"Kafka Error: {kafka_err}")
        time.sleep(5)
        try:
            consumer.close()
        except:
            pass

        consumer = KafkaConsumer(
            TOPIC, bootstrap_servers="localhost:9092", auto_offset_reset="latest",
            enable_auto_commit=True, group_id=GROUP_ID,
            value_deserializer=lambda x: json.loads(x.decode("utf-8")), api_version=(3, 5, 0)
        )
