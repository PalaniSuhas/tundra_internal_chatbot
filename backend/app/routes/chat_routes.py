from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import json

from app.auth import get_current_user
from app.database import get_db
from app.websocket_manager import manager
from app.rag_engine import rag_engine
from app.vector_store import vector_store
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/sessions")
async def create_session(current_user = Depends(get_current_user), db = Depends(get_db)):
    session = {
        "user_id": str(current_user["_id"]),
        "title": "New Chat",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.chat_sessions.insert_one(session)
    session["_id"] = str(result.inserted_id)
    
    return {"session_id": str(result.inserted_id), "title": session["title"]}


@router.get("/sessions")
async def get_sessions(current_user = Depends(get_current_user), db = Depends(get_db)):
    sessions = await db.chat_sessions.find(
        {"user_id": str(current_user["_id"])}
    ).sort("updated_at", -1).to_list(100)
    
    return [{
        "id": str(session["_id"]),
        "title": session["title"],
        "created_at": session["created_at"].isoformat(),
        "updated_at": session["updated_at"].isoformat()
    } for session in sessions]


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session or session["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await db.messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(1000)
    
    return [{
        "id": str(msg["_id"]),
        "role": msg["role"],
        "content": msg["content"],
        "timestamp": msg["timestamp"].isoformat(),
        "file_references": msg.get("file_references", [])
    } for msg in messages]


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session or session["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.chat_sessions.delete_one({"_id": ObjectId(session_id)})
    await db.messages.delete_many({"session_id": session_id})
    await db.files.delete_many({"session_id": session_id})
    
    return {"message": "Session deleted successfully"}


async def verify_websocket_token(token: Optional[str], db) -> dict:
    """Verify JWT token for WebSocket connections."""
    if not token:
        raise WebSocketDisconnect(code=1008, reason="No token provided")
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise WebSocketDisconnect(code=1008, reason="Invalid token")
    except JWTError:
        raise WebSocketDisconnect(code=1008, reason="Invalid token")
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise WebSocketDisconnect(code=1008, reason="User not found")
    
    return user


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: str,
    token: Optional[str] = Query(None),
    db = Depends(get_db)
):
    await manager.connect(websocket, session_id)
    
    try:
        # Verify authentication
        user = await verify_websocket_token(token, db)
        
        # Verify session belongs to user
        session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
        if not session or session["user_id"] != str(user["_id"]):
            await websocket.close(code=1008, reason="Unauthorized")
            return
        
        vector_store.load_index(session_id)
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_message = message_data.get("content")
            
            user_msg = {
                "session_id": session_id,
                "role": "user",
                "content": user_message,
                "timestamp": datetime.utcnow(),
                "file_references": []
            }
            await db.messages.insert_one(user_msg)
            
            chat_history = await db.messages.find(
                {"session_id": session_id}
            ).sort("timestamp", 1).to_list(100)
            
            history_list = [{
                "role": msg["role"],
                "content": msg["content"]
            } for msg in chat_history[:-1]]
            
            files = await db.files.find({"session_id": session_id}).to_list(100)
            use_rag = len(files) > 0
            
            assistant_content = ""
            async for chunk in rag_engine.generate_response(
                user_message,
                session_id,
                history_list,
                use_rag
            ):
                assistant_content += chunk
                await manager.send_message(json.dumps({
                    "type": "chunk",
                    "content": chunk
                }), session_id)
            
            assistant_msg = {
                "session_id": session_id,
                "role": "assistant",
                "content": assistant_content,
                "timestamp": datetime.utcnow(),
                "file_references": [f["filename"] for f in files]
            }
            await db.messages.insert_one(assistant_msg)
            
            await manager.send_message(json.dumps({
                "type": "end"
            }), session_id)
            
            message_count = await db.messages.count_documents({"session_id": session_id})
            if message_count == 2:
                title = await rag_engine.generate_chat_title(user_message)
                await db.chat_sessions.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": {"title": title, "updated_at": datetime.utcnow()}}
                )
            else:
                await db.chat_sessions.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": {"updated_at": datetime.utcnow()}}
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)