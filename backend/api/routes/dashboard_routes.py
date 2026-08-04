from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from typing import Optional
import json

from backend.app.services.dashboard_service import (
    dashboard_summary, 
    get_dashboard_analytics,
    get_volume_comparison_data,
    generate_plotly_volume_chart,
    manager
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

# WebSocket kwa ajili ya Live Volume Charting
@router.websocket("/ws/live-volume")
async def live_volume_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        initial_payload = generate_plotly_volume_chart(timeframe="24hrs")
        await websocket.send_text(json.dumps(initial_payload))

        while True:
            data_received = await websocket.receive_text()
            request_json = json.loads(data_received)
            selected_tf = request_json.get("timeframe", "24hrs")
            
            updated_payload = generate_plotly_volume_chart(timeframe=selected_tf)
            await websocket.send_text(json.dumps(updated_payload))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
