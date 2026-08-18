import os
import json
import time
import logging
import psycopg2
import pandas as pd
import requests
from dotenv import load_dotenv
from confluent_kafka import Consumer, KafkaError

from backend.app.database.connection import get_connection
from ml.inference.predictor import FraudPredictor
from backend.app.services.notification_service import notify_officers

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# ------------------------------------------------------------------------------
# CONFIGURATIONS & ENVIRONMENT VARIABLES
# ------------------------------------------------------------------------------
TOPIC = os.getenv("KAFKA_TOPIC", "local_cdc.public.transactions")
THRESHOLD = float(os.getenv("FRAUD_THRESHOLD", "0.9"))
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "fraud-realtime-v1")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

IS_DOCKER = os.path.exists("/.dockerenv")

DEFAULT_BOOTSTRAP = "kafka:29092" if IS_DOCKER else "localhost:9092"
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", DEFAULT_BOOTSTRAP)

DEFAULT_BROADCAST = "http://fraud-api:8000/api/ws/broadcast" if IS_DOCKER else "http://localhost:8000/api/ws/broadcast"
BACKEND_BROADCAST_URL = os.getenv("BACKEND_BROADCAST_URL", DEFAULT_BROADCAST)

if not INTERNAL_API_KEY:
    logging.critical("🚨 INTERNAL_API_KEY haijapatikana kwenye .env!")
    raise ValueError("Missing critical environment variable: INTERNAL_API_KEY")

# Initialization ya Machine Learning Predictor
predictor = FraudPredictor()
if predictor.model is None:
    raise RuntimeError("Consumer startup aborted: No active ML model loaded.")


# ------------------------------------------------------------------------------
# HELPER FUNCTIONS
# ------------------------------------------------------------------------------
def get_db():
    """Inafungua uhusiano mpya wa Database na kurejesha connection pamoja na cursor."""
    conn = get_connection()
    return conn, conn.cursor()


def extract_cdc_payload(raw_message: dict) -> dict:
    """
    Inatoa payload kutoka Debezium CDC Message.
    Inasawazisha mabadiliko ya Unwrapped JSON na Nested JSON.
    """
    if not isinstance(raw_message, dict):
        return None

    # Kwa kuwa unatumia "unwrap" transform, message inakuja ikiwa flat tayari
    if "transaction_id" in raw_message or "TRANSACTION_ID" in raw_message:
        return raw_message

    # Fallback kama unwrap haijatumiwa kwa bahati mbaya
    payload = raw_message.get("payload", raw_message)
    if isinstance(payload, dict):
        after_data = payload.get("after")
        if after_data and isinstance(after_data, dict):
            return after_data

    return None


def normalize_payload(data: dict) -> dict:
    """
    Ina-normalize CDC Data kwenda Standard Dict:
    1. Lowercase keys kwa ajili ya Postgres DB & React Table mapping.
    2. CamelCase aliases kwa ajili ya ML Model & Legacy UI components.
    """
    lower_data = {str(k).lower(): v for k, v in data.items()}

    def get_val(key, default):
        v = lower_data.get(key)
        return v if (v is not None and v != "") else default

    tx_id = str(get_val("transaction_id", "")).strip()
    step_val = int(get_val("step", 0))
    type_val = str(get_val("type", "TRANSFER")).upper()
    amount_val = float(get_val("amount", 0.0))

    name_orig = str(get_val("nameorig", "N/A"))
    old_bal_orig = float(get_val("oldbalanceorg", 0.0))
    new_bal_orig = float(get_val("newbalanceorig", 0.0))

    name_dest = str(get_val("namedest", "N/A"))
    old_bal_dest = float(get_val("oldbalancedest", 0.0))
    new_bal_dest = float(get_val("newbalancedest", 0.0))

    created_at_val = str(
        get_val("created_at", time.strftime("%Y-%m-%dT%H:%M:%SZ")))

    return {
        # Standardized Lowercase (Database & React UI)
        "transaction_id": tx_id,
        "step": step_val,
        "type": type_val,
        "amount": amount_val,
        "nameorig": name_orig,
        "oldbalanceorg": old_bal_orig,
        "newbalanceorig": new_bal_orig,
        "namedest": name_dest,
        "oldbalancedest": old_bal_dest,
        "newbalancedest": new_bal_dest,
        "created_at": created_at_val,

        # CamelCase Aliases (ML Model)
        "nameOrig": name_orig,
        "oldbalanceOrg": old_bal_orig,
        "newbalanceOrig": new_bal_orig,
        "nameDest": name_dest,
        "oldbalanceDest": old_bal_dest,
        "newbalanceDest": new_bal_dest
    }


def notify_backend_websocket(transaction_data: dict, probability: float, is_fraud: bool):
    """Inatuma taarifa ya miamala mipya moja kwa moja FastAPI WebSocket endpoint."""
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
        response = requests.post(
            BACKEND_BROADCAST_URL, json=payload, headers=headers, timeout=2.0
        )
        if response.status_code != 200:
            logging.warning(
                f"⚠️ Backend Broadcast WS status code: {response.status_code}")
    except Exception as e:
        logging.warning(f"⚠️ Imeshindikana kuitaarifu Backend WebSocket: {e}")


