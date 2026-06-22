import json
import pandas as pd
import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    api_version=(3, 5, 0)
)


df = pd.read_csv("C:/Users/Abely/Desktop/datasets/Fraud_dataset.csv")

print("Inaanza kutuma data...")
count = 0

for _, row in df.iterrows():
    transaction = row.to_dict()

    producer.send("transactions", value=transaction)
    count += 1

    if count % 500 == 0:
        producer.flush()
        print(f"Sent {count} transactions...")


producer.flush()
print("Data zote zimetumwa!")
