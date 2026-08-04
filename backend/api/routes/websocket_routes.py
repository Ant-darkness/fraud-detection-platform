from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

# Endpoint ya Frontend kujiunga (WebSocket)


@router.websocket("/live-feed")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Tunatunza connection ikiwa hai (Ping/Pong)
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Payload DTO inayotumwa kutoka kwa Kafka Consumer


class BroadcastPayload(BaseModel):
    event_type: str  # e.g., 'NEW_TRANSACTION'
    transaction: Dict[str, Any]
    fraud_probability: float
    is_fraud: bool

# Internal Endpoint inayotumiwa na Consumer kutuma update


@router.post("/broadcast")
async def broadcast_event(payload: BroadcastPayload):
    await ws_manager.broadcast(payload.dict())
    return {"status": "broadcast_sent"}
