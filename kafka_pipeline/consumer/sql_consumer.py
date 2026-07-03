from kafka import KafkaConsumer
from backend.app.database.connection import get_connection
import json
import psycopg2
import time

conn = get_connection()
cursor = conn.cursor()


consumer = KafkaConsumer(
    "transactions",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="sql-consumer-group-v6",
    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
    api_version=(3, 5, 0)
)

print("Transactions Consumer running...")

count = 0
BATCH_SIZE = 500

while True:
    try:
        for message in consumer:
            tx = message.value

            cursor.execute(
                """
                INSERT INTO transactions(
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
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    tx.get("transaction_id"),
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

            count += 1

            if count % BATCH_SIZE == 0:
                conn.commit()
                print(f"Committed {count} rows")

    except psycopg2.Error as e:
        print("DB error:", e)
        time.sleep(5)
        conn = get_connection()
        cursor = conn.cursor()

    except Exception as e:
        print("Error:", e)
        time.sleep(5)


#import json
#import logging
#import time

#import psycopg2
#from psycopg2.extras import execute_values
#from kafka import KafkaConsumer

#from backend.app.database.connection import get_connection


## ==========================================================
## CONFIGURATION
## ==========================================================

#TOPIC = "transactions"
#BOOTSTRAP_SERVERS = "localhost:9092"
#GROUP_ID = "sql-consumer-group-v6"

#BATCH_SIZE = 500
#POLL_TIMEOUT_MS = 3000


## ==========================================================
## LOGGING
## ==========================================================

##logging.basicConfig(
##    level=logging.INFO,
##    format="%(asctime)s | %(levelname)s | %(message)s"
##)

##logger = logging.getLogger(__name__)


## ==========================================================
## DATABASE
## ==========================================================

#def connect_db():

#    while True:
#        try:
#            conn = get_connection()
#            conn.autocommit = False
#            logger.info("Connected to PostgreSQL")
#            return conn

#        except Exception as e:
#            logger.error(f"Database connection failed: {e}")
#            time.sleep(5)


## ==========================================================
## KAFKA
## ==========================================================

#consumer = KafkaConsumer(
#    TOPIC,

#    bootstrap_servers=BOOTSTRAP_SERVERS,

#    group_id=GROUP_ID,

#    value_deserializer=lambda x: json.loads(x.decode()),

#    auto_offset_reset="earliest",

#    enable_auto_commit=False,

#    api_version=(3, 5, 0),

#    max_poll_records=BATCH_SIZE
#)

#logger.info("Kafka Consumer Started")


#conn = connect_db()
#cursor = conn.cursor()


## ==========================================================
## INSERT QUERY
## ==========================================================

#INSERT_SQL = """
#INSERT INTO transactions
#(
#    transaction_id,
#    step,
#    type,
#    amount,
#    nameOrig,
#    oldbalanceOrg,
#    newbalanceOrig,
#    nameDest,
#    oldbalanceDest,
#    newbalanceDest
#)

#VALUES %s

#ON CONFLICT (transaction_id)
#DO NOTHING
#"""


## ==========================================================
## MAIN LOOP
## ==========================================================

#try:

#    while True:

#        # ==================================================
#        # Poll Kafka
#        # ==================================================

#        records = consumer.poll(
#            timeout_ms=POLL_TIMEOUT_MS,
#            max_records=BATCH_SIZE
#        )

#        if not records:
#            continue

#        rows = []

#        total_messages = 0

#        for tp, messages in records.items():

#            total_messages += len(messages)

#            for msg in messages:

#                tx = msg.value

#                rows.append(
#                    (
#                        tx.get("transaction_id"),
#                        int(tx.get("step", 0)),
#                        str(tx.get("type", "")),
#                        float(tx.get("amount", 0)),
#                        str(tx.get("nameOrig", "")),
#                        float(tx.get("oldbalanceOrg", 0)),
#                        float(tx.get("newbalanceOrig", 0)),
#                        str(tx.get("nameDest", "")),
#                        float(tx.get("oldbalanceDest", 0)),
#                        float(tx.get("newbalanceDest", 0)),
#                    )
#                )

#        try:

#            # ==============================================
#            # BULK INSERT
#            # Much faster than cursor.execute() in a loop
#            # ==============================================

#            execute_values(
#                cursor,
#                INSERT_SQL,
#                rows,
#                page_size=BATCH_SIZE
#            )

#            conn.commit()

#            # ==============================================
#            # Commit Kafka offset ONLY after DB commit
#            # ==============================================

#            consumer.commit()

#            logger.info(
#                f"Inserted {len(rows)} rows | Kafka Messages={total_messages}"
#            )

#        except psycopg2.Error as e:

#            logger.error(f"Database Error: {e}")

#            conn.rollback()

#            cursor.close()
#            conn.close()

#            time.sleep(5)

#            conn = connect_db()
#            cursor = conn.cursor()

#        except Exception as e:

#            logger.exception(e)

#            conn.rollback()


## ==========================================================
## SHUTDOWN
## ==========================================================

#except KeyboardInterrupt:

#    logger.info("Stopping Consumer...")


#finally:

#    try:
#        conn.commit()
#    except:
#        pass

#    try:
#        consumer.commit()
#    except:
#        pass

#    try:
#        cursor.close()
#    except:
#        pass

#    try:
#        conn.close()
#    except:
#        pass

#    try:
#        consumer.close()
#    except:
#        pass

#    logger.info("Consumer Closed Successfully")
