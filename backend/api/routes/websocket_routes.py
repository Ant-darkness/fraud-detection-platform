import asyncio
import json
import logging
import os
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    Header,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from pydantic import BaseModel

from backend.app.services.dashboard_service import (
    dashboard_summary,
    generate_plotly_volume_chart,
    live_counter,
)
from backend.app.services.websocket_manager import ws_manager

logger = logging.getLogger("websocket_routes")
router = APIRouter(prefix="/ws", tags=["WebSockets"])

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")


@router.on_event("startup")
def validate_security_config():
    if not INTERNAL_API_KEY:
        logger.error(
            "🚨 CRITICAL: INTERNAL_API_KEY haijafafanuliwa kwenye .env!")


# ====================================================================
# 1. LIVE FEED WEBSOCKET (Auto Pulse + Real-Time Broadcast Receiver)
# ====================================================================
@router.websocket("/live-feed")
async def live_feed_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    selected_timeframe = "24hrs"

    # Push Periodic Summary & Charts (Dashboard Pulse Every 3 Secs)
    async def push_updates():
        nonlocal selected_timeframe
        while True:
            try:
                payload = {
                    "event_type": "LIVE_PULSE_UPDATE",
                    "summary": dashboard_summary(),
                    "volume_chart": generate_plotly_volume_chart(selected_timeframe),
                }
                await websocket.send_text(json.dumps(payload, default=str))
                await asyncio.sleep(3)
            except Exception as e:
                logger.debug(f"Pulse task stopped: {e}")
                break

    # Listen to incoming control commands from Frontend
    async def listen_client():
        nonlocal selected_timeframe
        while True:
            try:
                data = await websocket.receive_text()
                req = json.loads(data)
                if "timeframe" in req:
                    selected_timeframe = req["timeframe"]
            except Exception:
                break

    pulse_task = asyncio.create_task(push_updates())
    listen_task = asyncio.create_task(listen_client())

    try:
        await asyncio.gather(pulse_task, listen_task)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in websocket loop: {e}")
        ws_manager.disconnect(websocket)
    finally:
        pulse_task.cancel()
        listen_task.cancel()


# ====================================================================
# 2. INTERNAL KAFKA CONSUMER BROADCAST RECEIVER
# ====================================================================
class BroadcastPayload(BaseModel):
    event_type: str
    transaction: Dict[str, Any]
    fraud_probability: float
    is_fraud: bool


@router.post("/broadcast")
async def broadcast_event(
    payload: BroadcastPayload, x_internal_key: Optional[str] = Header(None)
):
    if not INTERNAL_API_KEY or x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized Internal Broadcast Attempt!",
        )

    live_counter.increment(1)

    message_data = {
        "event_type": payload.event_type,
        "transaction": payload.transaction,
        "fraud_probability": payload.fraud_probability,
        "is_fraud": payload.is_fraud,
        "live_uptime_transactions": live_counter.get_count(),
    }

    # Irushie frontend ma-client wote mara moja!
    await ws_manager.broadcast(message_data)

    return {
        "status": "broadcast_sent_successfully",
        "current_live_count": live_counter.get_count(),
    }
