"""
vtest Backend Pydantic Data Models.
Reflects data objects defined in programDescribeDetail.txt lines 88-115, 296-305, 335-387, 891-902, 929-953, 1014-1032.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# 1. Onboarding & Accounts
class UserAccount(BaseModel):
    id: str
    email: str
    displayName: str
    avatarUrl: str
    googleId: str
    authToken: str
    createdAt: str

class UserPreferences(BaseModel):
    userId: str
    collectAiChats: bool = True
    collectCanvasModules: bool = True
    collectCanvasGrades: bool = True
    collectCanvasSyllabi: bool = True
    collectCanvasEvents: bool = True
    reviewCycleDays: int = 7
    updatedAt: str

class FreeTimeSlot(BaseModel):
    userId: str
    dayOfWeek: Literal["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    timeBlock: Literal["MORNING", "AFTERNOON", "EVENING"]
    isAvailable: bool

# 2. Raw Sessions & Master Journal
class SessionRecord(BaseModel):
    id: str
    userId: str
    rawText: str
    source: Literal["gemini", "chatgpt"] = "gemini"
    collectionMethod: Literal["auto", "manual"] = "auto"
    timestamp: str
    createdAt: str

class MasterJournal(BaseModel):
    id: str
    userId: str
    date: str # YYYY-MM-DD
    content: str
    highlights: str
    improvements: str
    sessionCount: int = 1
    createdAt: str
    updatedAt: str

# 3. User Skill & User Dream
class UserSkill(BaseModel):
    userId: str
    strengths: List[str]
    weaknesses: List[str]
    teamRoles: List[str]
    experience: List[str]
    mindset: str
    characterAnalysis: str
    updatedAt: str

class UserDream(BaseModel):
    id: str
    userId: str
    topic: str
    mentionCount: int = 1
    recentTimestamps: List[str]
    firstMentioned: str
    lastMentioned: str
    status: Literal["tracking", "submitted_to_pool", "matched"] = "tracking"

# 4. Canvas Data & Reminders
class CanvasData(BaseModel):
    id: str
    userId: str
    dataType: Literal["modules", "grades", "syllabi", "events"]
    content: Any
    scrapedAt: str

class CanvasReminder(BaseModel):
    id: str
    userId: str
    title: str
    type: Literal["assignment", "exam", "event"]
    dueDate: str
    courseName: str
    isNotified: bool = False
    createdAt: str

# 5. Dream Pool, Matching, Meetings
class DreamPoolEntry(BaseModel):
    id: str
    submittedByUserId: str
    title: str
    description: str
    tags: List[str]
    sourceType: Literal["user_dream", "hackathon", "campus_event"] = "user_dream"
    status: Literal["active", "matched", "expired", "archived"] = "active"
    createdAt: str
    expiresAt: Optional[str] = None

class MatchRecord(BaseModel):
    id: str
    userIdA: str
    userIdB: str
    dreamPoolEntryId: Optional[str] = None
    matchedDreamTopics: List[str]
    similarityScore: float = 0.94
    skillComplementNotes: str
    status: Literal["pending_a", "pending_b", "pending_both", "accepted", "declined", "scheduled", "completed", "no_show"] = "pending_both"
    respondedA: Literal["pending", "accepted", "declined"] = "accepted"
    respondedB: Literal["pending", "accepted", "declined"] = "pending"
    suggestedGreetingTime: str = "Sat Nov 15, 3:00 PM"
    createdAt: str

class Meeting(BaseModel):
    id: str
    matchId: str
    scheduledAt: str
    userIdA: str
    userIdB: str
    confirmedA: bool = False
    confirmedB: bool = False
    roomStatus: Literal["waiting", "active", "completed", "cancelled"] = "active"
    topic: str = "Systems Programming & Lab 4"
    createdAt: str

# 6. Credit Score & Attendance
class CreditEvent(BaseModel):
    id: str
    userId: str
    meetingId: Optional[str] = None
    eventType: Literal["attended", "no_show", "bonus"]
    pointChange: int
    newScore: int
    createdAt: str

class CreditScore(BaseModel):
    userId: str
    score: int = 98
    totalMeetingsScheduled: int = 5
    totalMeetingsAttended: int = 5
    totalNoShows: int = 0
    history: List[CreditEvent] = []