def create_kafka_consumer():
    """Inatengeneza na kurejesha Instance ya Confluent-Kafka Consumer."""
    conf = {
        'bootstrap.servers': BOOTSTRAP_SERVERS,
        'group.id': GROUP_ID,
        'auto.offset.reset': 'latest',
        'enable.auto.commit': False
    }
    consumer = Consumer(conf)
    consumer.subscribe([TOPIC])
    return consumer


# ------------------------------------------------------------------------------
# MAIN EXECUTION LOOP
# ------------------------------------------------------------------------------
conn, cursor = get_db()
consumer = create_kafka_consumer()

logging.info(
    f"🚀 Realtime CDC Consumer Started. Listening to CDC Topic: {TOPIC} on {BOOTSTRAP_SERVERS}"
)

try:
    while True:
        try:
            msg = consumer.poll(timeout=1.0)

            if msg is None:
                continue

            if msg.error():
                err_code = msg.error().code()

                # SULUHISHO LA UNKNOWN TOPIC (PC IKIZIMWA NA KUWAKISHWA UPYA)
                if err_code == KafkaError.UNKNOWN_TOPIC_OR_PART:
                    logging.warning(
                        f"⏳ Topic '{TOPIC}' haijapatikana bado kwenye Kafka. "
                        f"Inasubiri Debezium isajili connector... (Retry in 5s)"
                    )
                    time.sleep(5)
                    continue

                elif err_code == KafkaError._PARTITION_EOF:
                    continue

                else:
                    logging.error(f"Kafka Error: {msg.error()}")
                    time.sleep(2)
                    continue

            # Step 0: Parse message value
            raw_data_str = msg.value().decode("utf-8")
            if not raw_data_str:
                continue

            raw_payload = json.loads(raw_data_str)

            # Extract CDC Data
            extracted_data = extract_cdc_payload(raw_payload)
            if not extracted_data:
                continue

            # Normalize Keys
            tx_data = normalize_payload(extracted_data)
            transaction_id = tx_data["transaction_id"]

            if not transaction_id or transaction_id == "None":
                logging.warning(
                    "⚠️ CDC Message haina transaction_id! Skipped.")
                continue

            try:
                conn.autocommit = False

                # STEP 1: STORE ON POSTGRES DB
                cursor.execute(
                    """
                    INSERT INTO transactions (
                        transaction_id, step, type, amount, nameorig,
                        oldbalanceorg, newbalanceorig, namedest, oldbalancedest, newbalancedest
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (transaction_id) DO NOTHING
                    """,
                    (
                        transaction_id,
                        tx_data["step"],
                        tx_data["type"],
                        tx_data["amount"],
                        tx_data["nameorig"],
                        tx_data["oldbalanceorg"],
                        tx_data["newbalanceorig"],
                        tx_data["namedest"],
                        tx_data["oldbalancedest"],
                        tx_data["newbalancedest"]
                    )
                )

                # STEP 2: FEATURE ENGINEERING & MODEL PREDICTION
                features = pd.DataFrame([{
                    "step": tx_data["step"],
                    "type": tx_data["type"],
                    "amount": tx_data["amount"],
                    "oldbalanceOrg": tx_data["oldbalanceorg"],
                    "newbalanceOrig": tx_data["newbalanceorig"],
                    "oldbalanceDest": tx_data["oldbalancedest"],
                    "newbalanceDest": tx_data["newbalancedest"]
                }])

                result = predictor.predict(features)
                probability = float(result["fraud_probability"])
                is_fraud = probability >= THRESHOLD

                # STEP 3: LOGGING & SAVING PREDICTIONS
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
                        f"🚨 FRAUD DETECTED | TX={transaction_id} | Risk={probability:.4f} -> Review Queue"
                    )

                    try:
                        notify_officers(transaction_id, probability)
                    except Exception as mail_err:
                        logging.error(f"⚠️ Email Alert Error: {mail_err}")
                else:
                    cursor.execute(
                        """
                        INSERT INTO fraud_predictions (transaction_id, fraud_probability, prediction)
                        VALUES (%s, %s, FALSE)
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"✅ CLEAN TX | TX={transaction_id} | Risk={probability:.4f} -> Saved"
                    )

                conn.commit()
                consumer.commit(msg, asynchronous=False)

                # STEP 4: REAL-TIME WEBSOCKET SIGNAL TO FRONTEND
                notify_backend_websocket(tx_data, probability, is_fraud)

            except psycopg2.Error as db_err:
                logging.error(f"Database Error: {db_err}")
                try:
                    conn.rollback()
                except Exception:
                    pass
                time.sleep(2)
                conn, cursor = get_db()

            except Exception as proc_err:
                logging.error(f"Processing Error: {proc_err}")
                try:
                    conn.rollback()
                except Exception:
                    pass

        except Exception as inner_err:
            logging.error(f"Unexpected Loop Error: {inner_err}")
            time.sleep(2)

except KeyboardInterrupt:
    logging.info("🛑 Stopping Realtime Consumer...")
finally:
    try:
        consumer.close()
        cursor.close()
        conn.close()
    except Exception:
        pass
    logging.info("👋 Realtime Consumer Shutdown Complete.")
