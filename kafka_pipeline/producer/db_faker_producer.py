import os
import time
import uuid
import random
import logging
import psycopg2
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)


TOTAL_TRANSACTIONS = int(os.getenv("TEST_DATA_COUNT"))
DELAY_SECONDS = float(os.getenv("TEST_DATA_DELAY"))
DB_HOST = os.getenv("LOCAL_DB_HOST")
DB_PORT = os.getenv("LOCAL_DB_PORT")
DB_NAME = os.getenv("LOCAL_DB_NAME")
DB_USER = os.getenv("LOCAL_DB_USER")
DB_PASSWORD = os.getenv("LOCAL_DB_PASSWORD")

fake = Faker()
TRANSACTION_TYPES = ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT", "CASH_IN"]


def get_local_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logging.error(
            f"❌ Imeshindikana kuunganisha na Local DB ({DB_HOST}:{DB_PORT}): {e}")
        return None


def generate_fake_transaction(step_count):
    oldbalance_org = round(random.uniform(500.0, 100000.0), 2)
    amount = round(random.uniform(10.0, oldbalance_org), 2)
    newbalance_orig = round(oldbalance_org - amount, 2)

    oldbalance_dest = round(random.uniform(0.0, 200000.0), 2)
    newbalance_dest = round(oldbalance_dest + amount, 2)

    return {
        "transaction_id": f"TX-{uuid.uuid4().hex[:10].upper()}",
        "step": step_count,
        "type": random.choice(TRANSACTION_TYPES),
        "amount": amount,
        "nameOrig": f"C{random.randint(100000000, 999999999)}",
        "oldbalanceOrg": oldbalance_org,
        "newbalanceOrig": newbalance_orig,
        "nameDest": f"M{random.randint(100000000, 999999999)}",
        "oldbalanceDest": oldbalance_dest,
        "newbalanceDest": newbalance_dest
    }


def start_streaming(count_limit=None, delay=0.1):
    conn = get_local_db_connection()
    if not conn:
        logging.critical("🚨 Database connection haipo! Stream imesitishwa.")
        return

    cursor = conn.cursor()

    target_str = f"{count_limit} transactions" if count_limit else "STREAMING BILA KIKOMO"
    logging.info(
        f"🚀 Generater imeanza... Lengo: [{target_str}] | Delay: {delay}s")

    step = 1
    sent_count = 0

    try:
        while True:
            # Kama tumeweka kikomo na tumekifikia, sitisha loop
            if count_limit and sent_count >= count_limit:
                logging.info(
                    f"✅ ZIMETUMWA DATA {sent_count}/{count_limit} KIKAMILIFU! Process imekamilika.")
                break

            tx = generate_fake_transaction(step)

            insert_query = """
                INSERT INTO transactions (
                    transaction_id, step, type, amount, nameOrig,
                    oldbalanceOrg, newbalanceOrig, nameDest, oldbalanceDest, newbalanceDest
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """

            cursor.execute(insert_query, (
                tx["transaction_id"],
                tx["step"],
                tx["type"],
                tx["amount"],
                tx["nameOrig"],
                tx["oldbalanceOrg"],
                tx["newbalanceOrig"],
                tx["nameDest"],
                tx["oldbalanceDest"],
                tx["newbalanceDest"]
            ))

            conn.commit()
            sent_count += 1

            progress = f"[{sent_count}/{count_limit}]" if count_limit else f"[{sent_count}]"
            logging.info(
                f"📥 LOCAL DB INSERT {progress}: TX={tx['transaction_id']} | Type={tx['type']} | Amount={tx['amount']}")

            step += 1
            time.sleep(delay)

    except KeyboardInterrupt:
        logging.info("🛑 Stream imesitishwa na mtumiaji.")
    except Exception as e:
        logging.error(f"⚠️ Hitilafu wakati wa kuingiza data: {e}")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    start_streaming(count_limit=TOTAL_TRANSACTIONS, delay=DELAY_SECONDS)
