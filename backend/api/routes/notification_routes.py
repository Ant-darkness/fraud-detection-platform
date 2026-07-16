from fastapi import APIRouter
from backend.app.services.notification_service import notify_officers

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/{transaction_id}")
def notify(transaction_id: int, probability: float = 0.8):
    notify_officers(transaction_id, probability)
    return {"message": "Notification sent"}
