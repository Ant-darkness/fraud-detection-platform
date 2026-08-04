import logging
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from agentic_service.services.query_agent import QueryAgent
from agentic_service.services.trend_agent import TrendAgent
from agentic_service.services.model_audit_agent import ModelAuditAgent

# Weka setup ya logging ili ionekane vizuri kwenye Docker logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentic_service")

app = FastAPI(title="Fraud Engine Agentic Service", version="2.0.0")


class QueryReq(BaseModel):
    prompt: str


class TrendReq(BaseModel):
    timeframe: str  # 24HRS, 7DAYS, 4WEEKS, 12MONTHS
    metrics_data: Dict[str, Any]
    language: Optional[str] = "sw"


class ModelAuditReq(BaseModel):
    model_id: int
    metrics: Dict[str, float]  # precision, recall, f1_score, roc_auc


@app.post("/agent/query")
def handle_query(req: QueryReq):
    try:
        return QueryAgent.process_query(req.prompt)
    except Exception as e:
        logger.error(f"[QUERY AGENT ERROR]: {str(e)}")
        traceback.print_exc()  # Ita-print stack trace yote kwenye Docker logs
        raise HTTPException(
            status_code=500, detail=f"QueryAgent Error: {str(e)}")


@app.post("/agent/trend")
def handle_trend(req: TrendReq):
    try:
        return TrendAgent.analyze_trend(req.timeframe, req.metrics_data, req.language)
    except Exception as e:
        logger.error(f"[TREND AGENT ERROR]: {str(e)}")
        traceback.print_exc()  # Ita-print stack trace yote kwenye Docker logs
        raise HTTPException(
            status_code=500, detail=f"TrendAgent Error: {str(e)}")


@app.post("/agent/model-audit")
def handle_model_audit(req: ModelAuditReq):
    try:
        return ModelAuditAgent.audit_and_save_model(req.model_id, req.metrics)
    except Exception as e:
        logger.error(f"[MODEL AUDIT AGENT ERROR]: {str(e)}")
        traceback.print_exc()  # Ita-print stack trace yote kwenye Docker logs
        raise HTTPException(
            status_code=500, detail=f"ModelAuditAgent Error: {str(e)}")
