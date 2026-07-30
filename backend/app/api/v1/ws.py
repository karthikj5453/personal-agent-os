import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.agents.orchestrator import run_orchestrator

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections for live LangGraph node trace streaming."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_event(self, websocket: WebSocket, event: dict):
        try:
            await websocket.send_text(json.dumps(event))
        except Exception:
            self.disconnect(websocket)

    async def broadcast(self, event: dict):
        for connection in self.active_connections:
            await self.send_event(connection, event)


manager = ConnectionManager()


@router.websocket("/agent-stream")
async def agent_stream_ws(websocket: WebSocket):
    """
    WebSocket endpoint for real-time LangGraph node trace streaming.
    The frontend NodeGraph subscribes here to receive live node activation events.

    Message format:
    {
        "type": "node_activation" | "log_entry" | "execution_complete" | "ping",
        "payload": { ... }
    }
    """
    await manager.connect(websocket)
    try:
        # Send connection acknowledgement
        await manager.send_event(websocket, {
            "type": "connected",
            "payload": {
                "message": "NEXUS WebSocket stream connected",
                "timestamp": datetime.now().isoformat()
            }
        })

        while True:
            # Receive query from frontend
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "ping":
                await manager.send_event(websocket, {"type": "pong"})
                continue

            if data.get("type") == "execute_query":
                query = data.get("query", "")

                # Stream: Supervisor activation
                await manager.send_event(websocket, {
                    "type": "node_activation",
                    "payload": {"node": "Supervisor (Ops)", "status": "active", "timestamp": datetime.now().isoformat()}
                })

                await asyncio.sleep(0.1)

                # Run LangGraph orchestrator
                result = run_orchestrator(query)

                # Stream each log entry with short delay for visual effect
                for log in result.get("logs", []):
                    # If EmailSubagent log, notify node activation
                    if "Email" in log.get("agent", ""):
                        await manager.send_event(websocket, {
                            "type": "node_activation",
                            "payload": {"node": "EmailSubagent", "status": "active", "timestamp": datetime.now().isoformat()}
                        })
                    await manager.send_event(websocket, {
                        "type": "log_entry",
                        "payload": log
                    })
                    await asyncio.sleep(0.08)

                # Stream: Return to Supervisor
                await manager.send_event(websocket, {
                    "type": "node_activation",
                    "payload": {"node": "Supervisor (Ops)", "status": "active", "timestamp": datetime.now().isoformat()}
                })

                await asyncio.sleep(0.1)

                # Stream: Completion
                await manager.send_event(websocket, {
                    "type": "execution_complete",
                    "payload": {
                        "final_output": result.get("final_output", ""),
                        "agent_flow": result.get("agent_flow", []),
                        "email_context": result.get("email_context", []),
                        "consent_pending": result.get("consent_pending"),
                        "timestamp": datetime.now().isoformat()
                    }
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        await manager.send_event(websocket, {
            "type": "error",
            "payload": {"message": str(e)}
        })
        manager.disconnect(websocket)
