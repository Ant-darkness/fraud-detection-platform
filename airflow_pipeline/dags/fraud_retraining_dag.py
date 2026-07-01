from datetime import datetime

from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.standard.operators.python import PythonOperator, BranchPythonOperator
from airflow.providers.standard.operators.empty import EmptyOperator

from ml.training.validate_model import main as validate_model
from ml.training.activate_model import main as activate_model
from backend.app.services.reload_api import main as reload_api


default_args = {
    "owner": "BoT",
    "retries": 1
}


def validate_and_decide():

    is_valid = validate_model()

    if is_valid:
        return "activate_model"
    return "skip_activation"


with DAG(
    dag_id="fraud_retraining_pipeline",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    default_args=default_args,
    tags=["fraud", "ml"],
    is_paused_upon_creation=False   # 🔥 IMPORTANT
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


    branch_task = BranchPythonOperator(
        task_id="decide_activation",
        python_callable=validate_and_decide
    )


    activate_task = PythonOperator(
        task_id="activate_model",
        python_callable=activate_model
    )


    skip_task = EmptyOperator(
        task_id="skip_activation"
    )


    reload_task = PythonOperator(
        task_id="reload_api_model",
        python_callable=reload_api
    )


    extract_task >> train_task >> validate_task >> branch_task

    branch_task >> activate_task >> reload_task
    branch_task >> skip_task
