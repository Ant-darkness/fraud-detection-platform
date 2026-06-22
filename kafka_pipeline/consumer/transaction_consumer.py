from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="fraud-consumer-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)


print("Waiting for transactions...")

for message in consumer:
    transaction = message.value
    print("Received:", transaction)
