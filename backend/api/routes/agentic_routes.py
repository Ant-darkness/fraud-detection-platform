# backend/app/routes/agentic_routes.py
from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter(prefix="/api/v1/agents", tags=["Agentic AI"])

AGENT_SERVICE_URL = os.getenv(
    "AGENT_SERVICE_URL", "http://agentic-service:8001")


@router.post("/query")
async def process_forensic_query(payload: dict):
    """
    Route ya Agent wa Query (SELECT-only)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(f"{AGENT_SERVICE_URL}/agent/query", json=payload)
            return res.json()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to communicate with Agent Microservice: {str(e)}")


@router.post("/trend")
async def process_trend_comment(payload: dict):
    """
    Route ya Agent wa Trends za Miamala (24HRS, 7Days, 4Weeks, 12Months) - Live UI Only
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(f"{AGENT_SERVICE_URL}/agent/trend", json=payload)
            return res.json()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to fetch trend commentary: {str(e)}")


@router.post("/model-audit")
async def process_model_audit(payload: dict):
    """
    Route ya Agent wa Model Metrics (Anaandika description na kui-save DB)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(f"{AGENT_SERVICE_URL}/agent/model-audit", json=payload)
            return res.json()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to execute model audit: {str(e)}")
