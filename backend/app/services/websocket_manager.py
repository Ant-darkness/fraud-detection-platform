import logging
import json
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"🟢 Client MPYA imeunganishwa! Jumla ya Clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"🔴 Client imejitoa/imekimbia. Waliobaki: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """
        Inasambaza data kwa wateja wote walio-connect kwa wakati mmoja kwa ufanisi wa hali ya juu.
        Inasafisha kiotomatiki (Auto-Cleanup) connection zilizokufa.
        """
        if not self.active_connections:
            return

        dead_connections = []
        payload_str = json.dumps(message, default=str)

        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.error(
                    f"⚠️ Imeshindikana kutuma payload kwa client: {str(e)}")
                dead_connections.append(connection)

        # Safisha vilivyokufa bila kuzuia vingine
        for dead in dead_connections:
            self.disconnect(dead)


# Global Manager Instance
ws_manager = ConnectionManager()
