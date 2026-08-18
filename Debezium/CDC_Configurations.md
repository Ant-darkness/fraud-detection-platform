# 🛡️ Real-Time Payment Oversight & Fraud Detection System
### Bank of Tanzania Architecture — CDC Pipeline (PostgreSQL → Debezium → Kafka → ML)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — Configure the Source PostgreSQL Database](#4-step-1--configure-the-source-postgresql-database)
5. [Step 2 — Deploy Kafka, Kafka Connect & Kafka UI (Docker)](#5-step-2--deploy-kafka-kafka-connect--kafka-ui-docker)
6. [Step 3 — Register the Debezium Connector](#6-step-3--register-the-debezium-connector)
7. [Step 4 — Verification & Testing Workflow](#7-step-4--verification--testing-workflow)
8. [Step 5 — Real-Time Python Consumer](#8-step-5--real-time-python-consumer)
9. [Step 6 — Security Hardening for Banking Environments](#9-step-6--security-hardening-for-banking-environments)
10. [Step 7 — Monitoring, Maintenance & Failure Recovery](#10-step-7--monitoring-maintenance--failure-recovery)
11. [Troubleshooting Reference](#11-troubleshooting-reference)

---

## 1. Executive Summary

This system is purpose-built for **real-time monitoring and oversight of financial transactions** at scale. It uses a **Change Data Capture (CDC)** architecture — PostgreSQL, Debezium, and Apache Kafka — to detect every transaction the instant it is written to the database, and stream it to a **Machine Learning Inference Engine** for fraud scoring, without adding any latency or load to the core banking system.

Because this pipeline sits close to production banking data, every step below includes the **security and reliability considerations required for a regulated financial institution** (e.g. a central bank), not just a minimal working demo.

---

## 2. System Architecture

```text
┌──────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│                  │     │    PostgreSQL      │     │      Debezium       │
│   DB Generator   │────>│    (fraud_db)       │────>│      Connector       │
│  (Faker Script)  │     │   [WAL Enabled]     │     │  (pgoutput plugin)   │
└──────────────────┘     └───────────────────┘     └────────────────────┘
                                                              │
                                                              ▼
┌──────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│    ML Fraud       │     │   Kafka Consumer    │     │    Apache Kafka      │
│ Prediction Model  │<────│   (Real-Time)        │<────│      Broker           │
│  (XGBoost / RF)   │     │  (fraud-cdc-consumer)│     │  (local_cdc topic)   │
└──────────────────┘     └───────────────────┘     └────────────────────┘
```

**Data flow:**

1. A transaction is written (INSERT) into `public.transactions` in PostgreSQL.
2. PostgreSQL records the change in its **Write-Ahead Log (WAL)**.
3. **Debezium**, running inside **Kafka Connect**, reads the WAL through **logical replication** (`pgoutput` plugin) and converts the change into a structured event.
4. The event is published to a **Kafka topic** (`local_cdc.public.transactions`).
5. A **Python consumer** subscribes to that topic, receives the event within milliseconds, and forwards the transaction to the **ML model** for a fraud probability score.
6. High-risk transactions are pushed into a review queue and officers are notified.

---

## 3. Prerequisites

| Requirement | Notes |
|---|---|
| PostgreSQL 12+ (running locally, outside Docker) | Must support logical replication (`wal_level = logical`) |
| Docker & Docker Compose | To run Kafka, Kafka Connect, and Kafka UI |
| Python 3.9+ | For the real-time consumer and ML inference service |
| Administrator/superuser access to PostgreSQL | Needed once, to create the CDC role and publication |
| Network access from Docker containers to the host PostgreSQL | Via `host.docker.internal` (Docker Desktop) or the host's LAN IP (Linux) |

---

## 4. Step 1 — Configure the Source PostgreSQL Database

### 4.1 Enable logical replication

Edit `postgresql.conf`:

```conf
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10
max_connections = 100
```

> `wal_level = logical` is the single most important setting — without it, Debezium cannot read change events from the WAL at all.

### 4.2 Allow Docker containers to reach PostgreSQL (`pg_hba.conf`)

This step is **frequently missed** and is the most common cause of connector failures when PostgreSQL runs outside Docker. Add an entry allowing the Debezium container's network to authenticate:

```conf
# TYPE  DATABASE   USER            ADDRESS            METHOD
host    fraud_db   debezium_user   172.17.0.0/16      scram-sha-256
```

> On Linux, `host.docker.internal` is not available by default — either add `extra_hosts: ["host.docker.internal:host-gateway"]` in Docker Compose (already included below), or use the host machine's LAN IP directly in the connector config.

### 4.3 Restart PostgreSQL

Configuration changes to `wal_level` require a **full restart**, not a reload:

```bash
# Linux
sudo systemctl restart postgresql

# Windows (PowerShell as Administrator)
Restart-Service postgresql-x64-<version>
```

Verify the setting took effect:

```sql
SHOW wal_level;
-- must return: logical
```

### 4.4 Create a dedicated, least-privilege CDC user

In line with financial-system security standards, Debezium must **never** connect as the `postgres` superuser. Create a dedicated service account scoped only to what it needs:

```sql
-- 1. Create a dedicated service user for CDC
CREATE USER debezium_user WITH PASSWORD 'SecurePassword123!';

-- 2. Grant replication capability (required to read the WAL)
ALTER USER debezium_user REPLICATION;

-- 3. Grant only the access this user actually needs
GRANT CONNECT ON DATABASE fraud_db TO debezium_user;
GRANT USAGE ON SCHEMA public TO debezium_user;
GRANT SELECT ON public.transactions TO debezium_user;

-- 4. Enable full replica identity (required so UPDATE/DELETE events
--    carry the full "before" state of a row, not just the primary key)
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- 5. Create the publication manually (recommended over auto-create,
--    so the CDC user does not need CREATE privilege on the database)
CREATE PUBLICATION local_bot_fraud_publication FOR TABLE public.transactions;
```

> **Why `REPLICA IDENTITY FULL` matters:** by default PostgreSQL only logs primary-key columns for UPDATE/DELETE events. For fraud investigation you typically need the *entire previous row state* (e.g. "what was the balance before this update?"). `FULL` guarantees that, at the cost of slightly larger WAL volume — acceptable for a monitored, high-value table like `transactions`.

### 4.5 (Recommended for production) Rotate the password out of plaintext

`SecurePassword123!` above is illustrative only. In a real deployment, generate a strong random password and store it as a secret (see [Section 9.3](#93-secrets-management)) — never commit it to source control or leave it in a connector JSON file.

---

## 5. Step 2 — Deploy Kafka, Kafka Connect & Kafka UI (Docker)

The snippet below is the relevant excerpt of `docker-compose.yml` (Kafka in **KRaft mode** — no Zookeeper required):

```yaml
services:
  kafka:
    image: apache/kafka:latest
    container_name: kafka
    restart: unless-stopped
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,INTERNAL://0.0.0.0:29092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,INTERNAL://kafka:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,INTERNAL:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    networks:
      - fraud-network

  connect:
    image: debezium/connect:2.7.3.Final
    container_name: debezium
    restart: unless-stopped
    ports:
      - "8083:8083"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      BOOTSTRAP_SERVERS: kafka:29092
      GROUP_ID: "1"
      CONFIG_STORAGE_TOPIC: connect_configs
      OFFSET_STORAGE_TOPIC: connect_offsets
      STATUS_STORAGE_TOPIC: connect_statuses
      KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONFIG_STORAGE_REPLICATION_FACTOR: 1
      OFFSET_STORAGE_REPLICATION_FACTOR: 1
      STATUS_STORAGE_REPLICATION_FACTOR: 1
    depends_on:
      - kafka
    networks:
      - fraud-network

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    restart: unless-stopped
    depends_on:
      - kafka
      - connect
    ports:
      - "8090:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: fraud-radar-cluster
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_NAME: debezium-connect
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_ADDRESS: http://connect:8083

networks:
  fraud-network:
    driver: bridge

volumes:
  kafka_data:
```

Start the stack:

```bash
docker compose up -d
```

Confirm the Debezium plugin is loaded:

```bash
curl http://localhost:8083/connector-plugins
```

You should see `io.debezium.connector.postgresql.PostgresConnector` in the returned list.

Open **Kafka UI** at `http://localhost:8090` to inspect topics, messages, and connector status visually instead of using the REST API directly.

---

## 6. Step 3 — Register the Debezium Connector

Save the following as `register-postgres-connector.json`:

```json
{
  "name": "local-db-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "plugin.name": "pgoutput",
    "slot.name": "local_bot_fraud_slot",
    "publication.name": "local_bot_fraud_publication",
    "publication.autocreate.mode": "disabled",

    "database.hostname": "host.docker.internal",
    "database.port": "5432",
    "database.user": "debezium_user",
    "database.password": "${env:LOCAL_PG_PASSWORD}",
    "database.dbname": "fraud_db",

    "topic.prefix": "local_cdc",
    "table.include.list": "public.transactions",
    "snapshot.mode": "initial",

    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": "false",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",

    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "true",
    "transforms.unwrap.delete.handling.mode": "drop"
  }
}
```

> **Note:** `publication.autocreate.mode` is set to `disabled` here because the publication was already created manually in [Step 4.4](#44-create-a-dedicated-least-privilege-cdc-user) — this is intentional and avoids requiring the `debezium_user` to have `CREATE` privileges on the database, which is a stricter, bank-appropriate security posture.

Register the connector:

```bash
curl -X POST -H "Content-Type: application/json" \
  --data @register-postgres-connector.json \
  http://localhost:8083/connectors
```

---

## 7. Step 4 — Verification & Testing Workflow

### 7.1 Check connector status

```powershell
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status" | ConvertTo-Json -Depth 5
```

```bash
# Equivalent on Linux/macOS
curl -s http://localhost:8083/connectors/local-db-connector/status | jq
```

Expected output should show:

```json
{
  "connector": { "state": "RUNNING" },
  "tasks": [ { "state": "RUNNING" } ]
}
```

### 7.2 Confirm the replication slot is active

```sql
SELECT slot_name, active, restart_lsn
FROM pg_replication_slots
WHERE slot_name = 'local_bot_fraud_slot';
-- 'active' must be 't' (true)
```

### 7.3 Insert a test transaction and confirm the event arrives

```sql
INSERT INTO public.transactions (transaction_id, step, type, amount, "nameOrig", "oldbalanceOrg", "newbalanceOrig", "nameDest", "oldbalanceDest", "newbalanceDest")
VALUES ('TEST-0001', 1, 'TRANSFER', 5000.00, 'C1000', 10000.00, 5000.00, 'C2000', 0.00, 5000.00);
```

Then watch the topic directly:

```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic local_cdc.public.transactions \
  --from-beginning
```

You should see the event appear within a second or two of the INSERT — confirming the pipeline is live end-to-end.

### 7.4 Restart the connector after a configuration change

```powershell
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/restart" -Method Post -ContentType "application/json"
```

```bash
curl -X POST http://localhost:8083/connectors/local-db-connector/restart
```

---

## 8. Step 5 — Real-Time Python Consumer

Install dependencies:

```bash
pip install kafka-python psycopg2-binary pandas python-dotenv requests
```

Minimal consumer to confirm events are consumable from Python (extend this into your full fraud-scoring pipeline):

```python
import json
import os
from kafka import KafkaConsumer

BOOTSTRAP_SERVERS = "localhost:9092" if not os.path.exists("/.dockerenv") else "kafka:29092"

consumer = KafkaConsumer(
    "local_cdc.public.transactions",
    bootstrap_servers=BOOTSTRAP_SERVERS,
    auto_offset_reset="earliest",
    group_id="fraud-cdc-consumer",
    value_deserializer=lambda v: json.loads(v.decode("utf-8")) if v else None,
)

print(f"Listening for live transactions on {BOOTSTRAP_SERVERS} ...")

for message in consumer:
    transaction = message.value
    if transaction is None:
        continue
    print(f"New transaction received: {transaction}")
    # → forward `transaction` to your ML inference engine here
```

> Because the connector uses the `unwrap` (`ExtractNewRecordState`) transform, each Kafka message value is already the **flat row data** (no `before` / `after` envelope) — simplifying downstream parsing.

---

## 9. Step 6 — Security Hardening for Banking Environments

The steps above produce a **working** pipeline. For a **production deployment inside a bank or financial regulator**, the following controls should also be applied before go-live.

### 9.1 Encrypt data in transit

- **PostgreSQL ↔ Debezium:** enable `sslmode=require` (or `verify-full`) on the connector by adding `database.sslmode` to the connector config, and configure PostgreSQL to require SSL (`ssl = on` in `postgresql.conf`, valid certificates in place).
- **Kafka ↔ Clients:** enable `SASL_SSL` listeners instead of `PLAINTEXT` for any non-local deployment. `PLAINTEXT` (as used in the local dev setup above) is acceptable only on an isolated development machine, never on a shared or production network.

### 9.2 Authenticate and authorize Kafka Connect's REST API

By default, the Kafka Connect REST API (port `8083`) has **no authentication** — anyone who can reach it can register, modify, or delete connectors, or read connector configs (which may include credentials). In production:

- Put Kafka Connect behind a reverse proxy or API gateway enforcing authentication (mTLS or OAuth2).
- Restrict network access to `8083` to only the operations team's network segment.
- Enable Kafka Connect's built-in `BASIC` auth via `rest.extension.classes` if a gateway is not available.

### 9.3 Secrets Management

Never store database or Kafka credentials in plaintext connector JSON, `.env` files committed to Git, or Docker Compose files. Instead:

- Use Kafka Connect's `ConfigProvider` interface (e.g. `FileConfigProvider`, `EnvVarConfigProvider`, or a `VaultConfigProvider` for HashiCorp Vault) so secrets are injected at runtime and never persisted in the connector's stored configuration.
- Example using environment-variable injection (as already used in this guide's connector config: `"database.password": "${env:LOCAL_PG_PASSWORD}"`), enabled by adding to the `connect` service:

```yaml
environment:
  CONNECT_CONFIG_PROVIDERS: env
  CONNECT_CONFIG_PROVIDERS_ENV_CLASS: org.apache.kafka.common.config.provider.EnvVarConfigProvider
  LOCAL_PG_PASSWORD: ${LOCAL_PG_PASSWORD}
```

### 9.4 Principle of least privilege

- The `debezium_user` should have `SELECT` only on the specific tables it monitors — never on the whole schema, and never `INSERT`/`UPDATE`/`DELETE` privileges.
- Do not grant `CREATEDB` or `CREATEROLE` to the CDC user.
- Rotate the `debezium_user` password on a defined schedule and after any personnel change with access to it.

### 9.5 Network isolation

- Run PostgreSQL, Kafka, and Kafka Connect on an internal, firewalled network segment not reachable from the general corporate network or the internet.
- If PostgreSQL must remain outside Docker (as in this local setup), restrict `pg_hba.conf` to the **specific** container/host IP range — avoid `0.0.0.0/0`, which was shown earlier only for local development convenience and must never be used in production.

### 9.6 Audit logging

- Enable PostgreSQL's `log_connections`, `log_disconnections`, and `pgaudit` extension to capture all access by `debezium_user`.
- Retain Kafka Connect logs and connector status-change history for compliance review (many banking regulators require a minimum retention period, e.g. 5–7 years for transaction-adjacent audit trails — confirm the applicable requirement with your compliance team).

### 9.7 Data minimization / PII handling

- If `public.transactions` contains personally identifiable information (PII) beyond what the ML model needs, consider a Debezium **column exclude list** (`column.exclude.list`) or a downstream masking transform so PII is not unnecessarily replicated into Kafka topics.

---

## 10. Step 7 — Monitoring, Maintenance & Failure Recovery

### 10.1 Watch replication slot growth

An inactive or lagging replication slot causes PostgreSQL to **retain WAL indefinitely**, which can exhaust disk space:

```sql
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;
```

If `retained_wal` grows continuously, the connector is not consuming fast enough, is stopped, or was deleted without dropping its slot. Set up an alert (e.g. via Prometheus + `postgres_exporter`) if retained WAL exceeds a safe threshold (e.g. 5 GB).

### 10.2 Drop orphaned slots

If a connector is permanently removed, always drop its replication slot manually — Debezium does not do this automatically:

```sql
SELECT pg_drop_replication_slot('local_bot_fraud_slot');
```

### 10.3 Connector task failure

Kafka Connect surfaces failed tasks via the status endpoint. Automate a health check that polls `/connectors/{name}/status` and alerts if `state` is `FAILED`, then use the restart endpoint from [Section 7.4](#74-restart-the-connector-after-a-configuration-change).

### 10.4 Kafka topic retention

By default, Kafka retains messages for 7 days. For a fraud-detection topic feeding a real-time consumer, this is normally sufficient buffer for planned downtime — but confirm `log.retention.hours` matches your operational recovery-time expectations.

---

## 11. Troubleshooting Reference

| Symptom | Likely Cause | Resolution |
|---|---|---|
| Connector fails with `FATAL: no pg_hba.conf entry` | Docker network not permitted in `pg_hba.conf` | Add the correct entry (Section 4.2) and restart PostgreSQL |
| Connector fails with `wal_level must be logical` | `postgresql.conf` still set to `replica` | Update and **restart** (not reload) PostgreSQL |
| Connector `RUNNING` but no events reach Kafka | No new writes since connector started, or `table.include.list` mismatched | Insert a test row (Section 7.3) to confirm |
| `host.docker.internal` unreachable | Not using Docker Desktop (plain Linux Docker Engine) | Use the host's LAN IP instead, or add `extra_hosts` with `host-gateway` (already included) |
| Replication slot growing indefinitely | Connector stopped/removed without dropping the slot | Drop the slot manually (Section 10.2) |
| `permission denied for table transactions` | CDC user missing `SELECT` grant | Re-run the `GRANT SELECT` statement from Section 4.4 |
| Connector REST API reachable by unauthorized users | No auth on port 8083 | Apply Section 9.2 before any non-local deployment |

---

*This guide describes a local/development-equivalent configuration suitable for building and testing the pipeline end-to-end. Section 9 must be fully implemented before this architecture is connected to any live, non-test financial data.*
