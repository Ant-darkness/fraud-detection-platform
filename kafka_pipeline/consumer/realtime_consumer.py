from kafka import KafkaConsumer
import os
import json
import time
import psycopg2
import pandas as pd
import logging
import requests
import asyncio
from dotenv import load_dotenv
from backend.app.database.connection import get_connection
from ml.inference.predictor import FraudPredictor
from backend.app.services.notification_service import notify_officers

# Pakia .env variables kabla ya import za ndani za project
load_dotenv()


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")

# Soma config kutoka .env
TOPIC = os.getenv("KAFKA_TOPIC", "transactions")
# BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
THRESHOLD = float(os.getenv("FRAUD_THRESHOLD", "0.9"))
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "fraud-realtime-group-v3")

# Security & Broadcast Configs
# BACKEND_BROADCAST_URL = os.getenv(
#    "BACKEND_BROADCAST_URL", "http://localhost:8000/api/ws/broadcast")


# Tenga host ya Local Terminal
BOOTSTRAP_SERVERS = "localhost:9092" if not os.path.exists(
    "/.dockerenv") else os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
BACKEND_BROADCAST_URL = "http://localhost:8000/api/ws/broadcast" if not os.path.exists(
    "/.dockerenv") else os.getenv("BACKEND_BROADCAST_URL")

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# Fail Fast Validation
if not INTERNAL_API_KEY:
    logging.critical("🚨 INTERNAL_API_KEY haijapatikana kwenye .env!")
    raise ValueError("Missing critical environment variable: INTERNAL_API_KEY")

predictor = FraudPredictor()
predictor = FraudPredictor()

if predictor.model is None:
    raise RuntimeError(
        "Consumer startup aborted because there is no active ML model."
    )


def get_db():
    conn = get_connection()
    return conn, conn.cursor()


def notify_backend_websocket(transaction_data: dict, probability: float, is_fraud: bool):
    """
    Inasukuma signal instant kwenda Backend WebSocket
    """
    try:
        headers = {
            "Content-Type": "application/json",
            "X-Internal-Key": INTERNAL_API_KEY
        }
        payload = {
            "event_type": "NEW_TRANSACTION",
            "transaction": transaction_data,
            "fraud_probability": probability,
            "is_fraud": is_fraud
        }
        requests.post(BACKEND_BROADCAST_URL, json=payload,
                      headers=headers, timeout=1.0)
    except Exception as e:
        logging.warning(f"⚠️ Imeshindikana kuitaarifu Backend WebSocket: {e}")


def create_kafka_consumer():
    return KafkaConsumer(
        TOPIC,
        bootstrap_servers=BOOTSTRAP_SERVERS,
        auto_offset_reset="latest",
        enable_auto_commit=False,
        group_id=GROUP_ID,
        value_deserializer=lambda x: json.loads(x.decode("utf-8")),
        api_version=(3, 5, 0)
    )


conn, cursor = get_db()
consumer = create_kafka_consumer()

logging.info(
    f"BoT Compliant Fraud Realtime Consumer started... Listening to {TOPIC} on {BOOTSTRAP_SERVERS}")

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
                            feature["type"]),
                        float(feature["amount"]), str(feature["nameOrig"]),
                        float(feature["oldbalanceOrg"]), float(
                            feature["newbalanceOrig"]),
                        str(feature["nameDest"]), float(
                            feature["oldbalanceDest"]),
                        float(feature["newbalanceDest"])
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
                        f"🚨 TX={transaction_id} | RISK={probability:.4f} -> Sent to Officer Queue.")

                    # 📧 TUMA EMAIL KWA MAOFISA HAPA
                    try:
                        asyncio.run(notify_officers(
                            transaction_id, probability))
                    except Exception as mail_err:
                        logging.error(
                            f"⚠️ Imeshindikana kutuma email ya Fraud Alert: {mail_err}")

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
                        f"✅ TX={transaction_id} | RISK={probability:.4f} -> Saved to Predictions.")
                    
                conn.commit()
                consumer.commit()

                # STEP 4: INSTANT SIGNAL TO BACKEND WEBSOCKET
                notify_backend_websocket(feature, probability, is_fraud)

            except psycopg2.Error as db_err:
                logging.error(f"Database Error: {db_err}")
                try:
                    conn.rollback()
                except Exception:
                    pass
                conn.close()
                time.sleep(3)
                conn, cursor = get_db()

            except Exception as e:
                logging.error(f"Processing Error: {e}")
                try:
                    conn.rollback()
                except Exception:
                    pass

    except Exception as kafka_err:
        logging.error(f"Kafka Connection Failure: {kafka_err}")
        time.sleep(5)
        try:
            consumer.close()
        except Exception:
            pass
        consumer = create_kafka_consumer()
