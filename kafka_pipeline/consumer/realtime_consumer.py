import json
import time
import psycopg2
import pandas as pd
import logging
from kafka import KafkaConsumer
from ml.inference.predictor import FraudPredictor
from backend.app.database.connection import get_connection

# -----------------------------
# CONFIG
# -----------------------------
TOPIC = "transactions"
THRESHOLD = 0.9  # BoT Risk Appetite Threshold
GROUP_ID = "fraud-realtime-group-v3"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# Initialize Model
predictor = FraudPredictor()


def get_db():
    conn = get_connection()
    return conn, conn.cursor()


conn, cursor = get_db()

# Consumer Setup
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

# -----------------------------
# MAIN LOOP
# -----------------------------
while True:
    try:
        for message in consumer:
            feature = message.value
            transaction_id = str(feature.get("transaction_id"))

            if not transaction_id:
                logging.warning("Muamala umekosa transaction_id! Skipped.")
                continue

            # 1. FEATURE ENGINEERING
            features = pd.DataFrame([{
                "step": feature["step"],
                "type": feature["type"],
                "amount": feature["amount"],
                "oldbalanceOrg": feature["oldbalanceOrg"],
                "newbalanceOrig": feature["newbalanceOrig"],
                "oldbalanceDest": feature["oldbalanceDest"],
                "newbalanceDest": feature["newbalanceDest"]
            }])

            # 2. MODEL PREDICTION
            result = predictor.predict(features)
            probability = float(result["fraud_probability"])
            prediction = bool(result["prediction"])

            try:
                conn.autocommit = False

                # 3. AMUA STATUS YA MUAMALA (BoT Control Logic)
                # Kama risk ipo juu ya threshold, muamala unakuwa 'HELD' (Umezuiliwa)
                tx_status = "HELD" if probability >= THRESHOLD else "APPROVED"

                # 4. INGIZA MUAMALA KWENYE TABLE KUU (Hifadhi Audit Trail daima)
                cursor.execute(
                    """
                    INSERT INTO transactions (
                        transaction_id, step, type, amount, nameOrig,
                        oldbalanceOrg, newbalanceOrig, nameDest, oldbalanceDest, newbalanceDest,
                        status, final_label
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, FALSE)
                    ON CONFLICT (transaction_id) DO NOTHING
                    """,
                    (
                        transaction_id, int(feature["step"]), str(
                            feature["type"]), float(feature["amount"]),
                        str(feature["nameOrig"]), float(
                            feature["oldbalanceOrg"]), float(feature["newbalanceOrig"]),
                        str(feature["nameDest"]), float(
                            feature["oldbalanceDest"]), float(feature["newbalanceDest"]),
                        tx_status
                    )
                )

                # 5. HIFADHI PREDICTION KWA AJILI YA AUDIT NA MODEL MONITORING
                cursor.execute(
                    """
                    INSERT INTO fraud_predictions (transaction_id, fraud_probability, prediction)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (transaction_id) DO NOTHING
                    """,
                    (transaction_id, probability, prediction)
                )

                # 6. KAMA NI RISK KUBWA, SUKUMA KWENYE QUEUE YA MAAFISA
                if tx_status == "HELD":
                    cursor.execute(
                        """
                        INSERT INTO fraud_review_queue (transaction_id, fraud_probability, status)
                        VALUES (%s, %s, 'PENDING')
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (transaction_id, probability)
                    )
                    logging.info(
                        f"TX={transaction_id} | RISK={probability:.4f} | STATUS=HELD -> Sent to Officer Queue.")
                else:
                    logging.info(
                        f"TX={transaction_id} | RISK={probability:.4f} | STATUS=APPROVED -> Processed Immediately.")

                conn.commit()

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

        # Re-initialize consumer
        consumer = KafkaConsumer(
            TOPIC, bootstrap_servers="localhost:9092", auto_offset_reset="latest",
            enable_auto_commit=True, group_id=GROUP_ID,
            value_deserializer=lambda x: json.loads(x.decode("utf-8")), api_version=(3, 5, 0)
        )
