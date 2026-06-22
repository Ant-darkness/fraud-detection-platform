import json
import pandas as pd
import time
from kafka import KafkaProducer
import os

DATA_PATH = r"C:\Users\Abely\Desktop\datasets\Fraud_dataset.csv"
CHECKPOINT_FILE = "producer_checkpoint.txt"
TOPIC = "transactions"

# -----------------------
# Kafka Producer
# -----------------------
producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    linger_ms=10,
    batch_size=32768
)

# -----------------------
# Load Data
# -----------------------
df = pd.read_csv(DATA_PATH)
total = len(df)

# -----------------------
# Resume logic
# -----------------------
start_index = 0
if os.path.exists(CHECKPOINT_FILE):
    with open(CHECKPOINT_FILE, "r") as f:
        start_index = int(f.read().strip())

print(f"Starting from index: {start_index} / {total}")

# -----------------------
# Send loop
# -----------------------
batch_size = 1000
batch = []
start_time = time.time()

for i in range(start_index, total):
    row = df.iloc[i].to_dict()
    batch.append(row)

    if len(batch) >= batch_size:
        for msg in batch:
            producer.send(TOPIC, value=msg)

        producer.flush()

        # checkpoint update
        with open(CHECKPOINT_FILE, "w") as f:
            f.write(str(i))

        print(f"Sent up to row: {i} | batch={batch_size}")
        batch = []

# send remaining
for msg in batch:
    producer.send(TOPIC, value=msg)

producer.flush()

with open(CHECKPOINT_FILE, "w") as f:
    f.write(str(total))

print("PRODUCER DONE ✅")
print("Total time:", time.time() - start_time, "seconds")
