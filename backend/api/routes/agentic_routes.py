import os
import httpx
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from typing import Optional, List


router = APIRouter(prefix="/api/v1/agents", tags=["Agentic AI Engine"])


IS_DOCKER = os.path.exists("/.dockerenv")
DEFAULT_AGENT_URL = "http://agentic-service:8001" if IS_DOCKER else "http://localhost:8001"
AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", DEFAULT_AGENT_URL)

TIMEOUT_CONFIG = httpx.Timeout(30.0, connect=5.0)


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
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


ws_manager = ConnectionManager()


@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ==========================================
# ENDPOINTS ZINAZO-PROX WAKATI ZIKIPUSH DATA
# ==========================================

@router.post("/query")
async def process_forensic_query(payload: dict):
    async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
        try:
            res = await client.post(f"{AGENT_SERVICE_URL}/agent/query", json=payload)
            res.raise_for_status()
            return res.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/volume-analytics")
async def get_volume_analytics(
    background_tasks: BackgroundTasks,
    timeframe: str = Query("7DAYS"),
    language: Optional[str] = Query("sw")
):
    async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
        try:
            params = {"timeframe": timeframe, "language": language}
            res = await client.get(f"{AGENT_SERVICE_URL}/agent/volume-analytics", params=params)
            res.raise_for_status()
            data = res.json()

            # PUSH TO FRONTEND VIA WEBSOCKET
            background_tasks.add_task(
                ws_manager.broadcast,
                {"event": "VOLUME_UPDATE", "data": data}
            )
            return data
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Volume Analytics Error: {str(e)}")


@router.get("/fraud-analytics")
async def get_fraud_analytics(
    background_tasks: BackgroundTasks,
    timeframe: str = Query("7DAYS"),
    language: Optional[str] = Query("sw")
):
    async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
        try:
            params = {"timeframe": timeframe, "language": language}
            res = await client.get(f"{AGENT_SERVICE_URL}/agent/fraud-analytics", params=params)
            res.raise_for_status()
            data = res.json()

            # PUSH TO FRONTEND VIA WEBSOCKET
            background_tasks.add_task(
                ws_manager.broadcast,
                {"event": "FRAUD_UPDATE", "data": data}
            )
            return data
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Fraud Analytics Error: {str(e)}")


@router.post("/model-audit")
async def process_model_audit(payload: dict):
    async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
        try:
            res = await client.post(f"{AGENT_SERVICE_URL}/agent/model-audit", json=payload)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


