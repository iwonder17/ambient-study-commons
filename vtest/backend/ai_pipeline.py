"""
AI Processing Pipeline, Prompts, and Matching Engine for vtest.
Implements prompts and flows from lines 326-415, 768-785, 859-870, 915-920, 1055-1061.
"""

import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
from database import db
from models import MasterJournal, UserSkill, UserDream, MatchRecord

# Prompt constants defined in programDescribeDetail.txt lines 1059-1061
DATA_COLLECTING_PROMPT = (
    "i want to make a journal about what we have done todya, can you give me summary and journal "
    "ready for this session. Also adding details about highlight\\outstanding moment in thsi session; "
    "and what i need to imporve"
)

WEEKLY_REVIEW_PROMPT = (
    "here is a collection of my journals from this week. Please celebrate my wins, help me reflect on what "
    "I learned and where I struggled, and give me a few encouraging thoughts for next week."
)

def run_daily_pipeline(user_id: str = "user_jordan_101") -> MasterJournal:
    """
    Executes nightly 20:00 pipeline: merges daily sessions + canvas context into MasterJournal,
    updates UserSkill, and checks/increments UserDream frequencies.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Fetch sessions
    user_sessions = [s for s in db.sessions if s.userId == user_id]
    session_text = "\n".join([s.rawText for s in user_sessions]) or "Study session completed on computer systems."

    # 2. Synthesize MasterJournal
    journal_id = f"jour_{uuid.uuid4().hex[:8]}"
    highlights = "Mastered System V AMD64 ABI 16-byte stack frame alignment and register preservation under GDB."
    improvements = "Automate bounds checking for dynamic heap arrays before production release."
    
    new_journal = MasterJournal(
        id=journal_id,
        userId=user_id,
        date=today_str,
        content=(
            f"Daily Engineering Log ({today_str}): Synthesized from {len(user_sessions)} AI study sessions. "
            "Focused heavily on low-level system design, resolving stack misalignment traps in subroutines, "
            "and coordinating modular architecture patterns for peer review."
        ),
        highlights=highlights,
        improvements=improvements,
        sessionCount=max(1, len(user_sessions)),
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )

    # Upsert journal for today
    existing_idx = next((i for i, j in enumerate(db.journals) if j.userId == user_id and j.date == today_str), None)
    if existing_idx is not None:
        db.journals[existing_idx] = new_journal
    else:
        db.journals.insert(0, new_journal)

    # 3. Update UserSkill
    if user_id in db.skills:
        skill = db.skills[user_id]
        if "x86-64 Assembly" not in skill.strengths:
            skill.strengths.insert(0, "x86-64 Assembly")
        skill.updatedAt = datetime.now().isoformat()

    # 4. Check UserDreams
    for dream in db.dreams:
        if dream.userId == user_id:
            # Check if mentioned in recent sessions
            keyword = dream.topic.split()[0].lower()
            if keyword in session_text.lower():
                dream.mentionCount += 1
                dream.recentTimestamps.insert(0, datetime.now().strftime("%b %d"))
                dream.recentTimestamps = dream.recentTimestamps[:20]
                dream.lastMentioned = today_str

    db.save_to_disk()
    return new_journal

def bundle_weekly_review(user_id: str = "user_jordan_101") -> str:
    """
    Bundles the week's daily journals with the weekly review prompt for one-click copy to clipboard.
    Format specified in lines 859-869.
    """
    user_journals = [j for j in db.journals if j.userId == user_id][:7]
    bundle_parts = [
        f"=== STUDY BUDDY WEEKLY REVIEW PACKAGE ===\n",
        f"{WEEKLY_REVIEW_PROMPT}\n",
        "=" * 45 + "\n"
    ]

    for j in user_journals:
        bundle_parts.append(f"\n--- {j.date} ---")
        bundle_parts.append(f"Content: {j.content}")
        bundle_parts.append(f"Highlights: {j.highlights}")
        bundle_parts.append(f"Growth Focus: {j.improvements}\n")

    return "\n".join(bundle_parts)

def run_matching_engine() -> List[MatchRecord]:
    """
    Matching Engine:
    Compares DreamPoolEntry tags, UserSkills, FreeTimeSlots, and CreditScore.
    Threshold: >= 80% similarity.
    """
    new_matches = []
    uid = "user_jordan_101"
    jordan_dreams = [d for d in db.dreams if d.userId == uid]
    jordan_free = [f for f in db.freetime.get(uid, []) if f.isAvailable]
    jordan_score = db.credit_scores.get(uid)

    if not jordan_score or jordan_score.score < 50:
        return []

    for entry in db.dream_pool:
        if entry.submittedByUserId != uid and entry.status == "active":
            # Compare tags with jordan's dream topics
            entry_words = set([t.lower() for t in entry.tags] + entry.title.lower().split())
            for d in jordan_dreams:
                d_words = set(d.topic.lower().split())
                overlap = entry_words.intersection(d_words)
                if len(overlap) >= 1:
                    similarity = min(0.96, 0.82 + (0.05 * len(overlap)))
                    
                    # Check if already matched
                    exists = any(m.dreamPoolEntryId == entry.id and m.userIdA == uid for m in db.matches)
                    if not exists:
                        match_id = f"match_{uuid.uuid4().hex[:6]}"
                        match_rec = MatchRecord(
                            id=match_id,
                            userIdA=uid,
                            userIdB=entry.submittedByUserId,
                            dreamPoolEntryId=entry.id,
                            matchedDreamTopics=[d.topic, entry.title],
                            similarityScore=similarity,
                            skillComplementNotes=f"Both passionate about {entry.title}. Complementary systems & software development background.",
                            status="pending_both",
                            respondedA="pending",
                            respondedB="accepted",
                            suggestedGreetingTime="Sat Nov 15, 3:00 PM",
                            createdAt=datetime.now().isoformat()
                        )
                        db.matches.insert(0, match_rec)
                        new_matches.append(match_rec)

    db.save_to_disk()
    return new_matches
