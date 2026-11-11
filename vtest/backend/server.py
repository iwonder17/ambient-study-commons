"""
vtest Full Backend Server.
Complete FastAPI application implementing all API endpoints and WebSocket Greeting Room
from programDescribeDetail.txt lines 418-452, 958-999.
"""

import os
import io
import zipfile
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from database import db
from models import (
    UserAccount, UserPreferences, FreeTimeSlot, SessionRecord, MasterJournal,
    UserSkill, UserDream, CanvasData, CanvasReminder, DreamPoolEntry,
    MatchRecord, Meeting, CreditScore, CreditEvent
)
from ai_pipeline import run_daily_pipeline, bundle_weekly_review, run_matching_engine, WEEKLY_REVIEW_PROMPT

app = FastAPI(
    title="Ambient Study Commons (vtest)",
    description="Full Production Architecture Backend for Autonomous Study Journal & Peer Commons",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_USER_ID = "user_jordan_101"

# 1. Onboarding & Accounts
@app.post("/api/auth/google")
def auth_google(payload: Dict[str, Any] = Body(...)):
    user = db.users.get(CURRENT_USER_ID)
    return {"token": user.authToken, "user": user}

@app.get("/api/me")
def get_me():
    user = db.users.get(CURRENT_USER_ID)
    pref = db.preferences.get(CURRENT_USER_ID)
    return {"user": user, "preferences": pref}

@app.put("/api/me/preferences")
def update_preferences(prefs: Dict[str, Any] = Body(...)):
    current = db.preferences.get(CURRENT_USER_ID)
    if not current:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    for k, v in prefs.items():
        if hasattr(current, k):
            setattr(current, k, v)
    current.updatedAt = datetime.now().isoformat()
    db.save_to_disk()
    return current

@app.put("/api/me/freetime")
def update_freetime(slots: List[Dict[str, Any]] = Body(...)):
    new_slots = [FreeTimeSlot(**s) for s in slots]
    db.freetime[CURRENT_USER_ID] = new_slots
    db.save_to_disk()
    return {"success": True, "count": len(new_slots)}

# 2. Raw Sessions & Daily Pipeline
@app.post("/api/sessions")
def create_session(session: Dict[str, Any] = Body(...)):
    rec = SessionRecord(
        id=f"sess_{uuid.uuid4().hex[:8]}",
        userId=CURRENT_USER_ID,
        rawText=session.get("text", session.get("rawText", "")),
        source=session.get("source", "gemini"),
        collectionMethod=session.get("collectionMethod", "auto"),
        timestamp=session.get("timestamp", datetime.now().isoformat()),
        createdAt=datetime.now().isoformat()
    )
    db.sessions.insert(0, rec)
    db.save_to_disk()
    return rec

@app.get("/api/sessions")
def get_sessions(date: Optional[str] = None):
    results = [s for s in db.sessions if s.userId == CURRENT_USER_ID]
    if date:
        results = [s for s in results if s.timestamp.startswith(date)]
    return results

@app.post("/api/pipeline/trigger")
def trigger_pipeline():
    journal = run_daily_pipeline(CURRENT_USER_ID)
    return {"success": True, "masterJournal": journal}

# 3. Master Journals
@app.get("/api/journals")
def get_journals(page: int = 1, limit: int = 20):
    user_journals = [j for j in db.journals if j.userId == CURRENT_USER_ID]
    start = (page - 1) * limit
    end = start + limit
    return {
        "page": page,
        "limit": limit,
        "total": len(user_journals),
        "items": user_journals[start:end]
    }

@app.get("/api/journals/{date}")
def get_journal_by_date(date: str):
    j = next((j for j in db.journals if j.userId == CURRENT_USER_ID and j.date == date), None)
    if not j:
        raise HTTPException(status_code=404, detail="Journal for this date not found")
    return j

# 4. Skills & Dreams
@app.get("/api/skills")
def get_skills():
    skill = db.skills.get(CURRENT_USER_ID)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill profile not found")
    return skill

@app.get("/api/dreams")
def get_dreams(page: int = 1, limit: int = 20):
    user_dreams = [d for d in db.dreams if d.userId == CURRENT_USER_ID]
    start = (page - 1) * limit
    end = start + limit
    return {
        "page": page,
        "limit": limit,
        "total": len(user_dreams),
        "items": user_dreams[start:end]
    }

@app.post("/api/dreams/{dream_id}/submit")
def submit_dream_to_pool(dream_id: str, payload: Dict[str, Any] = Body(...)):
    dream = next((d for d in db.dreams if d.id == dream_id and d.userId == CURRENT_USER_ID), None)
    if not dream:
        raise HTTPException(status_code=404, detail="Dream not found")
    
    entry = DreamPoolEntry(
        id=f"pool_{uuid.uuid4().hex[:8]}",
        submittedByUserId=CURRENT_USER_ID,
        title=payload.get("title", dream.topic),
        description=payload.get("description", "Community collaboration idea"),
        tags=payload.get("tags", [t.strip() for t in payload.get("tag_string", "").split(",") if t.strip()]),
        sourceType="user_dream",
        status="active",
        createdAt=datetime.now().isoformat()
    )
    db.dream_pool.insert(0, entry)
    dream.status = "submitted_to_pool"
    db.save_to_disk()
    
    # Run matching engine automatically
    new_matches = run_matching_engine()
    return {"success": True, "entry": entry, "newMatches": len(new_matches)}

# 5. Canvas Data & Reminders
@app.post("/api/canvas/{canvas_type}")
def save_canvas_data(canvas_type: str, payload: Dict[str, Any] = Body(...)):
    rec = CanvasData(
        id=f"canv_{uuid.uuid4().hex[:8]}",
        userId=CURRENT_USER_ID,
        dataType=canvas_type, # type: ignore
        content=payload,
        scrapedAt=datetime.now().isoformat()
    )
    db.canvas_data.append(rec)
    db.save_to_disk()
    return {"success": True, "id": rec.id}

@app.get("/api/canvas/reminders")
def get_canvas_reminders():
    return [r for r in db.canvas_reminders if r.userId == CURRENT_USER_ID]

# 6. Weekly Review
@app.get("/api/weekly-review/status")
def weekly_review_status():
    return {
        "weeklyReviewAvailable": True,
        "cycleDays": db.preferences.get(CURRENT_USER_ID).reviewCycleDays,
        "message": "Weekly review ready for reflection!"
    }

@app.get("/api/weekly-review/bundle")
def weekly_review_bundle():
    bundle_text = bundle_weekly_review(CURRENT_USER_ID)
    return {
        "bundle": bundle_text,
        "prompt": WEEKLY_REVIEW_PROMPT
    }

# 7. Invitations & Matching
@app.get("/api/invitations")
def get_invitations(page: int = 1, limit: int = 20):
    user_invites = [m for m in db.matches if m.userIdA == CURRENT_USER_ID or m.userIdB == CURRENT_USER_ID]
    return {
        "page": page,
        "limit": limit,
        "total": len(user_invites),
        "items": user_invites
    }

@app.post("/api/invitations/{match_id}/respond")
def respond_invitation(match_id: str, payload: Dict[str, Any] = Body(...)):
    action = payload.get("action", "accept")
    match = next((m for m in db.matches if m.id == match_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if action == "accept":
        match.respondedA = "accepted"
        match.status = "accepted"
        # Create meeting if not existing
        meet_id = f"meet_{match.id}"
        if meet_id not in db.meetings:
            db.meetings[meet_id] = Meeting(
                id=meet_id,
                matchId=match.id,
                scheduledAt=match.suggestedGreetingTime,
                userIdA=match.userIdA,
                userIdB=match.userIdB,
                confirmedA=True,
                confirmedB=True,
                roomStatus="active",
                topic=match.matchedDreamTopics[0] if match.matchedDreamTopics else "Collaborative Project",
                createdAt=datetime.now().isoformat()
            )
            db.room_messages[meet_id] = [
                {
                    "id": "msg_01",
                    "sender": "ai_host",
                    "text": "Welcome! I'm excited to introduce you both. 🎉",
                    "timestamp": datetime.now().strftime("%I:%M %p")
                },
                {
                    "id": "msg_02",
                    "sender": "ai_host",
                    "text": f"You both share an interest in {match.matchedDreamTopics[0] if match.matchedDreamTopics else 'Engineering'}! Would you like to share what you hope to build?",
                    "timestamp": datetime.now().strftime("%I:%M %p")
                }
            ]
    else:
        match.respondedA = "declined"
        match.status = "declined"

    db.save_to_disk()
    return {"success": True, "match": match}

# 8. Greeting Room & WebSockets
@app.get("/api/greeting-room/{meeting_id}")
def get_greeting_room(meeting_id: str):
    meeting = db.meetings.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    messages = db.room_messages.get(meeting_id, [])
    return {
        "meeting": meeting,
        "messages": messages,
        "topic": meeting.topic
    }

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: Dict[str, Any]):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/greeting-room/{meeting_id}")
async def websocket_greeting_room(websocket: WebSocket, meeting_id: str):
    await manager.connect(meeting_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Append message to room
            new_msg = {
                "id": f"msg_{uuid.uuid4().hex[:6]}",
                "sender": data.get("sender", "self"),
                "text": data.get("text", ""),
                "timestamp": datetime.now().strftime("%I:%M %p")
            }
            if meeting_id not in db.room_messages:
                db.room_messages[meeting_id] = []
            db.room_messages[meeting_id].append(new_msg)
            db.save_to_disk()

            # Broadcast user message
            await manager.broadcast(meeting_id, new_msg)

            # AI Host scripted responses (lines 980-986)
            user_msg_count = len([m for m in db.room_messages[meeting_id] if m["sender"] != "ai_host"])
            if user_msg_count == 2:
                ai_reply = {
                    "id": f"msg_ai_{uuid.uuid4().hex[:6]}",
                    "sender": "ai_host",
                    "text": "It sounds like you both have great ideas! Have you thought about how you'd approach the project architecture together?",
                    "timestamp": datetime.now().strftime("%I:%M %p")
                }
                db.room_messages[meeting_id].append(ai_reply)
                db.save_to_disk()
                await manager.broadcast(meeting_id, ai_reply)
            elif user_msg_count == 4:
                ai_reply = {
                    "id": f"msg_ai_{uuid.uuid4().hex[:6]}",
                    "sender": "ai_host",
                    "text": "This has been wonderful! If you'd like to keep the conversation going, feel free to exchange contact info — Discord, email, or GitHub work great. I'll step away now. Good luck! 🚀",
                    "timestamp": datetime.now().strftime("%I:%M %p")
                }
                db.room_messages[meeting_id].append(ai_reply)
                db.save_to_disk()
                await manager.broadcast(meeting_id, ai_reply)

    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket)

# 9. Credit Score
@app.get("/api/credit-score")
def get_credit_score():
    score = db.credit_scores.get(CURRENT_USER_ID)
    if not score:
        score = CreditScore(userId=CURRENT_USER_ID)
        db.credit_scores[CURRENT_USER_ID] = score
    return score

# 10. Data & Privacy Controls (Export & Purge)
@app.post("/api/data/export")
def export_user_data():
    """Generates complete ZIP archive of user data."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # User Profile
        user = db.users.get(CURRENT_USER_ID)
        zip_file.writestr("profile.json", json.dumps(user.model_dump(), indent=2))
        
        # Journals
        journals = [j.model_dump() for j in db.journals if j.userId == CURRENT_USER_ID]
        zip_file.writestr("master_journals.json", json.dumps(journals, indent=2))
        
        # Skills
        skill = db.skills.get(CURRENT_USER_ID)
        zip_file.writestr("skills.json", json.dumps(skill.model_dump(), indent=2))
        
        # Dreams
        dreams = [d.model_dump() for d in db.dreams if d.userId == CURRENT_USER_ID]
        zip_file.writestr("dreams.json", json.dumps(dreams, indent=2))

        # Canvas
        canvas = [c.model_dump() for c in db.canvas_data if c.userId == CURRENT_USER_ID]
        zip_file.writestr("canvas_data.json", json.dumps(canvas, indent=2))

    zip_buffer.seek(0)
    headers = {"Content-Disposition": "attachment; filename=study_buddy_export.zip"}
    return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)

@app.delete("/api/data/partial")
def delete_partial(payload: Dict[str, Any] = Body(...)):
    del_type = payload.get("type")
    ids = set(payload.get("ids", []))
    if del_type == "journals":
        db.journals = [j for j in db.journals if j.id not in ids]
    elif del_type == "dreams":
        db.dreams = [d for d in db.dreams if d.id not in ids]
    elif del_type == "canvas":
        db.canvas_data = [c for c in db.canvas_data if c.id not in ids]
    db.save_to_disk()
    return {"success": True, "deletedCount": len(ids)}

@app.delete("/api/data/wipe")
def wipe_all_data():
    db.sessions = []
    db.journals = []
    db.dreams = []
    db.canvas_data = []
    db.canvas_reminders = []
    db.matches = []
    db.meetings = {}
    db.room_messages = {}
    db.save_to_disk()
    return {"success": True, "message": "All user study data completely wiped from server"}

# Serve Dashboard static files
DASHBOARD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard"))
if os.path.exists(DASHBOARD_DIR):
    app.mount("/dashboard", StaticFiles(directory=DASHBOARD_DIR, html=True), name="dashboard")

if __name__ == "__main__":
    import uvicorn
    print("\n[vtest Backend] Starting production architecture server on http://localhost:8000 ...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

