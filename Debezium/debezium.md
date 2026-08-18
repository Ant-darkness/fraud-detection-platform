# Debezium + PostgreSQL + Kafka (CDC) — Full Setup Notes kwa Python

> Maelezo haya yameandikwa kwa Kiswahili, lakini **istilahi za kitaalamu** (kama vile `snapshot`, `replication slot`, `topic`, `connector`, `WAL`, n.k.) zimeachwa kwa Kiingereza kama zilivyo, ili maana yake isipotee.

---

## 1. Dhana ya Msingi (Overview)

**Debezium** ni chombo (platform) kinachotumika kwa **Change Data Capture (CDC)** — yaani kufuatilia mabadiliko ya row-level (INSERT, UPDATE, DELETE, TRUNCATE) yanayotokea kwenye database (kwa mfano PostgreSQL) na kuyageuza kuwa **events** ambazo huchapishwa (published) kwenye Kafka topics kwa **live/real-time**.

Mfumo wako una sehemu tatu kuu:

1. **PostgreSQL (Source Database)** — hii ndiyo database yako ya local PC, ndiyo chanzo cha data (source).
2. **Kafka + Zookeeper (au KRaft) + Kafka Connect** — hizi zita-run kwenye Docker (dockerized), na ndani ya Kafka Connect ndipo **Debezium connector plugin** itakaa.
3. **Python Consumer** — script itakayosoma (consume) events kutoka Kafka topics papo kwa hapo (instantly) kila data mpya inapoingia PostgreSQL.

Debezium **haiwezi ku-run peke yake** — inahitaji kupachikwa (deployed) ndani ya **Kafka Connect** kama connector (au kutumia Debezium Server/Debezium Engine kama huna Kafka Connect, lakini hapa tutatumia njia ya kawaida — Kafka Connect).

---

## 2. Jinsi Debezium Inavyofanya Kazi (How the connector works)

- Wakati wa kwanza connector inapoanza, hufanya **initial consistent snapshot** ya database yote (au tables ulizochagua) — hii ni "picha" ya sasa hivi ya data.
- Baada ya snapshot kukamilika, connector huanza **streaming changes** kwa kutumia **PostgreSQL logical decoding** (WAL - Write-Ahead Log), ikitumia plugin ya `pgoutput` (default tangu PostgreSQL 10+, hii haihitaji kusakinisha kitu chochote cha ziada).
- Kila mabadiliko (change event) hutumwa Kafka topic maalum kwa kila table, kwa jina lenye muundo:
  ```
  topicPrefix.schemaName.tableName
  ```
  Mfano: `fraud_radar.public.transactions`

- Connector inatumia **replication slot** kwenye PostgreSQL kuweka nafasi (position/LSN - Log Sequence Number) ilipofikia, ili ikisimama na kuanza tena, iendelee pale ilipoishia bila kupoteza data (fault tolerant).

---

## 3. Maandalizi ya PostgreSQL (Source - Local PC yako)

Kwa kuwa PostgreSQL yako iko **local (nje ya Docker)**, na Kafka Connect + Debezium vitakuwa **ndani ya Docker**, unahitaji kuhakikisha Docker containers zinaweza "kuona" (reach) database yako ya local.

### 3.1 Ruhusu logical replication kwenye `postgresql.conf`

Fungua faili la `postgresql.conf` (mfano: `C:\Program Files\PostgreSQL\<version>\data\postgresql.conf` kwa Windows, au `/etc/postgresql/<version>/main/postgresql.conf` kwa Linux) na weka (au hakikisha) settings zifuatazo:

```conf
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10
max_connections = 100
```

- `wal_level = logical` — **ndiyo setting muhimu zaidi**. Bila hii, Debezium haiwezi kusoma WAL kwa logical decoding.
- `max_replication_slots` na `max_wal_senders` — hakikisha ni kubwa ya kutosha (angalau 1 zaidi ya connectors zako).

### 3.2 Tengeneza Debezium replication user (msingi wa Security)

Ni vizuri usitumie `superuser` — badala yake tengeneza user maalum wa replication kama ilivyoshauriwa kwenye documentation (Security section):

```sql
CREATE ROLE debezium WITH REPLICATION LOGIN PASSWORD 'debezium_password';

-- Mpe ruhusa ya kusoma tables husika
GRANT CONNECT ON DATABASE fraud_radar_db TO debezium;
GRANT USAGE ON SCHEMA public TO debezium;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO debezium;

-- Kwa pgoutput plugin, replication user anahitaji ruhusa ya kuunda publication
ALTER ROLE debezium WITH REPLICATION;
```

