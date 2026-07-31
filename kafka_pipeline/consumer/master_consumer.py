import json
import time
import psycopg2
import pandas as pd
import logging
from kafka import KafkaConsumer
from ml.inference.predictor import FraudPredictor
from backend.app.database.connection import get_connection

# Topics zote tatu kama zilivyowekwa kwenye Producer
TOPICS = ['transactions_1', 'transactions_2', 'transactions']
THRESHOLD = 0.9
GROUP_ID = "fraud-realtime-group-v3"

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")

predictor = FraudPredictor()


def get_db():
    conn = get_connection()
    return conn, conn.cursor()


def normalize_payload(data: dict) -> dict:
    """
    Inahakikisha data kutoka vyanzo mbalimbali (CSV, API, CDC) 
    zinakuwa na schema sawa inayotakiwa na Model na Database.
    """
    return {
        "transaction_id": str(data.get("transaction_id") or data.get("id") or ""),
        "step": int(data.get("step", 1)),
        "type": str(data.get("type", "PAYMENT")),
        "amount": float(data.get("amount", 0.0)),
        "nameOrig": str(data.get("nameOrig") or data.get("name_orig") or "UNKNOWN"),
        "oldbalanceOrg": float(data.get("oldbalanceOrg") or data.get("oldbalance_org") or 0.0),
        "newbalanceOrig": float(data.get("newbalanceOrig") or data.get("newbalance_orig") or 0.0),
        "nameDest": str(data.get("nameDest") or data.get("name_dest") or "UNKNOWN"),
        "oldbalanceDest": float(data.get("oldbalanceDest") or data.get("oldbalance_dest") or 0.0),
        "newbalanceDest": float(data.get("newbalanceDest") or data.get("newbalance_dest") or 0.0),
        "source_type": str(data.get("source_type", "unknown"))
    }


def create_consumer():
    # Pass list ya TOPICS badala ya String moja
    return KafkaConsumer(
        *TOPICS,
        bootstrap_servers="localhost:9092",
        # 'earliest' inahakikisha hupitwi na data zilizoingia ukiwa off
        auto_offset_reset="earliest",
        enable_auto_commit=False,      # Manual commit kwa ajili ya Exactly-Once Guarantee
        group_id=GROUP_ID,
        value_deserializer=lambda x: json.loads(x.decode("utf-8")),
        api_version=(3, 5, 0)
    )


conn, cursor = get_db()
consumer = create_consumer()

logging.info("BoT Compliant Multi-Topic Fraud Realtime Consumer started...")

while True:
    try:
        for message in consumer:
            raw_feature = message.value
            source_topic = message.topic

            # 1. Normalization
            feature = normalize_payload(raw_feature)
            transaction_id = feature["transaction_id"]

            if not transaction_id or transaction_id == "":
                logging.warning(
                    f"Muamala kutoka [{source_topic}] umekosa transaction_id! Skipped.")
                consumer.commit()  # Rukia hii message usiiangalie tena
                continue

            try:
                conn.autocommit = False

                # STEP 1: STORE in Primary Transactions Table
                # ON CONFLICT DO NOTHING inakukinga na duplicate rows!
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
                        transaction_id, feature["step"], feature["type"], feature["amount"],
                        feature["nameOrig"], feature["oldbalanceOrg"], feature["newbalanceOrig"],
                        feature["nameDest"], feature["oldbalanceDest"], feature["newbalanceDest"]
                    )
                )

                # STEP 2: Feature Engineering & Prediction
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

                # STEP 3: Classification & Storage
                if probability >= THRESHOLD:
                    # (i) FRAUD -> Review Queue
                    cursor.execute(
                        """
                        INSERT INTO fraud_review_queue (transaction_id, fraud_probability, status)
                        VALUES (%s, %s, 'PENDING')
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"[{source_topic.upper()}] TX={transaction_id} | RISK={probability:.4f} -> Sent to Review Queue."
                    )
                else:
                    # (ii) NON-FRAUD -> Predictions Table
                    cursor.execute(
                        """
                        INSERT INTO fraud_predictions (transaction_id, fraud_probability, prediction)
                        VALUES (%s, %s, FALSE)
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"[{source_topic.upper()}] TX={transaction_id} | RISK={probability:.4f} -> Saved (Non-Fraud)."
                    )

                # Commit Database Transaction
                conn.commit()

                # Commit Kafka Offset (Hii inahakikisha Kafka inajua message imekuwa processed kikamilifu)
                consumer.commit()

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
        logging.error(f"Kafka Error: {kafka_err}")
        time.sleep(5)
        try:
            consumer.close()
        except Exception:
            pass

        # Re-initialize consumer seamlessly
        try:
            consumer = create_consumer()
        except Exception as e:
            logging.error(f"Failed to reconnect Consumer: {e}")
