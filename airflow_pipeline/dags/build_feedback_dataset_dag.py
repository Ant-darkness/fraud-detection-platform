from datetime import datetime
from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.standard.operators.python import PythonOperator

default_args = {
    "owner": "BoT",
    "retries": 1,
    "catchup": False
}
with DAG(
    dag_id="build_feedback_dataset",
    default_args=default_args,
    start_date=datetime(2026, 1, 1),
    schedule="@weekly",
    catchup=False,
    is_paused_upon_creation=False
) as dag:
    
    extract_feedback = BashOperator(
        task_id="extract_feedback",
        bash_command="""
        cd /opt/airflow &&
        python backend/ml/extract_training_data.py"""
        
    )
    

