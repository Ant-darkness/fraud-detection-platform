from fastapi import APIRouter, Depends
from backend.app.core.dependencies import get_current_officer
from backend.app.services.metric_service import get_metrics, get_leaderboard

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/leaderboard")
def leaderboard(officer=Depends(get_current_officer)):
    return get_leaderboard()


@router.get("/{model_id}")
def metrics(model_id: int, officer=Depends(get_current_officer)):
    return get_metrics(model_id)
