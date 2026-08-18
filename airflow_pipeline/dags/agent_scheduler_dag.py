import os
import requests
from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator
from utils.airflow_callbacks import on_airflow_task_failure


BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://fraud-api:8000")

default_args = {
    "owner": "BoT",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
    "on_failure_callback": on_airflow_task_failure,
}


def trigger_analytics(agent_type: str, timeframe: str):
    """Inaagiza API Gateway kuvuta analytics na kutupa push notification kwenye WebSocket"""
    endpoint = f"{BACKEND_API_URL}/api/v1/agents/{agent_type}-analytics"
    params = {"timeframe": timeframe, "language": "sw"}
    response = requests.get(endpoint, params=params, timeout=60)
    response.raise_for_status()


# ==============================================================================
# 1. DAG YA SAA 24 (Inakimbia Kila Saa - Hourly)
# ==============================================================================
with DAG(
    dag_id="agentic_analytics_24hrs",
    description="Inachanganua data za masaa 24 yaliyopita (kila saa)",
    start_date=datetime(2026, 1, 1),
    schedule="0 * * * *",  # Kila saa
    catchup=False,
    default_args=default_args,
    tags=["bot", "agents", "24hrs"],
) as dag_24h:

    task_vol_24h = PythonOperator(
        task_id="volume_24h",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "volume", "timeframe": "24HRS"},
    )

    task_fraud_24h = PythonOperator(
        task_id="fraud_24h",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "fraud", "timeframe": "24HRS"},
    )

    # Zinafanya kazi kwa pamoja au mfuatano ndani ya DAG hii pekee
    [task_vol_24h, task_fraud_24h]


# ==============================================================================
# 2. DAG YA SIKU 7 (Inakimbia Mara 1 kwa Siku - Daily at Midnight)
# ==============================================================================
with DAG(
    dag_id="agentic_analytics_7days",
    description="Inachanganua data za siku 7 zilizopita (kila siku saa 12 asubuhi/midnight)",
    start_date=datetime(2026, 1, 1),
    schedule="0 0 * * *",  # Kila siku saa 00:00
    catchup=False,
    default_args=default_args,
    tags=["bot", "agents", "7days"],
) as dag_7d:

    task_vol_7d = PythonOperator(
        task_id="volume_7d",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "volume", "timeframe": "7DAYS"},
    )

    task_fraud_7d = PythonOperator(
        task_id="fraud_7d",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "fraud", "timeframe": "7DAYS"},
    )

    [task_vol_7d, task_fraud_7d]


# ==============================================================================
# 3. DAG YA WIKI 4 (Inakimbia Mara 1 kwa Wiki - Weekly on Sunday Midnight)
# ==============================================================================
with DAG(
    dag_id="agentic_analytics_4weeks",
    description="Inachanganua data za wiki 4 zilizopita (kila Jumapili usiku)",
    start_date=datetime(2026, 1, 1),
    schedule="0 0 * * 0",  # Kila Jumapili saa 00:00
    catchup=False,
    default_args=default_args,
    tags=["bot", "agents", "4weeks"],
) as dag_4w:

    task_vol_4w = PythonOperator(
        task_id="volume_4weeks",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "volume", "timeframe": "4WEEKS"},
    )

    task_fraud_4w = PythonOperator(
        task_id="fraud_4weeks",
        python_callable=trigger_analytics,
        op_kwargs={"agent_type": "fraud", "timeframe": "4WEEKS"},
    )

    [task_vol_4w, task_fraud_4w]


# ==============================================================================
# 4. DAG YA MWAKA 1 (Inakimbia Mara 1 kwa Mwezi - Monthly on 1st Day)
# ==============================================================================
with DAG(
    dag_id="agentic_analytics_1year",
    description="Inachanganua data za mwaka 1 uliopita (tarehe 1 ya kila mwezi)",
    start_date=datetime(2026, 1, 1),
    schedule="0 0 1 * *",  # Tarehe 1 ya kila mwezi saa 00:00
    catchup=False,
    default_args=default_args,
    tags=["bot", "agents", "1year"],
) as dag_1y:

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
