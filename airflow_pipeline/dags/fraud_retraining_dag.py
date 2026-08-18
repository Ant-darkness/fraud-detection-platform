import os
from datetime import datetime, timedelta

from airflow import DAG
from docker.types import Mount
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.docker.operators.docker import DockerOperator  # type: ignore

# Callbacks za kuwasiliana na backend notification-service
from utils.airflow_callbacks import on_airflow_task_failure, on_airflow_dag_success


default_args = {
    "owner": "BoT",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    # Inatuma email kiotomatiki kupitia Backend pale task yoyote inapofeli
    "on_failure_callback": on_airflow_task_failure,
}

tags = ["fraud", "ml", "production"]

PROJECT_ROOT_PATH = os.getenv(
    "HOST_PROJECT_PATH", "C:/Users/Abely/Desktop/fraud-detection-platform"
)


with DAG(
    dag_id="fraud_retraining_pipeline",
    description="Production Fraud Model Retraining Pipeline",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    default_args=default_args,
    max_active_runs=1,
    max_consecutive_failed_dag_runs=3,
    tags=tags,
    is_paused_upon_creation=False,
    # Inatuma email ya mafanikio mara baada ya task zote kukamilika salama
    on_success_callback=on_airflow_dag_success,
) as dag:

    # TASK 1: EXTRACT DATA
    extract_training_data = BashOperator(
        task_id="extract_reviewed_data",
        cwd="/opt/airflow",
        bash_command="python backend/ml/extract_training_data.py",
        execution_timeout=timedelta(minutes=30),
    )

    # TASK 2: MODEL TRAINING (Inakimbia ndani ya Docker Container)
    train_model = DockerOperator(
        task_id="train_model",
        image="fraud-training:latest",
        force_pull=False,
        command="python ml/training/train_final_model.py",
        environment={
            "PYTHONPATH": "/opt/airflow",
            "DB_HOST": "fraud-postgres",
            "DB_PORT": "5432",
            "DB_NAME": "FraudDB",
            "DB_USER": "postgres",
            "DB_PASSWORD": "Fraud@2026",
        },
        auto_remove="success",
        network_mode="fraud-detection-platform_fraud-network",
        mount_tmp_dir=False,
        mounts=[
            Mount(
                source=PROJECT_ROOT_PATH,
                target="/opt/airflow",
                type="bind",
            )
        ],
        working_dir="/opt/airflow",
        xcom_all=False,
    )

    # TASK 3: MODEL VALIDATION
    validate_model = BashOperator(
        task_id="validate_model",
        cwd="/opt/airflow",
        bash_command="PYTHONPATH=/opt/airflow python ml/training/validate_model.py",
        execution_timeout=timedelta(minutes=30),
    )

    # TASK 4: MODEL ACTIVATION
    activate_model = BashOperator(
        task_id="activate_model",
        cwd="/opt/airflow",
        bash_command="PYTHONPATH=/opt/airflow python ml/training/activate_model.py",
        execution_timeout=timedelta(minutes=10),
    )

    # TASK 5: API (FastAPI) RELOADING
    reload_api = BashOperator(
        task_id="reload_api_model",
        cwd="/opt/airflow",
        bash_command="PYTHONPATH=/opt/airflow python backend/app/services/reload_api.py",
        execution_timeout=timedelta(minutes=5),
    )

    # TASKS FLOW
    (
        extract_training_data
        >> train_model
        >> validate_model
        >> activate_model
        >> reload_api
    )
