FIX 
`docker exec airflow-scheduler airflow dags reserialize`

RUN DAG
`docker exec airflow-scheduler airflow dags trigger fraud_retraining_pipeline`

`docker exec airflow-scheduler airflow config get-value core execution_api_server_url`

`docker exec airflow-scheduler airflow config list | findstr execution_api`

`docker exec airflow-scheduler bash -c "airflow config list | grep execution_api"`
