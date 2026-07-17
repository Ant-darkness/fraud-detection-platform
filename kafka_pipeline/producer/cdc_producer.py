import json
import pandas as pd
import time
import os
from kafka import KafkaProducer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ----------------------------------------
# PRODUCER YAKO (HAIJAGUSWA AU KUHARIBIWA)
# ----------------------------------------
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    api_version=(3, 5, 0)
)

FILE_PATH = "C:/Users/Abely/Desktop/datasets/Fraud_dataset.csv"
last_row_count = 0  # Inatunza idadi ya mistari iliyosomwa ili tusitume data ya zamani tena


def send_to_kafka(file_path):
    """
    Inasoma faili na kutuma data mpya pekee (CDC logic kwa CSV)
    """
    global last_row_count

    if not os.path.exists(file_path):
        print(f"Error: Faili halipo kwenye njia: {file_path}")
        return

    try:
        df = pd.read_csv(file_path)
        total_rows = len(df)

        # Kama kuna mabadiliko (data mpya imeongezeka)
        if total_rows > last_row_count:
            print(
                f"\n[CDC] Mabadiliko yamegundulika! Inatuma data kuanzia mstari wa {last_row_count} hadi {total_rows}...")

            # CDC: Tunakata data mpya tu kuanzia pale tulipoishia mara ya mwisho
            new_data = df.iloc[last_row_count:]
            count = 0

            for _, row in new_data.iterrows():
                transaction = row.to_dict()
                producer.send("transactions", value=transaction)
                count += 1

                if count % 500 == 0:
                    producer.flush()
                    print(f"Sent {count} new transactions...")

            producer.flush()
            last_row_count = total_rows  # Tunajaza index mpya tulipoishia
            print(
                f"[CDC] Data mpya imetumwa kikamilifu! Jumla ya mistari sasa: {last_row_count}")
        else:
            print("[CDC] Hakuna data mpya iliyoongezeka.")

    except Exception as e:
        print(f"Hitilafu imetokea wakati wa kusoma faili: {e}")


# ----------------------------------------------------
# CDC WATCHDOG (Inasikiliza faili likibadilika live)
# ----------------------------------------------------
class CSVChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        # Tunahakikisha kuwa faili lililobadilika ni lile letu la Fraud_dataset.csv pekee
        if event.src_path.replace("\\", "/") == FILE_PATH.replace("\\", "/"):
            # Subiri kidogo mfumo ukimaliza kuandika kwenye faili (Avoid lock issue)
            time.sleep(1)
            send_to_kafka(FILE_PATH)


# ----------------------------------------------------
# PROGRAMU INAPOANZA (MAIN RUN)
# ----------------------------------------------------
if __name__ == "__main__":
    print("Starting to send initial local data...........")

    # 1. Inapakia data iliyopo sasa hivi kwenye local kwanza kama ulivyoomba
    send_to_kafka(FILE_PATH)
    print("All initial local data sent............!")

    # 2. Inaanza kusikiliza mabadiliko ya live (CDC mode)
    folder_to_watch = os.path.dirname(FILE_PATH)
    event_handler = CSVChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=folder_to_watch, recursive=False)

    print(f"\n[CDC ACTIVE] Mfumo unasikiliza mabadiliko kwenye: {FILE_PATH}")
    observer.start()

    try:
        while True:
            # Inaacha programu iendelee kukimbia ikisikiliza faili
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nInasimamisha CDC...")
        observer.stop()

    observer.join()
