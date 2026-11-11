"""
Ambient Study Commons - FastAPI Server
Minimal, rock-solid AI backend providing /api/session and /api/match.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SessionRequest, SessionResponse, MatchRequest, MatchResponse
from ai_service import synthesize_session_with_gemini
from heuristic_fallback import heuristic_peer_match

app = FastAPI(
    title="Ambient Study Commons API",
    description="Local-First Study Journal Synthesis & Peer Matching Backend",
    version="1.0.0"
)

# Enable CORS for Chrome Extension origins and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Ambient Study Commons AI Backend",
        "version": "1.0.0",
        "endpoints": ["/api/session", "/api/match", "/health"]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Ambient Study Commons"}

@app.post("/api/session", response_model=SessionResponse)
def handle_session(request: SessionRequest):
    """
    Synthesize raw AI chat session into a structured Master Journal and extract skills.
    Uses Gemini 2.0 Flash or deterministic heuristic fallback.
    """
    try:
        response = synthesize_session_with_gemini(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match", response_model=MatchResponse)
def handle_match(request: MatchRequest):
    """
    Compute affinity and return actionable peer match invitation.
    """
    try:
        return heuristic_peer_match(request.student_skills, request.course_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("\n[Ambient Study Commons] Starting server on http://localhost:8000 ...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
