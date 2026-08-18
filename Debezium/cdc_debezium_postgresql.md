# 🛡️ Real-Time Payment Oversight & Fraud Detection System
### *Bank of Tanzania Architecture - Machine Learning & CDC Pipeline*

---

## 📌 1. Executive Summary & Context
Mfumo huu umeundwa maalum kwa ajili ya usimamizi na ufuatiliaji wa miamala ya kifedha kwa wakati halisi (**Real-Time Payment Oversight**). Unatumia usanifu wa Change Data Capture (CDC) kupitia PostgreSQL, Debezium, na Apache Kafka kusoma kila muamala unapoingizwa database na kuupeleka moja kwa moja kwenye Machine Learning Inference Engine bila kusababisha latency yoyote kwenye mfumo mkuu wa benki.

---

## 🏗️ 2. System Architecture

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │   PostgreSQL    │       │    Debezium     │
│   DB Generator  │ ────> │   (fraud_db)    │ ────> │    Connector    │
│  (Faker Script) │       │  [WAL Enabled]  │       │  (pgoutput plugin)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   ML Fraud      │       │  Kafka Consumer │       │   Apache Kafka  │
│ Prediction Model│ <──── │  (Real-Time)    │ <──── │    Broker       │
│ (XGBoost/RF)    │       │  (test_consumer)│       │ (local_cdc topic)│
└─────────────────┘       └─────────────────┘       └─────────────────┘

---
## 3. Database Security & Engine Setup
** A. Core Postgres Configuration (postgresql.conf)
Ili Postgres iweze kutoa mabadiliko ya data kwa njia ya streaming (CDC), vigezo vifuatvyo lazima viwekwe;

`wal_level = logical
max_wal_senders = 10
max_replication_slots = 10`

** B. Enterprise Security & Database Permissions (SQL Script)
kwa mujibu wa viwango vya usalama wa mifumo ya kifedh, Debezium haitakiwi kutumia Superuser (postgres). Mfumo unatengeneza dedicated user mwenye haki za replication pekee:

`-- 1. Create Dedicated Service User for CDC
CREATE USER debezium_user WITH PASSWORD 'SecurePassword123!';

-- 2. Grant Replication Capabilities
ALTER USER debezium_user REPLICATION;

-- 3. Grant Database Access Permissions
GRANT CONNECT ON DATABASE fraud_db TO debezium_user;
GRANT USAGE ON SCHEMA public TO debezium_user;
GRANT SELECT ON public.transactions TO debezium_user;

-- 4. Enable Full Replica Identity (Required for Debezium State Capture)
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- 5. Create Publication Channel Manually
CREATE PUBLICATION local_bot_fraud_publication FOR TABLE public.transactions;`

## 4. Debezium Connector Definition
Configuration payload inayotakiwa kutumwa kwa njia ya POST kwenda http://localhost:8083/connectors:

`json
{
  "name": "local-db-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "plugin.name": "pgoutput",
    "slot.name": "local_bot_fraud_slot",
    "publication.name": "local_bot_fraud_publication",

    "database.hostname": "host.docker.internal",
    "database.port": "5432",
    "database.user": "debezium_user",
    "database.password": "SecurePassword123!",
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
`

# 5. verification & Testing Workflow
Step1: Health Check Connector Status

`powershell
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status" | ConvertTo-Json -Depth 5
`
Step 2: Restart Connector if Configuration Changes

`powershell
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/restart" -Method Post -ContentType "application/json"
`



