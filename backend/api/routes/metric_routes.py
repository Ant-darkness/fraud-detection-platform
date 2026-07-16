from fastapi import APIRouter
from backend.app.services.metric_service import get_metrics, get_leaderboard

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/leaderboard")
def leaderboard():
    return get_leaderboard()

@router.get("/{model_id}")
def metrics(model_id: int):
    return get_metrics(model_id)


