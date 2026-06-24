from fastapi import APIRouter

from backend.app.services.dashboard_service import *

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def summary():

    return dashboard_summary()


@router.get("/recent-predictions")
def recent():

    return recent_predictions()


@router.get("/fraud-trend")
def trend():

    return fraud_trend()


@router.get("/officers")
def officers():

    return officer_stats()