Kama unatumia `pgoutput` (ndiyo default na inayopendekezwa kwani haihitaji plugin ya ziada), unahitaji pia user awe na ruhusa ya `CREATE` kwenye database ili aweze kuunda **publication** kiotomatiki (au uunde publication mwenyewe kwa mkono — angalia sehemu 3.4).

### 3.3 Ruhusu Docker containers zi-connect na PostgreSQL yako ya local

Kwenye faili `pg_hba.conf`, ongeza mstari unaoruhusu connection kutoka Docker network (kwa default Docker Desktop hutumia subnet kama `172.17.0.0/16` au unaweza kuruhusu range pana zaidi kwa majaribio ya local):

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    fraud_radar_db  debezium        172.17.0.0/16           scram-sha-256
host    fraud_radar_db  debezium        0.0.0.0/0               scram-sha-256   # kwa majaribio tu (development)
```

Kisha **restart PostgreSQL service** ili settings zote hapo juu zianze kufanya kazi:

```bash
# Windows (PowerShell kama Administrator)
Restart-Service postgresql-x64-<version>

# Linux
sudo systemctl restart postgresql
```

> **Muhimu:** Docker containers hazioni `localhost` ya PC yako moja kwa moja. Tumia:
> - `host.docker.internal` (inafanya kazi vizuri kwenye **Docker Desktop** - Windows/Mac)
> - Au IP address halisi ya PC yako kwenye local network (mfano `192.168.1.50`) kama uko Linux.

### 3.4 (Hiari) Tengeneza publication kwa mkono

Kama huna uhakika na ruhusa za `CREATE`, unaweza kutengeneza publication mwenyewe kabla:

```sql
CREATE PUBLICATION debezium_publication FOR ALL TABLES;
-- Au kwa tables maalum tu:
-- CREATE PUBLICATION debezium_publication FOR TABLE public.transactions, public.fraud_alerts;
```

### 3.5 Signaling table (kwa Ad hoc / Incremental snapshots - hiari)

Kama baadaye utahitaji ku-trigger snapshot upya (ad hoc snapshot) bila ku-restart connector, tengeneza signaling table:

```sql
CREATE TABLE public.debezium_signal (
    id VARCHAR(42) PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    data VARCHAR(2048) NULL
);
```

---

## 4. Docker Setup — Kafka + Zookeeper + Kafka Connect (na Debezium plugin)

Hapa chini ni `docker-compose.yml` kamili yenye:
- **Zookeeper** (coordination ya Kafka)
- **Kafka broker**
- **Kafka Connect** yenye Debezium PostgreSQL connector plugin tayari imewekwa (kwa kutumia picha rasmi ya `debezium/connect`)
- **Kafka UI** (hiari, kukusaidia ku-monitor topics kwa urahisi kwa macho)

```yaml
version: "3.8"

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - cdc-network

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: kafka
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "9092:9092"
      - "29092:29092"
    networks:
      - cdc-network

  kafka-connect:
    image: debezium/connect:2.7
    container_name: kafka-connect
    depends_on:
      - kafka
    ports:
      - "8083:8083"
    environment:
      BOOTSTRAP_SERVERS: kafka:9092
      GROUP_ID: 1
      CONFIG_STORAGE_TOPIC: connect_configs
      OFFSET_STORAGE_TOPIC: connect_offsets
      STATUS_STORAGE_TOPIC: connect_statuses
      KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_KEY_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: "false"
    # Muhimu: hii inaruhusu container ku-reach PostgreSQL iliyo local kwenye PC yako (Docker Desktop)
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - cdc-network

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
      - kafka-connect
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_NAME: connect
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_ADDRESS: http://kafka-connect:8083
    networks:
      - cdc-network

networks:
  cdc-network:
    driver: bridge
