import os
import json
import time
import pandas as pd
import logging
from dotenv import load_dotenv
from kafka import KafkaProducer


load_dotenv()

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")


BOOTSTRAP_SERVERS = "localhost:9092" if not os.path.exists(
    "/.dockerenv") else os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
TOPIC = os.getenv("KAFKA_TOPIC", "transactions")
DATASET_PATH = "C:/Users/Abely/Desktop/datasets/Fraud_dataset.csv"

logging.info(f"Connecting Producer to Kafka at {BOOTSTRAP_SERVERS}...")

producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    api_version=(3, 5, 0)
)

if not os.path.exists(DATASET_PATH):
    logging.error(
        f"🚨 Faili la dataset halipatikani kwenye path: {DATASET_PATH}")
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

df = pd.read_csv(DATASET_PATH)

logging.info("Starting to send data to Kafka...")
count = 0

for _, row in df.iterrows():
    transaction = row.to_dict()

    producer.send(TOPIC, value=transaction)
    count += 1

    if count % 500 == 0:
        producer.flush()
        logging.info(f"Sent {count} transactions...")
        time.sleep(0.5)  
producer.flush()
logging.info(f"✅ Data zote {count} zimetumwa kikamilifu!")
