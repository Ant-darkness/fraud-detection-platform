FIX 
`docker exec airflow-scheduler airflow dags reserialize`

RUN DAG
`docker exec airflow-scheduler airflow dags trigger fraud_retraining_pipeline`

`docker exec airflow-scheduler airflow config get-value core execution_api_server_url`

`docker exec airflow-scheduler airflow config list | findstr execution_api`

`docker exec airflow-scheduler bash -c "airflow config list | grep execution_api"`


TESTING

 1. Verify if the status has shifted from "starting" to "healthy"
`docker inspect --format='{{json .State.Health.Status}}' airflow-api-server`

 2. Check the Scheduler logs to ensure tasks are executing instead of dropping
`docker logs airflow-scheduler --tail 20`