```

### Kuanzisha (kuwasha) mfumo

```bash
docker compose up -d
```

Subiri sekunde ~30-60 ili Kafka Connect iwe tayari kabisa (health check), kisha thibitisha kwa:

```bash
curl http://localhost:8083/connector-plugins
```

Kama utaona `io.debezium.connector.postgresql.PostgresConnector` kwenye list, plugin iko tayari.

---

## 5. Debezium Connector Configuration (JSON) — Kuunganisha na PostgreSQL yako ya Local

Hii ndiyo **connector config** itakayotumwa kwa Kafka Connect REST API (`POST /connectors`), ikimwambia Debezium a-connect na PostgreSQL yako ya local na aanze CDC.

Tengeneza faili `register-postgres-connector.json`:

```json
{
  "name": "fraud-radar-postgres-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",

    "database.hostname": "host.docker.internal",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "debezium_password",
    "database.dbname": "fraud_radar_db",

    "topic.prefix": "fraud_radar",

    "plugin.name": "pgoutput",
    "slot.name": "debezium_fraud_slot",
    "publication.name": "debezium_publication",
    "publication.autocreate.mode": "filtered",

    "table.include.list": "public.transactions,public.fraud_alerts,public.customers",

    "snapshot.mode": "initial",
    "snapshot.isolation.mode": "repeatable_read",

    "signal.data.collection": "public.debezium_signal",

    "heartbeat.interval.ms": "10000",

    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": "false",
    "value.converter.schemas.enable": "false",

    "time.precision.mode": "adaptive",

    "tombstones.on.delete": "true",
    "include.schema.changes": "true"
  }
}
```

### Maelezo ya Configuration Muhimu (kwa Kiswahili)

| Property | Maelezo |
|---|---|
| `database.hostname` | `host.docker.internal` — hii inaiambia container ku-reach PostgreSQL iliyo nje ya Docker, kwenye PC yako ya local. |
| `plugin.name` | `pgoutput` — ndiyo plugin ya kawaida (native) ya PostgreSQL 10+, haihitaji kusakinisha chochote cha ziada. |
| `slot.name` | Jina la **replication slot** litakalotumika. Kila connector inahitaji jina la kipekee (unique). |
| `publication.name` | Jina la publication itakayotumika kwa `pgoutput`. Kama haipo, na user ana ruhusa, Debezium ataitengeneza kiotomatiki (`publication.autocreate.mode`). |
| `table.include.list` | Orodha ya tables (format: `schema.table`) unazotaka zifuatiliwe tu. Bila hii, tables zote zitafuatiliwa. |
| `snapshot.mode` | `initial` — inamaanisha snapshot itafanyika mara ya kwanza tu, kisha itaendelea kwa streaming. Chaguo lingine ni `no_data` (usifanye snapshot kabisa, anza streaming tu). |
| `heartbeat.interval.ms` | Inasaidia connector "kupumua" (heartbeat) hasa kwenye tables zenye mabadiliko machache, ili WAL isizidiwe (WAL disk space consumption). |
| `topic.prefix` | Hii ndiyo itakayotumika kutengeneza jina la topic: `topic.prefix.schema.table` (mfano: `fraud_radar.public.transactions`). |
| `tombstones.on.delete` | Baada ya DELETE event, Debezium hutuma "tombstone event" (value = null) — hii husaidia Kafka log compaction. |

### Kutuma (Register) Connector kwa Kafka Connect

```bash
curl -X POST -H "Content-Type: application/json" \
  --data @register-postgres-connector.json \
  http://localhost:8083/connectors
```

Kuangalia status ya connector:

```bash
curl http://localhost:8083/connectors/fraud-radar-postgres-connector/status
```

Kuiondoa (delete) connector endapo unataka kubadilisha config:

```bash
curl -X DELETE http://localhost:8083/connectors/fraud-radar-postgres-connector
```

---

## 6. Python Consumer — Kusoma Data Live/Instantly kutoka Kafka

Sakinisha library (chagua moja — `confluent-kafka` ni haraka zaidi kwa production, `kafka-python` ni rahisi zaidi kwa majaribio):

```bash
pip install confluent-kafka
# au
pip install kafka-python
```

### 6.1 Kwa kutumia `confluent-kafka` (Inashauriwa - Production)

```python
import json
from confluent_kafka import Consumer, KafkaException

# Configuration ya connection na Kafka broker (iliyo ndani ya Docker)
conf = {
    "bootstrap.servers": "localhost:29092",   # tunatumia PLAINTEXT_HOST listener
    "group.id": "fraud-radar-cdc-consumer",
    "auto.offset.reset": "earliest",          # 'earliest' = soma tangu mwanzo; 'latest' = tangu sasa hivi tu
    "enable.auto.commit": True,
}

consumer = Consumer(conf)

# Topics zinazofuatana na tables ulizoweka kwenye table.include.list
topics = [
    "fraud_radar.public.transactions",
    "fraud_radar.public.fraud_alerts",
    "fraud_radar.public.customers",
]

consumer.subscribe(topics)

print("Consumer imeanza kusikiliza mabadiliko papo kwa hapo (live CDC)...")

