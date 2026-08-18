import logging
import json
import asyncio
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
            f"🟢 Client MPYA imeunganishwa! Jumla ya Clients: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"🔴 Client imejitoa/imekimbia. Waliobaki: {len(self.active_connections)}"
            )

    async def broadcast(self, message: Dict[str, Any]):
        """
        Inasambaza data kwa wateja wote walio-connect kwa wakati mmoja (Parallel)
        kwa kutumia asyncio.gather ili kutoa kasi ya hali ya juu (Ultra-Low Latency).
        Inasafisha kiotomatiki (Auto-Cleanup) connection zilizokufa.
        """
        if not self.active_connections:
            return

        payload_str = json.dumps(message, default=str)
        dead_connections = []

        async def send_to_client(connection: WebSocket):
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.error(
                    f"⚠️ Imeshindikana kutuma payload kwa client: {str(e)}")
                dead_connections.append(connection)

        # Kurusha data kwa ma-client wote MTOA MMOJA KWA PAMOJA (Parallel Broadcast)
        await asyncio.gather(*(send_to_client(conn) for conn in list(self.active_connections)))

        # Safisha connection zote zilizokufa mara moja
        for dead in dead_connections:
            self.disconnect(dead)


# Global Singleton Manager Instance
ws_manager = ConnectionManager()
