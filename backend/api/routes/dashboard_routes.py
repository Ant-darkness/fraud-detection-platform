from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.dashboard_service import (
    dashboard_summary, get_advanced_analytics, get_volume_comparison,
    recent_predictions, fraud_trend, officer_stats
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def summary():
    return dashboard_summary()

@router.get("/analytics")
def analytics(
    timeframe: str = Query("7days", regex="^(24hrs|7days|4weeks|1year)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    return get_advanced_analytics(timeframe, start_date, end_date)

@router.get("/volume-comparison")
def comparison():
    return get_volume_comparison()

@router.get("/recent-predictions")
def recent():
    return recent_predictions()

@router.get("/fraud-trend")
def trend():
    return fraud_trend()

@router.get("/officers")
def officers():
    return officer_stats()
