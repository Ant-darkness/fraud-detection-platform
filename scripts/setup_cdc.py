import os
import json
import time
import requests
import logging
import sys

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")

IS_DOCKER = os.path.exists("/.dockerenv")
DEBEZIUM_HOST = "http://debezium:8083" if IS_DOCKER else "http://localhost:8083"
DEBEZIUM_URL = f"{DEBEZIUM_HOST}/connectors"

CONFIG_FILE_PATH = os.path.join(os.path.dirname(__file__), "cdc_config.json")


def load_connector_config():
    if not os.path.exists(CONFIG_FILE_PATH):
        raise FileNotFoundError(
            f"❌ Faili la JSON halijapatikana sehemu ya: {CONFIG_FILE_PATH}")
    with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def wait_and_register_cdc():
    connector_payload = load_connector_config()
    connector_name = connector_payload.get("name", "local-db-connector")

    logging.info(
        f"⏳ Inasubiri Debezium Service ({DEBEZIUM_URL}) iwahi kuwaka...")
    ready = False

    # RUKUSHA HAPA: Jaribu mara 90 (sekunde 180 = Dakika 3) badala ya mara 30
    for i in range(100):
        try:
            res = requests.get(DEBEZIUM_URL, timeout=3)
            if res.status_code == 200:
                logging.info("✅ Debezium API ipo tayari!")
                ready = True
                break
        except requests.exceptions.RequestException:
            pass

        if i % 5 == 0:
            logging.info(f"⌛ Bado inasubiri Debezium API... ({i*2}s/180s)")
        time.sleep(2)

    if not ready:
        logging.error("❌ Debezium API haikuwaka kwa wakati (Timeout 180s).")
        sys.exit(1)

    try:
        status_res = requests.get(
            f"{DEBEZIUM_URL}/{connector_name}/status", timeout=3)
        if status_res.status_code == 200:
            logging.info(f"🔄 Connector '{connector_name}' tayari ipo Active.")
            return
    except Exception:
        pass

    logging.info(
        f"🚨 Connector '{connector_name}' haijapatikana. Inasajili kulingana na cdc_config.json...")

    try:
        res = requests.post(
            DEBEZIUM_URL,
            json=connector_payload,
            headers={"Content-Type": "application/json"}
        )
        if res.status_code in [200, 201]:
            logging.info(
                f"🎉 Debezium CDC Connector '{connector_name}' imesajiliwa kikamilifu!")
        else:
            logging.error(f"❌ Imeshindikana kusajili connector: {res.text}")
            sys.exit(1)
    except Exception as e:
        logging.error(
            f"❌ Hitilafu wakati wa kutuma ombi la kusajili connector: {e}")
        sys.exit(1)


if __name__ == "__main__":
    wait_and_register_cdc()
