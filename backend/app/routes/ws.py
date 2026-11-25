from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["Collaboration WebSocket"])


class RoomManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, room_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(room_id, set()).add(ws)

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        if room_id in self.rooms:
            self.rooms[room_id].discard(ws)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, room_id: str, data: bytes, sender: WebSocket) -> None:
        for peer in list(self.rooms.get(room_id, set())):
            if peer is not sender:
                await peer.send_bytes(data)


manager = RoomManager()


@router.websocket("/ws/collab/{presentation_id}")
async def collab_ws(websocket: WebSocket, presentation_id: str):
    await manager.connect(presentation_id, websocket)
    try:
        while True:
            msg = await websocket.receive_bytes()
            await manager.broadcast(presentation_id, msg, websocket)
    except WebSocketDisconnect:
        manager.disconnect(presentation_id, websocket)

