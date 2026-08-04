from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Business Analytics & Agent"])


# -------------------------------------------------------------
# 1. PYDANTIC REQUEST SCHEMAS
# -------------------------------------------------------------
class QueryRequest(BaseModel):
    query_id: str
    params: Optional[Dict[str, Any]] = {}


class AgentQueryRequest(BaseModel):
    prompt: str


class ConfirmActionRequest(BaseModel):
    sql_query: str
    officer_id: Optional[str] = "SYSTEM_OFFICER"


# -------------------------------------------------------------
# 2. ROUTES
# -------------------------------------------------------------

@router.post("/query")
def run_business_query(request: QueryRequest):
    """
    Endpoint ya ku-execute static analytic queries (Q1 mpaka Q15).
    """
    try:
        response = AnalyticsService.execute_query(
            request.query_id, request.params
        )
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )


@router.post("/agent-query")
def process_agent_query(request: AgentQueryRequest):
    """
    Endpoint ya AI Agent:
    - Inapokea prompt ya mtumiaji (Swahili/English).
    - Kama ni SELECT, inarudisha data hapo hapo.
    - Kama ni WRITE/ACTION, inarudisha 'requires_approval = True' bila kugusa DB.
    """
    try:
        response = AnalyticsService.execute_query(
            "agent", {"prompt": request.prompt}
        )
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hitilafu ya Agent: {str(e)}"
        )


@router.post("/agent-confirm")
def confirm_agent_action(request: ConfirmActionRequest):
    """
    Endpoint ya Human-in-the-Loop Approval:
    - Inaitwa tu wakati Afisa amebofya 'Thibitisha' kwenye Toast au Modal UI.
    - Inatekeleza SQL iliyokuwa staged kwa usalama.
    """
    try:
        params = {
            "sql_query": request.sql_query,
            "officer_id": request.officer_id
        }
        response = AnalyticsService.execute_query("confirm_action", params)
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hitilafu wakati wa kuthibitisha action: {str(e)}"
        )
