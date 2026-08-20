import logging
import os
from typing import Dict, Any, Optional, List

import httpx
from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
    Response,
    status
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Imports za Services Zako
from agentic_service.services.query_agent import QueryAgent
from agentic_service.services.volume_agent import VolumeMetricsAgent
from agentic_service.services.fraud_agent import FraudMetricsAgent
from agentic_service.services.trend_agent import TrendAgent
from agentic_service.services.model_audit_agent import ModelAuditAgent
from agentic_service.services.report_agent import ReportGeneratorAgent
from agentic_service.services.chart_agent import ChartGeneratorAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentic_service")

# 1. INITIALIZE FASTAPI APP
app = FastAPI(
    title="Bank of Tanzania - Forensic Intelligence Microservice",
    version="3.5.0",
    description="Enterprise Fraud, Volume Analytics, Charting, and PDF Reporting Microservice"
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# WEBSOCKET MANAGER FOR REAL-TIME PUSH
# ==========================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        stale_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                stale_connections.append(connection)
        
        for connection in stale_connections:
            self.disconnect(connection)

ws_manager = ConnectionManager()

# ==========================================
# SCHEMAS (PYDANTIC)
# ==========================================

class ScopedQueryReq(BaseModel):
    prompt: str = Field(..., example="Nionyeshe miamala iliyozidi TSH 10M mwezi uliopita")
    context: Optional[str] = Field("business", example="fraud | volume | business")

class ModelAuditReq(BaseModel):
    model_id: int = Field(..., example=1)
    metrics: Dict[str, Any] = Field(..., example={"precision": 0.85, "recall": 0.78, "f1_score": 0.81, "roc_auc": 0.92})

class ReportGenReq(BaseModel):
    title: str
    summary: str
    data: list

# ==========================================
# DIRECT CORE AGENT ENDPOINTS (/agent/*)
# ==========================================

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "agentic_service", "version": "3.5.0"}

@app.post("/agent/query")
async def handle_scoped_query(req: ScopedQueryReq):
    try:
        return QueryAgent.process_query(user_prompt=req.prompt, context=req.context)
    except Exception as e:
        logger.error(f"[QUERY AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/volume-analytics")
async def handle_volume_analytics(
    background_tasks: BackgroundTasks,
    timeframe: str = Query("7DAYS", description="24HRS, 7DAYS, 4WEEKS, 1YEAR"),
    language: str = Query("sw", description="sw au en")
):
    try:
        data = VolumeMetricsAgent.analyze_volume(timeframe=timeframe, language=language)
        background_tasks.add_task(
            ws_manager.broadcast,
            {"event": "VOLUME_UPDATE", "data": data}
        )
        return data
    except Exception as e:
        logger.error(f"[VOLUME AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/fraud-analytics")
async def handle_fraud_analytics(
    background_tasks: BackgroundTasks,
    timeframe: str = Query("7DAYS", description="24HRS, 7DAYS, 4WEEKS, 1YEAR"),
    language: str = Query("sw", description="sw au en")
):
    try:
        data = FraudMetricsAgent.analyze_fraud(timeframe=timeframe, language=language)
        background_tasks.add_task(
            ws_manager.broadcast,
            {"event": "FRAUD_UPDATE", "data": data}
        )
        return data
    except Exception as e:
        logger.error(f"[FRAUD AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/trend-analytics")
async def handle_trend_analytics(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    timeframe: str = Query("7DAYS"),
    language: str = Query("sw")
):
    try:
        data = TrendAgent.analyze_trend(timeframe=timeframe, metrics_data=payload, language=language)
        background_tasks.add_task(
            ws_manager.broadcast,
            {"event": "TREND_UPDATE", "data": data}
        )
        return data
    except Exception as e:
        logger.error(f"[TREND AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/model-audit")
async def handle_model_audit(req: ModelAuditReq):
    try:
        return ModelAuditAgent.audit_and_save_model(model_id=req.model_id, metrics=req.metrics)
    except Exception as e:
        logger.error(f"[MODEL AUDIT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/download-chart")
async def download_chart(payload: Dict[str, Any]):
    try:
        chart_data = payload.get("data", [])
        x_col = payload.get("x_col", "period")
        y_col = payload.get("y_col", "total_volume")
        title = payload.get("title", "Transaction Trends")
        
        png_bytes = ChartGeneratorAgent.generate_chart_png(chart_data, x_col, y_col, title)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"[CHART AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/generate-report")
async def generate_report(req: ReportGenReq):
    try:
        pdf_bytes = ReportGeneratorAgent.generate_pdf_report(req.title, req.summary, req.data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=BoT_Report_{req.title}.pdf"}
        )
    except Exception as e:
        logger.error(f"[REPORT AGENT ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# GATEWAY ROUTER INTEGRATION & WEBSOCKET
# ==========================================

router = APIRouter(prefix="/api/v1/agents", tags=["Agentic AI Engine Gateway"])

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Include Router to App
app.include_router(router)
