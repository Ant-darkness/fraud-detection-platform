import json
import time
import uuid
import hashlib
import threading
import psycopg2  # Au mysql.connector / pyodbc kulingana na DB yako
from psycopg2.extras import RealDictCursor
from kafka import KafkaProducer


class AutomatedLiveProducer:
    def __init__(self, db_config, bootstrap_servers=['localhost:9092']):
        # 1. Kafka Producer setup ikiwa na Idempotence kuzuia duplication
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(
                v, default=str).encode('utf-8'),
            api_version=(3, 5, 0),
            enable_idempotence=True,
            acks='all'
        )

        self.db_config = db_config
        self.topic_mapping = {
            'frontend': 'transactions_1',
            'csv': 'transactions_2',
            'cdc_live': 'transactions'
        }

        # Variable ya ku-track transaction ya mwisho kuingia DB (kuzuia duplicates)
        self.last_processed_id = 0
        self.is_running = True

    def _generate_unique_id(self, data: dict) -> str:
        if 'transaction_id' in data and data['transaction_id']:
            return str(data['transaction_id'])
        elif 'id' in data and data['id']:
            return str(data['id'])
        else:
            payload_string = json.dumps(data, default=str, sort_keys=True)
            return hashlib.md5(payload_string.encode('utf-8')).hexdigest()

    def send_transaction(self, source_type: str, payload: dict):
        """Method ya kutuma data za Frontend au CSV manual"""
        topic = self.topic_mapping.get(source_type.lower())
        if not topic:
            raise ValueError(f"Unknown source type: {source_type}")

        payload['transaction_id'] = self._generate_unique_id(payload)
        payload['source_type'] = source_type

        self.producer.send(
            topic,
            key=payload['transaction_id'].encode('utf-8'),
            value=payload
        )
        self.producer.flush()

    # =========================================================================
    # LIVE DATABASE LISTENER (KUTAZAMA DATABASE 24/7)
    # =========================================================================
    def start_db_listener(self, table_name="bank_transactions", id_column="id", poll_interval=2):
        """
        Hii inarun background thread inayocheki database kila sekunde chache.
        Kama ukiingiza data mpya manually, yenyewe inainasa na kuisukuma Kafka.
        """
        def listen():
            print(
                f"👀 Live DB Listener ipo MACHO! Inafuatilia table: '{table_name}'...")

            # Pata ID kubwa iliyopo sasa hivi DB ili usisome data za zamani
            try:
                conn = psycopg2.connect(**self.db_config)
                cursor = conn.cursor()
                cursor.execute(
                    f"SELECT COALESCE(MAX({id_column}), 0) FROM {table_name}")
                self.last_processed_id = cursor.fetchone()[0]
                cursor.close()
                conn.close()
                print(
                    f"📌 DB Listener imeanzishwa kuanzia Last ID: {self.last_processed_id}")
            except Exception as e:
                print(f"❌ Error kuconnect DB kwenye start: {e}")

            while self.is_running:
                try:
                    conn = psycopg2.connect(**self.db_config)
                    cursor = conn.cursor(cursor_factory=RealDictCursor)

                    # Omba records zote MPYA ambazo ID yake ni kubwa kuliko last_processed_id
                    query = f"""
                        SELECT * FROM {table_name} 
                        WHERE {id_column} > %s 
                        ORDER BY {id_column} ASC
                    """
                    cursor.execute(query, (self.last_processed_id,))
                    new_rows = cursor.fetchall()

                    for row in new_rows:
                        row_dict = dict(row)

                        # Tuma live data hii kwenda Topic ya 'transactions'
                        self.send_transaction(
                            source_type='cdc_live', payload=row_dict)

                        # Update ID ya mwisho ili isijirudie tena!
                        self.last_processed_id = row_dict[id_column]
                        print(
                            f"⚡ LIVE DATA DETECTED & SENT! [ID: {self.last_processed_id}] -> Topic: 'transactions'")

                    cursor.close()
                    conn.close()

                except Exception as e:
                    print(f"⚠️ Listener DB Connection issue: {e}")

                # Subiri sekunde 2 kabla ya kuangalia tena DB
                time.sleep(poll_interval)

        # Anzisha listener kwenye Thread ya pembeni ili isiblog programu kuu
        thread = threading.Thread(target=listen, daemon=True)
        thread.start()


# =============================================================================
# JINSI YA KU-RUN PRODUCER HUYU SASA HIVI
# =============================================================================
if __name__ == "__main__":
    # Weka Taarifa za Database yako hapa
    DB_CONFIG = {
        'dbname': 'your_bank_db',
        'user': 'postgres',
        'password': 'your_password',
        'host': 'localhost',  # au container name kama ipo kwenye Docker network
        'port': 5432
    }

    # 1. Kuanzisha Producer
    producer = AutomatedLiveProducer(db_config=DB_CONFIG)

    # 2. Washa DB Listener (Iwe macho kwenye table ya bank_transactions)
    # Badilisha 'bank_transactions' iwe jina la table yako ya Database
    producer.start_db_listener(
        table_name="bank_transactions", id_column="id", poll_interval=1)

    print("\n🚀 Producer yupo tayari na anasikiliza Live DB!")
    print("Sasa unaweza kwenda kwenye Database yako na kufanya INSERT manual, utaona hapa inainasa papo hapo!\n")

    # Mfano wa kutuma CSV au Frontend wakati Live DB nayo inaendelea kusikilizwa:
    # producer.send_transaction('frontend', {'amount': 10000, 'user': 'Abely'})

    # Keep script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Producer...")
        producer.is_running = False
