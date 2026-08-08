from fastapi import APIRouter, Query
from typing import Optional

from backend.app.services.dashboard_service import (
    dashboard_summary,
    get_dashboard_analytics,
    get_volume_comparison_data,
    generate_plotly_volume_chart
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def summary():
    return dashboard_summary()


@router.get("/analytics")
def analytics(
    timeframe: str = Query("24hrs"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    return get_dashboard_analytics(timeframe=timeframe, start_date=start_date, end_date=end_date)


@router.get("/volume-comparison")
def volume_comparison(
    timeframe: str = Query("24hrs"),
    custom_start: Optional[str] = Query(None),
    custom_end: Optional[str] = Query(None)
):
    return get_volume_comparison_data(timeframe=timeframe, start_date=custom_start, end_date=custom_end)
