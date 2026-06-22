from airflow import DAG
from airflow.operators.bash import BashOperator # type: ignore

from datetime import datetime


with DAG(
    dag_id="fraud_model_retraining",
    start_date=datetime(2026, 1, 1),
    schedule="@weekly",
    catchup=False,
) as dag:

    check_data = BashOperator(
        task_id="check_data",
        bash_command="""
        cd /opt/project &&
        python -m ml.training.check_data
        """
    )

    retrain_model = BashOperator(
        task_id="retrain_model",
        bash_command="""
        cd /opt/project &&
        python -m ml.training.retrain_model
        """
    )

    check_data >> retrain_model
