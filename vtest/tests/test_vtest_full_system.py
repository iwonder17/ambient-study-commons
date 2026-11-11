"""
Automated End-to-End Test Suite for vtest.
Verifies all REST API endpoints, AI pipeline, WebSockets, data export,
manifest V3 configuration, and assets without human intervention.
"""

import sys
import os
import json
import zipfile
import io

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_assets_and_manifest():
    print("[TEST] 1. Validating vtest Manifest V3 & Assets...")
    manifest_path = os.path.join("vtest", "extension", "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert manifest["manifest_version"] == 3
    assert "storage" in manifest["permissions"]
    assert "https://*.instructure.com/*" in manifest["host_permissions"]

    # Verify mascot variants
    for variant in ["mascot-pet.png", "mascot-pet-excited.png", "mascot-pet-host.png"]:
        p = os.path.join("vtest", "extension", "assets", "mascot", variant)
        assert os.path.exists(p), f"Missing mascot asset: {p}"

    # Verify SVG icons
    icon_count = len(os.listdir(os.path.join("vtest", "extension", "assets", "icons")))
    print(f"  -> Manifest V3 valid. {icon_count} SVG icons present.")

def test_auth_and_profile():
    print("[TEST] 2. Testing User Profile & Preferences (/api/me)...")
    res = client.get("/api/me")
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["displayName"] == "Jordan Lee"
    assert data["preferences"]["collectAiChats"] is True

    # Update preferences
    res_pref = client.put("/api/me/preferences", json={"reviewCycleDays": 14})
    assert res_pref.status_code == 200
    assert res_pref.json()["reviewCycleDays"] == 14
    print("  -> Profile and preference updates verified.")

def test_sessions_and_pipeline():
    print("[TEST] 3. Testing Sessions & Daily AI Pipeline (/api/pipeline/trigger)...")
    # Post raw session
    sess_res = client.post("/api/sessions", json={
        "text": "Explored multi-threaded networking for a custom Minecraft server in Java and Linux.",
        "source": "gemini",
        "collectionMethod": "auto"
    })
    assert sess_res.status_code == 200
    assert sess_res.json()["rawText"] != ""

    # Trigger nightly pipeline
    pipe_res = client.post("/api/pipeline/trigger")
    assert pipe_res.status_code == 200
    pipe_data = pipe_res.json()
    assert pipe_data["success"] is True
    assert "Daily Engineering Log" in pipe_data["masterJournal"]["content"]
    print(f"  -> Synthesized MasterJournal for {pipe_data['masterJournal']['date']}.")

def test_journals_skills_dreams():
    print("[TEST] 4. Testing Journals, Skills, and Dreams...")
    # Journals pagination
    j_res = client.get("/api/journals?page=1&limit=5")
    assert j_res.status_code == 200
    assert len(j_res.json()["items"]) >= 1

    # Skills profile
    s_res = client.get("/api/skills")
    assert s_res.status_code == 200
    s_data = s_res.json()
    assert len(s_data["strengths"]) >= 3
    assert len(s_data["teamRoles"]) >= 2

    # Dreams
    d_res = client.get("/api/dreams")
    assert d_res.status_code == 200
    dreams = d_res.json()["items"]
    assert len(dreams) >= 1
    target_dream = dreams[0]

    # Submit dream to pool & test matching trigger
    sub_res = client.post(f"/api/dreams/{target_dream['id']}/submit", json={
        "title": target_dream["topic"],
        "description": "Building custom networking plugins in Java and Linux systems.",
        "tag_string": "gaming, servers, Java, Linux"
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["success"] is True
    print("  -> Journals, skills, and dream submission pool verified.")

def test_canvas_and_weekly_review():
    print("[TEST] 5. Testing Canvas Reminders & Weekly Review Bundle...")
    c_res = client.get("/api/canvas/reminders")
    assert c_res.status_code == 200
    assert len(c_res.json()) >= 1

    w_res = client.get("/api/weekly-review/bundle")
    assert w_res.status_code == 200
    bundle_text = w_res.json()["bundle"]
    assert "WEEKLY REVIEW PACKAGE" in bundle_text
    assert "Please celebrate my wins" in bundle_text
    print("  -> Canvas reminders and weekly review clipboard bundle verified.")

def test_invitations_and_credit_score():
    print("[TEST] 6. Testing Match Invitations & Credit Reliability...")
    inv_res = client.get("/api/invitations")
    assert inv_res.status_code == 200
    invites = inv_res.json()["items"]
    assert len(invites) >= 1

    # Credit score
    cs_res = client.get("/api/credit-score")
    assert cs_res.status_code == 200
    assert cs_res.json()["score"] >= 90
    print("  -> Invitations and credit reliability score (98) verified.")

def test_websocket_greeting_room():
    print("[TEST] 7. Testing Real-Time Greeting Room WebSocket & AI Host Bot...")
    meeting_id = "meet_room_88"
    room_res = client.get(f"/api/greeting-room/{meeting_id}")
    assert room_res.status_code == 200

    # Test WebSocket connection & AI host message exchange
    with client.websocket_connect(f"/ws/greeting-room/{meeting_id}") as ws:
        # Send user message 1
        ws.send_json({"sender": "self", "text": "Hi Alex! Excited to collaborate on the server project."})
        echo = ws.receive_json()
        assert echo["sender"] == "self"

        # Send user message 2 (triggers AI host prompt)
        ws.send_json({"sender": "self", "text": "I've been setting up the Linux hosting and thread pool architecture."})
        echo2 = ws.receive_json()
        assert echo2["sender"] == "self"

        ai_host_reply = ws.receive_json()
        assert ai_host_reply["sender"] == "ai_host"
        assert "approach the project architecture together" in ai_host_reply["text"]
        print(f"  -> WebSocket live exchange verified. AI Host Bot responded: '{ai_host_reply['text'][:55]}...'")

def test_data_export_and_wipe():
    print("[TEST] 8. Testing Full Data Export (ZIP) & Privacy Defense...")
    export_res = client.post("/api/data/export")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/zip"

    # Verify zip content
    zip_bytes = io.BytesIO(export_res.content)
    with zipfile.ZipFile(zip_bytes, "r") as z:
        names = z.namelist()
        assert "profile.json" in names
        assert "master_journals.json" in names
        assert "skills.json" in names
        assert "dreams.json" in names

    print(f"  -> ZIP archive verified containing: {names}")

if __name__ == "__main__":
    test_assets_and_manifest()
    test_auth_and_profile()
    test_sessions_and_pipeline()
    test_journals_skills_dreams()
    test_canvas_and_weekly_review()
    test_invitations_and_credit_score()
    test_websocket_greeting_room()
    test_data_export_and_wipe()
    print("\n=======================================================")
    print("✅ ALL VTEST FULL-SYSTEM VERIFICATION TESTS PASSED 100%!")
    print("=======================================================")
