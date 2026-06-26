from datetime import datetime
from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.standard.operators.python import PythonOperator
from ml.training.validate_model import main as validate_model
from ml.training.activate_model import main as activate_model
from backend.app.services.reload_api import main as reload_api



default_args = {
    "owner": "BoT",
    "retries": 1,
    "catchup": False
}

with DAG(
    dag_id="fraud_retraining_pipeline",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    default_args=default_args,
    is_paused_upon_creation=False,
    tags=["fraud", "ml"]
) as dag:

    extract_task = BashOperator(
        task_id="extract_reviewed_data",
        bash_command="""
        cd /opt/airflow &&
        python backend/ml/extract_training_data.py
        """
    )

    train_task = BashOperator(
        task_id="train_new_model",
        bash_command="""
        cd /opt/airflow &&
        python ml/training/train_final_model.py
        """
    )
    
    validate_task = PythonOperator(
        task_id="validate_model",
        python_callable=validate_model
    )
    
    activate_task = PythonOperator(
        task_id="activate_model",
        python_callable=activate_model
    )
    
    reload_task = PythonOperator(
        task_id="reload_api_model",
        python_callable=reload_api
    )

    extract_task >> train_task
    validate_task >> activate_task >> reload_task
