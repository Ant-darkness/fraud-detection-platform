import os
import logging
import requests
from datetime import datetime

logger = logging.getLogger("airflow.task")

# Backend API Configuration
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://fraud-api:8000")
ALERT_EMAIL_RECIPIENT = os.getenv(
    "AIRFLOW_ALERT_EMAIL")


def _get_execution_date(context: dict) -> str:
    """Inapata execution date salama kwa Airflow 2.x na 3.x"""
    exec_date = context.get('logical_date') or context.get('execution_date')
    if isinstance(exec_date, datetime):
        return exec_date.isoformat()
    return str(exec_date or datetime.utcnow().isoformat())


def on_airflow_task_failure(context: dict):
    """
    Inaitwa moja kwa moja na Airflow pale Task yoyote inapofeli.
    Inatuma taarifa za kosa kwenda Notification Service.
    """
    ti = context.get('task_instance')
    dag_id = ti.dag_id if ti else context.get('dag', {}).dag_id
    task_id = ti.task_id if ti else 'UNKNOWN_TASK'
    log_url = getattr(ti, 'log_url', '')
    try_number = getattr(ti, 'try_number', 1)

    exception = str(context.get('exception', 'Unknown Exception / Timeout'))
    execution_date = _get_execution_date(context)

    payload = {
        "email": ALERT_EMAIL_RECIPIENT,
        "dag_id": dag_id,
        "task_id": task_id,
        "status": "FAILED",
        "log_url": log_url,
        "error_msg": exception,
        "try_number": try_number,
        "execution_date": execution_date,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        endpoint = f"{BACKEND_API_URL}/api/v1/notifications/airflow-alert"
        response = requests.post(endpoint, json=payload, timeout=10)

        if response.status_code == 200:
            logger.info(
                f"✅ Failure Alert delivered via Notification Service for Task [{task_id}] in DAG [{dag_id}]")
        else:
            logger.error(
                f"❌ Failed to deliver Failure Alert (HTTP {response.status_code}): {response.text}")
    except Exception as e:
        logger.error(
            f"❌ Error communicating with Notification Service at {BACKEND_API_URL}: {e}")


def on_airflow_dag_success(context: dict):
    """
    Inaitwa mara baada ya DAG yote kukamilika salama.
    """
    dag_run = context.get('dag_run')
    dag_id = dag_run.dag_id if dag_run else 'UNKNOWN_DAG'
    execution_date = _get_execution_date(context)

    # Base URL ya Airflow Dashboard (Inachukua kutoka ENV ikitokea ipo, au inapiga localhost)
    airflow_base_url = os.getenv("AIRFLOW_UI_URL", "http://localhost:8080")
    log_url = f"{airflow_base_url}/dags/{dag_id}/grid"

    payload = {
        "email": ALERT_EMAIL_RECIPIENT,
        "dag_id": dag_id,
        "task_id": "ALL_TASKS_COMPLETED",
        "status": "SUCCESS",
        "log_url": log_url,
        "error_msg": None,
        "execution_date": execution_date,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        endpoint = f"{BACKEND_API_URL}/api/v1/notifications/airflow-alert"
        response = requests.post(endpoint, json=payload, timeout=10)

        if response.status_code == 200:
            logger.info(
                f"🏆 Success Alert delivered via Notification Service for DAG [{dag_id}]")
        else:
            logger.warning(
                f"⚠️ Notification Service responded with status {response.status_code} for DAG [{dag_id}]")
    except Exception as e:
        logger.error(
            f"❌ Error communicating with Notification Service at {BACKEND_API_URL}: {e}")
