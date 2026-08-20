CREATE TADABASE SQLSERVER
```docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Fraud@2026" -C```

ENTER KAFKA BASH
`docker exec -it kafka bash`

TEST IF KAFKA PRODUCER USES TOPICS
```kafka-console-consumer --topic transactions --from-beginning --bootstrap-server localhost:9092```

PRODUCER 
`docker exec -it kafka kafka-console-producer  --bootstrap-server localhost:9092 --topic transactions`

TEST IF PRODUCER USES TOPIC
`kafka-console-consumer --topic transactions --from-beginning --bootstrap-server localhost:9092`

CONSUMER
` docker exec -it kafka kafka-console-consumer  --bootstrap-server localhost:9092 --topic transactions --from-beginning`

CREATE TOPIC
`docker exec -it kafka kafka-topics --create --topic transactions --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1`

CHECK TOPICS
`docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092`

DELETE TOPIC
`docker exec -it kafka kafka-topics --delete --topic transactions --bootstrap-server localhost:9092`

ENTER SQL SERVER DATABASE BASH
`docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Fraud@2026" -C`

ENTER POSTGRESQL DATABASE BASH
`docker exec -it fraud-postgres psql -U postgres -d FraudDB`

TO CHECK LOGS
`docker logs sqlserver(container) --tail 50`

TO CHECK IF TOPIC HAS A DATA
`docker exec -it kafka kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic transactions`

TO BUILD CONTAINER
`docker compose build fraud-api`

CHECK VOLUME
`docker volume ls`

DELETE VOLUME
`docker volume rm fraud-detection-platform_sqlserver_data`

TO GET PASSWORD AND USERNAME FOR AIRFLOW LOGIN WEB
`docker logs airflow-webserver --tail 50`
OR
`docker compose exec airflow-webserver cat /opt/airflow/simple_auth_manager__passwords.json`

TEST DAG IN TERMINAL
`docker exec -it airflow-webserver bash`
THEN(Huu n mfano asee)
`python -c "from ml.training.train_final_model import main"`

TO CHECK THE CREATED DAGS
`docker exec -it airflow-webserver airflow dags reserialize`
        THEN
`docker exec -it airflow-webserver airflow dags list`



DEBUG DAGS
`docker exec -it airflow-scheduler airflow dags list`
`docker exec -it airflow-scheduler airflow dags list-import-errors`

ANSWERS_ERROR Dags does'nt run return NO DATA FOUND

`docker exec -it airflow-scheduler bash`
THEN
`airflow config get-value core dags_folder`
ALSO
`echo $AIRFLOW_HOME`
ALSO
`ls -la /opt/airflow/dags`
ALSO
`cat /opt/airflow/airflow.cfg | grep dags_folder`
ALSO
RUN YOUR DAGS HERE
`python /opt/airflow/dags/build_feedback_dataset_dag.py`
`python /opt/airflow/dags/fraud_retraining_dag.py`
IF THERE IS ERROR then run
`airflow dags reserialize`
THEN
`airflow dags list`
IF RETURN no data found
THEN
`airflow db check`
ALSO
`airflow jobs check --job-type SchedulerJob`


TO VERIFY IF FILE IS PRESENT ON CONTAINER
`docker exec -it fraud-api ls -R /app/ml/models`


CLEAR FAILED TASK
`docker exec airflow-scheduler airflow tasks clear fraud_retraining_pipeline train_model --start-date 2026-07-12`


UNPAUSE DAG
`docker exec airflow-scheduler airflow dags unpause fraud_retraining_pipeline`


VERY SENSITIVE
# Development
`docker-compose up -d`

# Production (baada ya kubadilisha .env au kutumia .env.prod)
`cp .env.prod .env`
`docker-compose up -d`









