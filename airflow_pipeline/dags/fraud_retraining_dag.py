from datetime import datetime, timedelta

from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator


default_args = {
    "owner": "BoT",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

tags=[
        "fraud",
        "ml",
        "production"
    ]

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
    is_paused_upon_creation=False
) as dag:

    extract_training_data = BashOperator(

        task_id="extract_reviewed_data",
        cwd="/opt/airflow",
        bash_command="""python backend/ml/extract_training_data.py""",
        execution_timeout=timedelta(minutes=30)
    )


    train_model = BashOperator(

        task_id="train_new_model",
        cwd="/opt/airflow",
        bash_command=""" python ml/training/train_final_model.py""",
        execution_timeout=timedelta(hours=2)

    )


    validate_model = BashOperator(

        task_id="validate_model",
        cwd="/opt/airflow",
        bash_command="""python ml/training/validate_model.py""",
        execution_timeout=timedelta(minutes=30)
    )


    activate_model = BashOperator(

        task_id="activate_model",
        cwd="/opt/airflow",
        bash_command="""python ml/training/activate_model.py""",
        execution_timeout=timedelta(minutes=10)
    )


    reload_api = BashOperator(

        task_id="reload_api_model",
        cwd="/opt/airflow",
        bash_command="""python backend/app/services/reload_api.py      """,
        execution_timeout=timedelta(minutes=5)
    )


    (
        extract_training_data
        >>
        train_model
        >>
        validate_model
        >>
        activate_model
        >>
        reload_api
    )
