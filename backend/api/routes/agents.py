import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import google.generativeai as genai

from backend.app.database.connection import get_connection
from backend.app.services.notification_service import send_airflow_alert_email

router = APIRouter(prefix="/api/v1/agents", tags=["AI Agents"])
logger = logging.getLogger(__name__)

# Config ya Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# WebSockets Manager kwa ajili ya Live Push bila Refresh


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
            except Exception as e:
                logger.error(f"WebSocket broadcast error: {e}")


manager = ConnectionManager()


class AgentTriggerSchema(BaseModel):
    agent_type: str  # 'fraud' au 'volume'
    timeframe: str   # '24HRS', '7DAYS', '4WEEKS', '1YEAR'


@router.websocket("/ws/live-stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    Frontend inajiunga hapa kupokea Live Push za Fraud na Volume
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/trigger")
async def trigger_agent_execution(payload: AgentTriggerSchema, background_tasks: BackgroundTasks):
    """
    Endpoint inayoitwa na Airflow
    """
    background_tasks.add_task(
        run_agent_pipeline, payload.agent_type, payload.timeframe)
    return {"status": "processing", "agent": payload.agent_type, "timeframe": payload.timeframe}


async def run_agent_pipeline(agent_type: str, timeframe: str):
    try:
        # 1. Pata Data kutoka DB
        data = fetch_metrics_from_db(agent_type, timeframe)

        # 2. Zalisha AI Commentary kwa kutumia Gemini
        ai_comment = generate_gemini_insight(agent_type, timeframe, data)

        # 3. Kama ni Fraud Agent na Hatari ni kubwa, Tuma Alert Email!
        if agent_type == "fraud" and data.get("high_risk_count", 0) > 5:
            await send_airflow_alert_email(
                email=os.getenv("ALERT_EMAIL", "datascience@bot.go.tz"),
                dag_id="agents_analytics_pipeline",
                task_id=f"fraud_alert_{timeframe}",
                status="CRITICAL_FRAUD_DETECTED",
                log_url="http://localhost:8080",
                error_msg=f"Kubaini Miamala Hatari {data.get('high_risk_count')} ndani ya {timeframe}"
            )

        # 4. PUSH DATA DIRECT FRONTEND VIA WEBSOCKET
        payload_to_push = {
            "event_type": "AGENT_REALTIME_UPDATE",
            "agent_type": agent_type,   # 'fraud' au 'volume'
            "timeframe": timeframe,     # '24HRS', '7DAYS', n.k.
            "ai_commentary": ai_comment,
            "metrics": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast(payload_to_push)

    except Exception as e:
        logger.error(
            f"Error running agent pipeline [{agent_type} - {timeframe}]: {e}")


def fetch_metrics_from_db(agent_type: str, timeframe: str) -> Dict[str, Any]:
    intervals = {
        "24HRS": "24 HOURS",
        "7DAYS": "7 DAYS",
        "4WEEKS": "4 WEEKS",
        "1YEAR": "1 YEAR"
    }
    interval = intervals.get(timeframe, "24 HOURS")
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if agent_type == "fraud":
            query = f"""
                SELECT 
                    COUNT(*) as total_tx,
                    COUNT(CASE WHEN is_fraud = True THEN 1 END) as fraud_count,
                    COALESCE(AVG(fraud_probability), 0) as avg_risk
                FROM transactions 
                WHERE created_at >= NOW() - INTERVAL '{interval}'
            """
            cursor.execute(query)
            row = cursor.fetchone()
            return {
                "total_transactions": row[0],
                "high_risk_count": row[1],
                "average_risk_score": round(float(row[2]), 4)
            }
        else:  # Volume Agent
            query = f"""
                SELECT 
                    COUNT(*) as total_tx,
                    COALESCE(SUM(amount), 0) as total_volume,
                    COALESCE(AVG(amount), 0) as avg_amount
                FROM transactions 
                WHERE created_at >= NOW() - INTERVAL '{interval}'
            """
            cursor.execute(query)
            row = cursor.fetchone()
            return {
                "total_transactions": row[0],
                "total_volume_tzs": float(row[1]),
                "average_transaction_size": float(row[2])
            }
    finally:
        cursor.close()
        conn.close()


def generate_gemini_insight(agent_type: str, timeframe: str, data: dict) -> str:
    """Inatengeneza uchambuzi wa Kiswahili sanifu kwa kutumia Gemini"""
    model = genai.GenerativeModel('gemini-3.6-flash')

    prompt = f"""
    Wewe ni Mtaalamu wa Analytics na Usimamizi wa Miamala wa Benki Kuu (BoT).
    Fanya uchambuzi mfupi wa kiufundi wa ripoti hii kwa Kiswahili rasmi na cha kitaalamu (isizidi maneno 60):
    
    Agent Type: {agent_type.upper()}
    Timeframe: {timeframe}
    Data ya Miamala: {json.dumps(data)}
    
    Toa muhtasari wa hali halisi na Ushauri mfupi wa kiusalama/kibenki.
    """
    response = model.generate_content(prompt)
    return response.text