try:
    while True:
        msg = consumer.poll(timeout=1.0)

        if msg is None:
            continue
        if msg.error():
            raise KafkaException(msg.error())

        # Ujumbe wa Debezium huja na 'payload' yenye before/after/op fields
        raw_value = msg.value()
        if raw_value is None:
            # Hii ni "tombstone event" (baada ya DELETE)
            print(f"[TOMBSTONE] Key: {msg.key()}")
            continue

        event = json.loads(raw_value.decode("utf-8"))

        op = event.get("op")  # c=create, u=update, d=delete, r=read(snapshot), t=truncate

        if op == "c" or op == "r":
            print(f"[CREATE/SNAPSHOT] Table: {msg.topic()} | Data mpya: {event.get('after')}")
        elif op == "u":
            print(f"[UPDATE] Table: {msg.topic()} | Kabla: {event.get('before')} | Baada: {event.get('after')}")
        elif op == "d":
            print(f"[DELETE] Table: {msg.topic()} | Iliyofutwa: {event.get('before')}")
        elif op == "t":
            print(f"[TRUNCATE] Table: {msg.topic()} imefutwa yote.")

except KeyboardInterrupt:
    print("Consumer imesimamishwa na mtumiaji.")
finally:
    consumer.close()
```

### 6.2 Kwa kutumia `kafka-python` (Rahisi zaidi kwa majaribio)

```python
import json
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "fraud_radar.public.transactions",
    "fraud_radar.public.fraud_alerts",
    bootstrap_servers=["localhost:29092"],
    auto_offset_reset="earliest",
    group_id="fraud-radar-cdc-consumer",
    value_deserializer=lambda v: json.loads(v.decode("utf-8")) if v else None,
)

print("Inasikiliza data live kutoka PostgreSQL kupitia Debezium...")

for message in consumer:
    event = message.value
    if event is None:
        continue

    op = event.get("op")
    print(f"Topic: {message.topic} | Operation: {op} | Data: {event.get('after') or event.get('before')}")
```

> **Kumbuka:** Kwenye Python (nje ya Docker), tumia `localhost:29092` (PLAINTEXT_HOST listener) — SIYO `kafka:9092` (hiyo ni kwa ndani ya Docker network tu).

---

## 7. Mtiririko Kamili wa Utekelezaji (Full Workflow Summary)

1. **PostgreSQL (local):** weka `wal_level=logical`, tengeneza `debezium` user mwenye ruhusa, ruhusu `pg_hba.conf`, restart service.
2. **Docker:** `docker compose up -d` — hii itawasha Zookeeper, Kafka, Kafka Connect (na Debezium plugin), na Kafka UI.
3. **Register Connector:** tuma `register-postgres-connector.json` kwa Kafka Connect REST API (`POST /connectors`).
4. Debezium itafanya **initial snapshot** ya tables zako, kisha itaanza **streaming** mabadiliko yote mapya (INSERT/UPDATE/DELETE) papo kwa hapo kutoka WAL.
5. **Python Consumer:** run script ya Python (`confluent-kafka` au `kafka-python`) — itapokea kila event live kila data ikibadilika kwenye PostgreSQL yako.
6. (Hiari) Tumia **Kafka UI** (`http://localhost:8080`) kuona topics, messages, na connector status kwa macho.

---

## 8. Utatuzi wa Matatizo ya Kawaida (Troubleshooting)

| Tatizo | Sababu Inayowezekana | Suluhisho |
|---|---|---|
| Connector inashindwa ku-connect na database | `host.docker.internal` haifanyi kazi (Linux) | Tumia IP halisi ya PC yako badala yake, mfano `192.168.1.x` |
| `FATAL: no pg_hba.conf entry` | `pg_hba.conf` haijaruhusu connection kutoka Docker | Ongeza mstari sahihi kwenye `pg_hba.conf` na restart PostgreSQL |
| `wal_level` error wakati wa kuanzisha connector | `wal_level` bado ni `replica` badala ya `logical` | Badilisha kwenye `postgresql.conf`, restart PostgreSQL (SIYO reload tu) |
| Connector iko `RUNNING` lakini hakuna events zinazofika Kafka | Hujafanya mabadiliko yoyote baada ya connector kuanza, au `table.include.list` sio sahihi | Fanya INSERT/UPDATE mpya kwenye table husika kuthibitisha |
| Python consumer haipokei kitu | Unatumia port isiyo sahihi (`9092` badala ya `29092`) | Tumia `localhost:29092` unapo-connect kutoka nje ya Docker |

---

Kama unataka, ninaweza pia kukutengenezea **`.env` file** ya kuhifadhi passwords/config kwa usalama zaidi (badala ya kuziweka wazi kwenye JSON), au ku-integrate hii moja kwa moja na **FastAPI backend** ya BOT Fraud Radar yako ili events za CDC ziandikwe moja kwa moja kwenye dashboard yako.
