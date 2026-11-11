"""
Automated Backend & Pipeline Test Suite.
Tests FastAPI endpoints, schema parsing, and deterministic fallback without human interaction.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from fastapi.testclient import TestClient
from main import app
from models import SessionResponse, MatchResponse

client = TestClient(app)

def test_health():
    print("[TEST] Testing GET /health...")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("  -> Health endpoint returned 200 OK.")

def test_session_synthesis():
    print("[TEST] Testing POST /api/session...")
    payload = {
        "platform": "gemini",
        "raw_text": (
            "I was working on CISP 310 Lab 4 trying to implement recursive subroutine calls in NASM. "
            "I kept getting segfaults on Ubuntu inside printf. Gemini explained that System V AMD64 ABI "
            "requires %rsp to be a multiple of 16 right before calling any external function. "
            "After pushing %rbp, I had to align with 'sub rsp, 8'. We also stepped through gdb with 'x/20gx $rsp'."
        ),
        "course_context": "CISP-310"
    }
    response = client.post("/api/session", json=payload)
    assert response.status_code == 200, f"Failed with status {response.status_code}: {response.text}"
    
    data = response.json()
    # Validate with Pydantic model
    validated = SessionResponse(**data)
    assert validated.success is True
    assert validated.master_journal.date is not None
    assert len(validated.master_journal.key_takeaways) >= 2
    assert len(validated.extracted_skills) >= 1
    
    # Check that x86 or gdb was extracted
    skill_names = [s.name for s in validated.extracted_skills]
    print(f"  -> Extracted Skills: {skill_names}")
    assert any("x86" in s or "Assembly" in s for s in skill_names), "Assembly skill should be extracted"
    print("  -> POST /api/session returned valid, structured SessionResponse.")

def test_peer_matching():
    print("[TEST] Testing POST /api/match...")
    payload = {
        "student_skills": ["x86-64 Assembly", "gdb Disassembly & Inspection"],
        "course_id": "CISP-310",
        "active_assignment": "lab_04"
    }
    response = client.post("/api/match", json=payload)
    assert response.status_code == 200, f"Failed with status {response.status_code}: {response.text}"

    data = response.json()
    validated = MatchResponse(**data)
    assert validated.match_found is True
    assert validated.match.peer_name == "Alex Rivera"
    assert validated.match.affinity_percentage >= 90
    assert "MESA Center" in validated.match.venue
    print(f"  -> Match result: {validated.match.peer_name} ({validated.match.affinity_percentage}% affinity) at {validated.match.venue}")
    print("  -> POST /api/match returned 200 OK with valid MatchResponse.")

if __name__ == "__main__":
    test_health()
    test_session_synthesis()
    test_peer_matching()
    print("\n✅ ALL BACKEND & PIPELINE TESTS PASSED WITH 100% SUCCESS!")

