RUN DOCKER
`docker compose up -d`

CHECK STATUS OF CONTAINER
`docker ps`

RUN CONSUMER_FOR STORING TRANSACTIONS(terminal-1)
`python kafka_pipeline/consumer/sql_consumer.py`
or
`python -m kafka_pipeline.consumer.sql_consumer`

RUN COSNUMER FOR PREDICTION(terminal-2)
`python kafka_pipeline/consumer/realtime_scoring_consumer.py`
or
`python -m kafka_pipeline.consumer.realtime_scoring_consumer`

RUN PRODUCER FOR LOADING DATA(terminal-3)
`python kafka_pipeline/producer/transaction_producer.py`
or
`python -m kafka_pipeline.producer.transaction_producer`

VERIFY PostgreSQL(if database is binded with airflow container)
`docker exec -it airflow-postgres psql -U airflow`

VERIFY PostgreSQL (if database has separate container from airflow)
`docker exec -it <postgres_container_name> psql -U postgres`
then
`\c FraudDB`
then
`SELECT COUNT(*) FROM transactions;`

`SELECT COUNT(*) FROM fraud_predictions;`

`SELECT COUNT(*) FROM fraud_review_queue;`

OPEN API AND TEST
`http://localhost:8000/docs`

AIRFLOW 
`http://localhost:8080`

RUN DAG FOR CREATING DATASET FOR RETRAINING MODEL
`build_feedback_dataset` 

RUN RETRAINING DAG
`fraud_retraining_pipeline` IT WILL DO
``` Extract
     ↓
    Train
     ↓
    Register
     ↓
    Activate
     ↓
    Reload```

VERIFY NEW MODEL
```PostgreSQL
SELECT
model_version,
is_active
FROM model_registry
ORDER BY model_version DESC;```

results Must be
```v1   FALSE
v2   TRUE```


SUMMARY 
```
Terminal 1
`docker compose up -d`

Terminal 2
`uvicorn backend.api.main:app --reload`

Terminal 3
`python kafka_pipeline/consumer/sql_consumer.py`

Terminal 4
`python kafka_pipeline/consumer/realtime_scoring_consumer.py`

Terminal 5
`python kafka_pipeline/producer/transaction_producer.py`


FOR DEPLOYMENT
`environment:  HOST_PROJECT_PATH=/var/www/fraud-detection-platform`

# Hata ukiacha hivi, Python itaona ile variable ya server ya "/var/www/..." 
# na itapuuza hii ya Windows kwa sababu 'os.getenv' inapata jibu!
PROJECT_ROOT_PATH = os.getenv("HOST_PROJECT_PATH", "C:/Users/Abely/Desktop/fraud-detection-platform")

`RUN SCRIPT WITHIN CONTAINER`
docker compose run --rm ml-training python -m ml.training.train_final_model

`INITIALIZE DEBEZIUM`
Invoke-RestMethod -Uri "http://localhost:8083/connectors" -Method Post -ContentType "application/json" -InFile "debezium-local-postgres.json"

Invoke-RestMethod -Uri "<http://localhost:8083/connectors>" -Method Post -ContentType "application/json" -InFile ".\debezium-local-postgres.json"

`CONNECTOR HEALTHY TEST`
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status"

Invoke-RestMethod -Uri "<http://localhost:8083/connectors/local-db-connector/status>" | ConvertTo-Json -Depth 5

`TO DEBUG WHY TASK FAILED`
(Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status").tasks[0].trace

`DELETE FAILED CONNECTOR`
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector" -Method Delete

`TO ACTIVATE CONNECTOR`
Invoke-RestMethod -Uri "http://localhost:8083/connectors"


`CHECK DEBEZIUM HEALTH`
curl http://localhost:8083/

`LIST CONFIGURED CONNECTORS`
curl http://localhost:8083/connectors

`KAFKA TOPIC CHECK`
docker exec -it debezium /kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --list

`TASK STUST`
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status" | ConvertTo-Json -Depth 5

`RESTART CONNECTOR`
Invoke-RestMethod -Uri "http://localhost:8083/connectors/local-db-connector/status" | ConvertTo-Json -Depth 5

`CHECK KAFKA VERSION`
`docker exec -it kafka /opt/kafka/bin/kafka-topics.sh --version
`

