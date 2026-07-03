from kafka import KafkaConsumer
from ml.inference.predictor import FraudPredictor
from backend.app.database.connection import get_connection

import json
import time
import psycopg2
import pandas as pd
import logging


# -----------------------------
# CONFIG
# -----------------------------
TOPIC = "transactions"
THRESHOLD = 0.9
GROUP_ID = "fraud-realtime-group-v1"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# -----------------------------
# INIT MODEL
# -----------------------------
predictor = FraudPredictor()

# -----------------------------
# DB CONNECTION
# -----------------------------
def get_db():
    conn = get_connection()
    return conn, conn.cursor()

conn, cursor = get_db()

# -----------------------------
# KAFKA CONSUMER
# -----------------------------
consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers="localhost:9092",
    auto_offset_reset="latest",
    enable_auto_commit=True,
    group_id=GROUP_ID,
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

logging.info("🚀 Fraud Realtime Consumer started...")

# -----------------------------
# MAIN LOOP
# -----------------------------
while True:
    try:
        for message in consumer:

            tx = message.value

            # -----------------------------
            # 1. FEATURE ENGINEERING
            # -----------------------------
            features = pd.DataFrame([{
                "step": tx["step"],
                "type": tx["type"],
                "amount": tx["amount"],
                "oldbalanceOrg": tx["oldbalanceOrg"],
                "newbalanceOrig": tx["newbalanceOrig"],
                "oldbalanceDest": tx["oldbalanceDest"],
                "newbalanceDest": tx["newbalanceDest"]
            }])

            # -----------------------------
            # 2. MODEL PREDICTION
            # -----------------------------
            result = predictor.predict(features)

            probability = float(result["fraud_probability"])
            prediction = bool(result["prediction"])

            transaction_id = tx.get("transaction_id")

            try:
                # -----------------------------
                # START DB TRANSACTION
                # -----------------------------
                conn.autocommit = False

                # -----------------------------
                # 3. INSERT TRANSACTION
                # -----------------------------
                cursor.execute(
                    """
                    INSERT INTO transactions (
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
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (transaction_id) DO NOTHING
                    """,
                    (
                        transaction_id,
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

                # -----------------------------
                # 4. INSERT PREDICTION
                # -----------------------------
                cursor.execute(
                    """
                    INSERT INTO fraud_predictions (
                        transaction_id,
                        fraud_probability,
                        prediction
                    )
                    VALUES (%s, %s, %s)
                    """,
                    (
                        transaction_id,
                        probability,
                        prediction
                    )
                )

                # -----------------------------
                # 5. HIGH RISK QUEUE
                # -----------------------------
                if probability >= THRESHOLD:
                    cursor.execute(
                        """
                        INSERT INTO fraud_review_queue (
                            transaction_id,
                            fraud_probability,
                            status
                        )
                        VALUES (%s, %s, %s)
                        """,
                        (
                            transaction_id,
                            probability,
                            "PENDING"
                        )
                    )

                # -----------------------------
                # COMMIT ALL
                # -----------------------------
                conn.commit()

                logging.info(
                    f"TX={transaction_id} | "
                    f"PROB={probability:.4f} | "
                    f"PRED={prediction}"
                )

            except psycopg2.Error as db_err:

                logging.error(f"DB ERROR: {db_err}")

                try:
                    conn.rollback()
                except:
                    pass

                # reconnect DB
                try:
                    conn.close()
                except:
                    pass

                time.sleep(3)
                conn, cursor = get_db()

            except Exception as e:

                logging.error(f"PROCESSING ERROR: {e}")

                try:
                    conn.rollback()
                except:
                    pass

    except Exception as kafka_err:

        logging.error(f"KAFKA ERROR: {kafka_err}")

        time.sleep(5)

        try:
            consumer.close()
        except:
            pass

        consumer = KafkaConsumer(
            TOPIC,
            bootstrap_servers="localhost:9092",
            auto_offset_reset="latest",
            enable_auto_commit=True,
            group_id=GROUP_ID,
            value_deserializer=lambda x: json.loads(x.decode("utf-8")),
            api_version=(3, 5, 0)
        )
