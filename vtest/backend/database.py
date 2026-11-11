"""
In-Memory & File-Backed Persistent Database for vtest.
Pre-seeded with rich, realistic data conforming to programDescribeDetail.txt.
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from models import (
    UserAccount, UserPreferences, FreeTimeSlot, SessionRecord, MasterJournal,
    UserSkill, UserDream, CanvasData, CanvasReminder, DreamPoolEntry,
    MatchRecord, Meeting, CreditScore, CreditEvent
)

DB_FILE = os.path.join(os.path.dirname(__file__), "vtest_db.json")

class Database:
    def __init__(self):
        self.users: Dict[str, UserAccount] = {}
        self.preferences: Dict[str, UserPreferences] = {}
        self.freetime: Dict[str, List[FreeTimeSlot]] = {}
        self.sessions: List[SessionRecord] = []
        self.journals: List[MasterJournal] = []
        self.skills: Dict[str, UserSkill] = {}
        self.dreams: List[UserDream] = []
        self.canvas_data: List[CanvasData] = []
        self.canvas_reminders: List[CanvasReminder] = []
        self.dream_pool: List[DreamPoolEntry] = []
        self.matches: List[MatchRecord] = []
        self.meetings: Dict[str, Meeting] = {}
        self.credit_scores: Dict[str, CreditScore] = {}
        self.room_messages: Dict[str, List[Dict[str, Any]]] = {}

        if os.path.exists(DB_FILE):
            try:
                self.load_from_disk()
            except Exception as e:
                print(f"[DB] Error loading DB file, re-seeding: {e}")
                self.seed_defaults()
        else:
            self.seed_defaults()
            self.save_to_disk()

    def seed_defaults(self):
        uid = "user_jordan_101"
        peer_id = "user_alex_202"

        # User Account
        self.users[uid] = UserAccount(
            id=uid,
            email="jordan.lee@crc.losrios.edu",
            displayName="Jordan Lee",
            avatarUrl="/assets/mascot/mascot-pet.png",
            googleId="goog_1092837412",
            authToken="jwt_demo_token_asc_2026",
            createdAt=datetime.now().isoformat()
        )

        self.users[peer_id] = UserAccount(
            id=peer_id,
            email="alex.rivera@crc.losrios.edu",
            displayName="Alex Rivera",
            avatarUrl="/assets/mascot/mascot-pet-excited.png",
            googleId="goog_9928381721",
            authToken="jwt_demo_peer_token",
            createdAt=datetime.now().isoformat()
        )

        # Preferences
        self.preferences[uid] = UserPreferences(
            userId=uid,
            collectAiChats=True,
            collectCanvasModules=True,
            collectCanvasGrades=True,
            collectCanvasSyllabi=True,
            collectCanvasEvents=True,
            reviewCycleDays=7,
            updatedAt=datetime.now().isoformat()
        )

        # Free Time Slots (Mon-Sun)
        days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        slots = []
        for d in days:
            slots.append(FreeTimeSlot(userId=uid, dayOfWeek=d, timeBlock="MORNING", isAvailable=d in ["SAT", "SUN"]))
            slots.append(FreeTimeSlot(userId=uid, dayOfWeek=d, timeBlock="AFTERNOON", isAvailable=d in ["TUE", "THU", "SAT"]))
            slots.append(FreeTimeSlot(userId=uid, dayOfWeek=d, timeBlock="EVENING", isAvailable=True))
        self.freetime[uid] = slots

        # Raw Sessions
        self.sessions = [
            SessionRecord(
                id="sess_01",
                userId=uid,
                rawText="Debugging segmentation fault in x86-64 recursive factorial subroutine. Discovered System V AMD64 ABI enforces 16-byte stack boundary alignment before call instructions.",
                source="gemini",
                collectionMethod="auto",
                timestamp=(datetime.now() - timedelta(hours=2)).isoformat(),
                createdAt=datetime.now().isoformat()
            ),
            SessionRecord(
                id="sess_02",
                userId=uid,
                rawText="Discussed setting up a high-performance Minecraft server in Java with PaperMC plugins and custom networking thread pools.",
                source="chatgpt",
                collectionMethod="manual",
                timestamp=(datetime.now() - timedelta(days=1)).isoformat(),
                createdAt=datetime.now().isoformat()
            )
        ]

        # Master Journals (Multiple days for pagination test)
        for i in range(5):
            d = datetime.now() - timedelta(days=i)
            self.journals.append(MasterJournal(
                id=f"jour_{i+1}",
                userId=uid,
                date=d.strftime("%Y-%m-%d"),
                content=(
                    f"Day {i+1} Reflections: Deep dive into Assembly architecture and system calls. "
                    "Overcame memory corruption traps and solidified register discipline (%rbx, %r12-%r15). "
                    "Productive pair review on system software design."
                ),
                highlights="Mastered caller-saved vs callee-saved registers under GDB disassembly layout.",
                improvements="Dedicate more focus to automated buffer bounds verification.",
                sessionCount=2 if i == 0 else 3,
                createdAt=d.isoformat(),
                updatedAt=d.isoformat()
            ))

        # UserSkill
        self.skills[uid] = UserSkill(
            userId=uid,
            strengths=["Problem Solving", "x86-64 Assembly", "Python", "gdb Debugging", "Leadership"],
            weaknesses=["Time Management", "Public Speaking", "Floating-point SSE/AVX registers"],
            teamRoles=["Debugger", "System Architect", "Idea Generator"],
            experience=["Python", "Linux Systems", "x86 Assembly", "Minecraft Server Plugins"],
            mindset="Methodical, systems-first thinker who thrives when inspecting low-level mechanics and solving root-cause bugs.",
            characterAnalysis="Resilient problem solver with a collaborative nature. Eager to master difficult technical concepts and share debugging patterns with peers.",
            updatedAt=datetime.now().isoformat()
        )

        # UserDreams
        self.dreams = [
            UserDream(
                id="dream_01",
                userId=uid,
                topic="Setup Minecraft Server & Networking",
                mentionCount=30,
                recentTimestamps=[(datetime.now() - timedelta(days=x)).strftime("%b %d") for x in range(8)],
                firstMentioned="2026-10-15",
                lastMentioned="2026-11-10",
                status="tracking"
            ),
            UserDream(
                id="dream_02",
                userId=uid,
                topic="Bare-Metal OS & Kernel Emulation",
                mentionCount=12,
                recentTimestamps=[(datetime.now() - timedelta(days=x*2)).strftime("%b %d") for x in range(5)],
                firstMentioned="2026-10-28",
                lastMentioned="2026-11-09",
                status="tracking"
            )
        ]

        # Canvas Reminders
        now = datetime.now()
        self.canvas_reminders = [
            CanvasReminder(
                id="rem_01",
                userId=uid,
                title="CISP 310 Lab 4: Stack Alignment & Subroutines",
                type="assignment",
                dueDate=(now + timedelta(hours=36)).strftime("%b %d, %Y at 11:59 PM"),
                courseName="CISP 310 - Assembly Language & Architecture",
                isNotified=False,
                createdAt=now.isoformat()
            ),
            CanvasReminder(
                id="rem_02",
                userId=uid,
                title="CISP 400 HW 3: Smart Pointers & Custom Allocators",
                type="assignment",
                dueDate=(now + timedelta(days=4)).strftime("%b %d, %Y at 11:59 PM"),
                courseName="CISP 400 - Object-Oriented Programming with C++",
                isNotified=False,
                createdAt=now.isoformat()
            ),
            CanvasReminder(
                id="rem_03",
                userId=uid,
                title="CISP 310 Midterm Architecture Exam",
                type="exam",
                dueDate=(now + timedelta(days=6)).strftime("%b %d, %Y at 2:00 PM"),
                courseName="CISP 310 - Assembly Language & Architecture",
                isNotified=False,
                createdAt=now.isoformat()
            )
        ]

        # Dream Pool & Matches
        pool_entry = DreamPoolEntry(
            id="pool_01",
            submittedByUserId=peer_id,
            title="Building a Minecraft Server & Network Plugins",
            description="Looking for a collaborator who knows Java/backend performance or Linux hosting to build a server network.",
            tags=["gaming", "servers", "multiplayer", "Java", "Linux"],
            sourceType="user_dream",
            status="active",
            createdAt=(now - timedelta(days=1)).isoformat()
        )
        self.dream_pool.append(pool_entry)

        meeting_id = "meet_room_88"
        match_id = "match_01"
        self.matches = [
            MatchRecord(
                id=match_id,
                userIdA=uid,
                userIdB=peer_id,
                dreamPoolEntryId="pool_01",
                matchedDreamTopics=["Setup Minecraft Server & Networking"],
                similarityScore=0.94,
                skillComplementNotes="Alex has deep Java plugin experience, while Jordan excels in Linux systems debugging and memory optimization.",
                status="accepted",
                respondedA="accepted",
                respondedB="accepted",
                suggestedGreetingTime="Sat Nov 15, 3:00 PM",
                createdAt=(now - timedelta(hours=5)).isoformat()
            )
        ]

        self.meetings[meeting_id] = Meeting(
            id=meeting_id,
            matchId=match_id,
            scheduledAt="Sat Nov 15, 3:00 PM",
            userIdA=uid,
            userIdB=peer_id,
            confirmedA=True,
            confirmedB=True,
            roomStatus="active",
            topic="Building a Minecraft Server & Network Plugins",
            createdAt=now.isoformat()
        )

        # Pre-seed Greeting Room Scripted Messages
        self.room_messages[meeting_id] = [
            {
                "id": "msg_01",
                "sender": "ai_host",
                "text": "Welcome Jordan and Alex! I'm excited to introduce you both. 🎉",
                "timestamp": "3:00 PM"
            },
            {
                "id": "msg_02",
                "sender": "ai_host",
                "text": "You both share an interest in Building a Minecraft Server & Network Plugins! Jordan, would you like to start by sharing what you've explored so far?",
                "timestamp": "3:01 PM"
            }
        ]

        # Credit Score
        self.credit_scores[uid] = CreditScore(
            userId=uid,
            score=98,
            totalMeetingsScheduled=5,
            totalMeetingsAttended=5,
            totalNoShows=0,
            history=[
                CreditEvent(
                    id="ce_01",
                    userId=uid,
                    meetingId="meet_prev_01",
                    eventType="attended",
                    pointChange=1,
                    newScore=98,
                    createdAt=(now - timedelta(days=7)).isoformat()
                )
            ]
        )

    def save_to_disk(self):
        data = {
            "users": {k: v.model_dump() for k, v in self.users.items()},
            "preferences": {k: v.model_dump() for k, v in self.preferences.items()},
            "freetime": {k: [s.model_dump() for s in v] for k, v in self.freetime.items()},
            "sessions": [s.model_dump() for s in self.sessions],
            "journals": [j.model_dump() for j in self.journals],
            "skills": {k: v.model_dump() for k, v in self.skills.items()},
            "dreams": [d.model_dump() for d in self.dreams],
            "canvas_data": [c.model_dump() for c in self.canvas_data],
            "canvas_reminders": [r.model_dump() for r in self.canvas_reminders],
            "dream_pool": [p.model_dump() for p in self.dream_pool],
            "matches": [m.model_dump() for m in self.matches],
            "meetings": {k: v.model_dump() for k, v in self.meetings.items()},
            "credit_scores": {k: v.model_dump() for k, v in self.credit_scores.items()},
            "room_messages": self.room_messages
        }
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_from_disk(self):
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.users = {k: UserAccount(**v) for k, v in data.get("users", {}).items()}
        self.preferences = {k: UserPreferences(**v) for k, v in data.get("preferences", {}).items()}
        self.freetime = {k: [FreeTimeSlot(**s) for s in v] for k, v in data.get("freetime", {}).items()}
        self.sessions = [SessionRecord(**s) for s in data.get("sessions", [])]
        self.journals = [MasterJournal(**j) for j in data.get("journals", [])]
        self.skills = {k: UserSkill(**v) for k, v in data.get("skills", {}).items()}
        self.dreams = [UserDream(**d) for d in data.get("dreams", [])]
        self.canvas_data = [CanvasData(**c) for c in data.get("canvas_data", [])]
        self.canvas_reminders = [CanvasReminder(**r) for r in data.get("canvas_reminders", [])]
        self.dream_pool = [DreamPoolEntry(**p) for p in data.get("dream_pool", [])]
        self.matches = [MatchRecord(**m) for m in data.get("matches", [])]
        self.meetings = {k: Meeting(**v) for k, v in data.get("meetings", {}).items()}
        self.credit_scores = {k: CreditScore(**v) for k, v in data.get("credit_scores", {}).items()}
        self.room_messages = data.get("room_messages", {})

db = Database()

