"""
Pydantic Data Models for Ambient Study Commons Backend.
Adheres strictly to Section 2 Data Contracts.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SessionRequest(BaseModel):
    platform: str = Field(default="gemini", description="AI chat platform (gemini, chatgpt)")
    raw_text: str = Field(description="Raw recap or transcript from study session")
    course_context: Optional[str] = Field(default="CISP-310", description="Academic course code")
    active_ledger: Optional[Dict[str, Any]] = Field(default=None, description="Existing user skills ledger")

class SkillItem(BaseModel):
    name: str
    category: str
    confidence: str = Field(description="Beginner, Intermediate, or Advanced")
    evidence_snippet: str

class PassionItem(BaseModel):
    topic: str

class MasterJournal(BaseModel):
    date: str
    headline: str
    summary: str
    key_takeaways: List[str]
    tomorrow_focus: str
    session_count: int = 1

class SessionResponse(BaseModel):
    success: bool = True
    source: str = Field(description="gemini-2.0-flash or heuristic_fallback")
    master_journal: MasterJournal
    extracted_skills: List[SkillItem]
    areas_for_growth: List[str]
    detected_passions: List[PassionItem]

class MatchRequest(BaseModel):
    student_skills: List[str] = Field(default_factory=list)
    course_id: str = "CISP-310"
    active_assignment: Optional[str] = "lab_04"

class PeerMatchInfo(BaseModel):
    match_id: str
    peer_name: str
    peer_avatar: str
    course_id: str
    affinity_percentage: int
    shared_goal: str
    match_reason: str
    venue: str
    time_window: str

class MatchResponse(BaseModel):
    match_found: bool = True
    match: PeerMatchInfo

