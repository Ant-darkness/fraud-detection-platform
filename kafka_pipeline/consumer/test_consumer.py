# test_consumer.py
import json
from kafka import KafkaConsumer

TOPIC = "local_cdc.public.transactions"
BOOTSTRAP_SERVERS = "localhost:9092"

print(f"📡 Test Consumer Inaanza... Inalisten topic: {TOPIC}")

consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers=BOOTSTRAP_SERVERS,
    auto_offset_reset="latest",  # Soma hata snapshots au data mpya
    enable_auto_commit=True,
    group_id="test-cdc-group-v1",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

for message in consumer:
    print("\n🔥 [NEW CDC EVENT RECEIVED FROM KAFKA!]")
    print(json.dumps(message.value, indent=2))
