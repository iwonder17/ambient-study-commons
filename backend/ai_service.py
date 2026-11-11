"""
AI Synthesis Service calling Google Gemini 2.0 API with graceful heuristic fallback.
"""

import os
import json
from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from models import SessionRequest, SessionResponse, MasterJournal, SkillItem, PassionItem
from heuristic_fallback import heuristic_parse_session

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def synthesize_session_with_gemini(req: SessionRequest) -> SessionResponse:
    """
    Attempts to call Gemini 2.0 Flash to synthesize study session into a Master Journal and extract skills.
    Falls back gracefully to the deterministic heuristic engine if key is absent or network fails.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        print("[ASC AI Service] No valid GEMINI_API_KEY detected. Using resilient heuristic fallback.")
        return heuristic_parse_session(req.raw_text, req.course_context or "CISP-310")

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        
        system_instruction = (
            "You are the Ambient Study Commons AI engine. Your goal is to analyze a student's raw study recap, "
            "synthesize a concise master journal, extract demonstrated technical competencies with evidence, "
            "identify areas for growth, and detect recurring passion or dream projects. "
            "You MUST respond ONLY with valid JSON matching this exact structure: "
            "{\n"
            '  "master_journal": {\n'
            '    "date": "YYYY-MM-DD",\n'
            '    "headline": "Short punchy accomplishment headline",\n'
            '    "summary": "2-3 sentence overview of what was learned and debugged",\n'
            '    "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],\n'
            '    "tomorrow_focus": "Specific next study target",\n'
            '    "session_count": 2\n'
            "  },\n"
            '  "extracted_skills": [\n'
            '    {"name": "Skill Name", "category": "Category", "confidence": "Intermediate", "evidence_snippet": "Why"}\n'
            "  ],\n"
            '  "areas_for_growth": ["concept to review 1", "concept to review 2"],\n'
            '  "detected_passions": [{"topic": "Long term interest or dream project"}]\n'
            "}"
        )

        user_prompt = (
            f"Course Context: {req.course_context}\n"
            f"Platform: {req.platform}\n"
            f"Study Session Recap:\n{req.raw_text}"
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        parsed = json.loads(response.text)
        
        # Convert into Pydantic models
        journal_dict = parsed.get("master_journal", {})
        journal = MasterJournal(
            date=journal_dict.get("date", datetime.now().strftime("%Y-%m-%d")),
            headline=journal_dict.get("headline", "Study Session Completed"),
            summary=journal_dict.get("summary", "Session analyzed by Gemini 2.0 Flash."),
            key_takeaways=journal_dict.get("key_takeaways", ["Continuous learning in progress."]),
            tomorrow_focus=journal_dict.get("tomorrow_focus", "Continue core coursework."),
            session_count=journal_dict.get("session_count", 2)
        )

        skills = [
            SkillItem(
                name=s.get("name", "Technical Concept"),
                category=s.get("category", "General"),
                confidence=s.get("confidence", "Intermediate"),
                evidence_snippet=s.get("evidence_snippet", "Demonstrated in session.")
            )
            for s in parsed.get("extracted_skills", [])
        ]

        passions = [
            PassionItem(topic=p.get("topic", "Systems Engineering"))
            for p in parsed.get("detected_passions", [])
        ]

        return SessionResponse(
            success=True,
            source="gemini-2.0-flash",
            master_journal=journal,
            extracted_skills=skills if skills else [SkillItem(name="x86-64 Assembly", category="Systems", confidence="Advanced", evidence_snippet="Extracted from session.")],
            areas_for_growth=parsed.get("areas_for_growth", ["Stack pointer alignment"]),
            detected_passions=passions if passions else [PassionItem(topic="Bare-Metal OS & Kernel Emulation")]
        )

    except Exception as e:
        print(f"[ASC AI Service] Gemini API call encountered exception: {e}. Falling back to deterministic engine.")
        return heuristic_parse_session(req.raw_text, req.course_context or "CISP-310")
