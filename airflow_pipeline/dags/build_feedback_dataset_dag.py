from datetime import datetime
from airflow import DAG
from airflow.operators.bash import BashOperator # type: ignore


with DAG(
    dag_id="build_feedback_dataset",
    start_date=datetime(2025, 1, 1),
    schedule="@weekly",
    catchup=False
) as dag:
    
    task = BashOperator(
        task_id="extract_feedback",
        bash_command="""
        cd /opt/airflow &&
        python backend/ml/extract_training_data.py"""
        
    )
    
    task
