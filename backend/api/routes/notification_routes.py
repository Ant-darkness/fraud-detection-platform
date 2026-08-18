from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.app.services.notification_service import (
    notify_officers,
    send_airflow_alert_email
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# Schema ya kupokea taarifa kutoka Airflow Callbacks
class AirflowAlertPayload(BaseModel):
    email: EmailStr
    dag_id: str
    task_id: str
    status: str
    log_url: str
    error_msg: Optional[str] = None


@router.post("/fraud-alert/{transaction_id}")
def notify(transaction_id: str, background_tasks: BackgroundTasks, probability: float = 0.8):
    """
    Inatuma taarifa ya dharura ya Fraud kwa Maofisa nyuma ya pazia (Background Task).
    """
    # Tunaituma kama BackgroundTask ili API isikwame kusubiri SMTP
    background_tasks.add_task(notify_officers, transaction_id, probability)

    return {
        "status": "success",
        "message": f"Notification process initiated for Transaction {transaction_id}",
        "risk_score": probability
    }


@router.post("/airflow-alert")
async def trigger_airflow_alert(payload: AirflowAlertPayload, background_tasks: BackgroundTasks):
    """
    Endpoint inayopokea taarifa ya utekelezaji wa Airflow DAG/Task
    na kutuma Email kupitia send_airflow_alert_email.
    """
    background_tasks.add_task(
        send_airflow_alert_email,
        email=payload.email,
        dag_id=payload.dag_id,
        task_id=payload.task_id,
        status=payload.status,
        log_url=payload.log_url,
        error_msg=payload.error_msg
    )
    return {"status": "success", "message": "Airflow alert queued successfully"}
