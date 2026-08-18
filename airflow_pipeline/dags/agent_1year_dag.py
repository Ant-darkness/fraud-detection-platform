import os
import requests
from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator
from utils.airflow_callbacks import on_airflow_task_failure, on_airflow_dag_success

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://fraud-api:8000")

default_args = {
    "owner": "BoT",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
    "on_failure_callback": on_airflow_task_failure,
}


def trigger_analytics(agent_type: str, timeframe: str):
    endpoint = f"{BACKEND_API_URL}/api/v1/agents/{agent_type}-analytics"
    params = {"timeframe": timeframe, "language": "sw"}
    response = requests.get(endpoint, params=params, timeout=120)
    response.raise_for_status()


with DAG(
    dag_id="agentic_analytics_1year",
    description="Inachanganua data za mwaka 1 uliopita (tarehe 1 ya mwezi saa 00:00)",
    start_date=datetime(2026, 1, 1),
    schedule="0 0 1 * *",
    catchup=False,
    default_args=default_args,
    on_success_callback=on_airflow_dag_success,
    tags=["bot", "agents", "1year"],
) as dag:

    task_vol_1y = PythonOperator(
        task_id="volume_1year",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "volume", "timeframe": "1YEAR"},
    )

    task_fraud_1y = PythonOperator(
        task_id="fraud_1year",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "fraud", "timeframe": "1YEAR"},
    )

    [task_vol_1y, task_fraud_1y]
