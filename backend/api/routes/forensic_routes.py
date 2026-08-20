import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status

from backend.app.services.forensic_analytics_service import (
    get_volume_forensics,
    get_fraud_forensics
)

logger = logging.getLogger("forensic_analytics_router")

router = APIRouter(prefix="/api/v1/forensics", tags=["Forensic Analytics"])


@router.get("/volume")
def fetch_volume_forensics(
    timeframe: str = Query(
        "24HRS", 
        pattern="(?i)^(24hrs|7days|4weeks|1year)$", 
        description="Timeframe selection: 24HRS, 7DAYS, 4WEEKS, 1YEAR"
    ),
    start_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD HH:MM:SS au YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD HH:MM:SS au YYYY-MM-DD"),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0)
):
    """
    Inarudisha Data ya Volume & Amount ikiwa na Chart Trends na Detail Table Data.
    """
    try:
        return get_volume_forensics(
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error fetching volume forensics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hitilafu imetokea wakati wa kuchakata data ya mzunguko wa miamala."
        )


@router.get("/frauds")
def fetch_fraud_forensics(
    timeframe: str = Query(
        "24HRS", 
        pattern="(?i)^(24hrs|7days|4weeks|1year)$", 
        description="Timeframe selection: 24HRS, 7DAYS, 4WEEKS, 1YEAR"
    ),
    start_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD HH:MM:SS au YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD HH:MM:SS au YYYY-MM-DD"),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0)
):
    """
    Inarudisha Uchambuzi wa Utapeli (Fraud vs Non-Fraud) ukiwa na Chart na Table Data.
    """
    try:
        return get_fraud_forensics(
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error fetching fraud forensics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hitilafu imetokea wakati wa kuchakata data ya uchambuzi wa utapeli."
        )
