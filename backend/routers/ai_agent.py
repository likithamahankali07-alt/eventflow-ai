from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from config import settings
from db import supabase
from auth import get_current_user, AuthenticatedUser
import logging
import json

logger = logging.getLogger("eventflow.ai_agent")

router = APIRouter(prefix="/api/ai/agent", tags=["AI Operations Copilot"])

class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str

class AgentChatRequest(BaseModel):
    event_id: Optional[str] = None
    messages: List[ChatMessage]

# Tool 1: Get Event Summary
def get_event_summary_tool(event_id: str) -> str:
    """Tool to retrieve exact database statistics for an event including total registrations, capacity, check-in count, and average ratings."""
    if not supabase:
        return "Database unavailable."
    try:
        event_res = supabase.table("events").select("*").eq("id", event_id).execute()
        if not event_res.data:
            return f"No event found with ID {event_id}"
        event = event_res.data[0]
        reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        att_count = supabase.table("attendance").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        fb_res = supabase.table("feedback").select("overall_rating").eq("event_id", event_id).execute()
        fbs = fb_res.data or []
        avg_rating = round(sum(f["overall_rating"] for f in fbs) / len(fbs), 1) if fbs else 0.0

        return json.dumps({
            "event_name": event["name"],
            "event_type": event["event_type"],
            "date": event["date"],
            "venue": event["venue"],
            "capacity": event["capacity"],
            "total_registrations": reg_count,
            "checked_in_participants": att_count,
            "attendance_rate": f"{round((att_count / reg_count * 100), 1)}%" if reg_count > 0 else "0%",
            "feedback_response_count": len(fbs),
            "average_overall_rating": avg_rating
        })
    except Exception as e:
        return f"Error retrieving event summary: {e}"

# Tool 2: Get Demographics Breakdown
def get_participant_demographics_tool(event_id: str) -> str:
    """Tool to analyze registered participants' college, department/branch, and year distributions."""
    if not supabase:
        return "Database unavailable."
    try:
        res = supabase.table("registrations").select("participant_id, participants(college, branch, year)").eq("event_id", event_id).execute()
        regs = res.data or []
        if not regs:
            return "No registered participants yet for demographic breakdown."

        colleges = {}
        branches = {}
        years = {}

        for r in regs:
            p = r.get("participants") or {}
            c = p.get("college", "Unknown")
            b = p.get("branch", "Unknown")
            y = p.get("year", "Unknown")
            colleges[c] = colleges.get(c, 0) + 1
            branches[b] = branches.get(b, 0) + 1
            years[y] = years.get(y, 0) + 1

        return json.dumps({
            "total_participants": len(regs),
            "top_colleges": dict(sorted(colleges.items(), key=lambda x: x[1], reverse=True)[:5]),
            "branches": branches,
            "academic_years": years
        })
    except Exception as e:
        return f"Error analyzing demographics: {e}"

# Tool 3: Get Feedback Analysis
def get_feedback_analysis_tool(event_id: str) -> str:
    """Tool to aggregate ratings across overall, content, speaker, organization, hands-on, and summarize text responses."""
    if not supabase:
        return "Database unavailable."
    try:
        fb_res = supabase.table("feedback").select("*").eq("event_id", event_id).execute()
        feedbacks = fb_res.data or []
        if not feedbacks:
            return "No feedback responses submitted yet for this event."

        total = len(feedbacks)
        liked_comments = [f["liked"] for f in feedbacks if f.get("liked")]
        improvements = [f["improvement"] for f in feedbacks if f.get("improvement")]
        future_topics = [f["future_topic"] for f in feedbacks if f.get("future_topic")]

        return json.dumps({
            "total_responses": total,
            "average_scores": {
                "overall": round(sum(f["overall_rating"] for f in feedbacks) / total, 1),
                "content": round(sum(f["content_rating"] for f in feedbacks) / total, 1),
                "speaker": round(sum(f["speaker_rating"] for f in feedbacks) / total, 1),
                "organization": round(sum(f["organization_rating"] for f in feedbacks) / total, 1),
                "hands_on": round(sum(f["hands_on_rating"] for f in feedbacks) / total, 1)
            },
            "sample_highlights": liked_comments[:5],
            "sample_improvements": improvements[:5],
            "requested_topics": future_topics[:5]
        })
    except Exception as e:
        return f"Error retrieving feedback analysis: {e}"

@router.post("/chat")
def agent_chat(
    payload: AgentChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="No chat messages provided")

    user_prompt = payload.messages[-1].content
    event_id = payload.event_id

    # Fallback/Local AI response handler if GEMINI_API_KEY is not configured or in testing
    gemini_key = settings.GEMINI_API_KEY
    
    try:
        if gemini_key and gemini_key != "placeholder-gemini-key":
            from google import genai
            client = genai.Client(api_key=gemini_key)
            
            # Execute database tools locally based on context
            tool_context = ""
            if event_id and event_id != "undefined":
                summary_data = get_event_summary_tool(event_id)
                demo_data = get_participant_demographics_tool(event_id)
                fb_data = get_feedback_analysis_tool(event_id)
                tool_context = f"\n\nREAL EVENT DATABASE METRICS (Event ID: {event_id}):\nSummary: {summary_data}\nDemographics: {demo_data}\nFeedback: {fb_data}"

            sys_instruction = (
                "You are EventFlow AI Copilot, an expert Event Operations Intelligence Agent for college events, GDG chapters, and hackathons. "
                "You base all your answers strictly on real, accurate data retrieved from the event database. Never hallucinate or invent fake metrics. "
                "Provide concise, actionable, highly structured operational insights, marketing announcements, or check-in strategy recommendations."
                f"{tool_context}"
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config={"system_instruction": sys_instruction}
            )

            return {
                "reply": response.text,
                "agent_name": "EventFlow Gemini AI Agent"
            }
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")

    # Smart Rule-Based / Real DB Fallback Agent Response
    context_str = ""
    if event_id and event_id != "undefined":
        summary = get_event_summary_tool(event_id)
        context_str = f"Real Database Event Summary:\n{summary}"
    else:
        context_str = "No specific event selected. You can select an event from your dashboard to run specific AI analytics."

    fallback_reply = (
        f"🤖 **EventFlow Operations Assistant**\n\n"
        f"{context_str}\n\n"
        f"**Answer to your query ('{user_prompt[:80]}...'):**\n"
        f"Based on real-time database queries, your event metrics are currently live. "
        f"You can send announcements, check demographic representation across departments, or issue verified attendance certificates directly from the Command Center tabs."
    )

    return {
        "reply": fallback_reply,
        "agent_name": "EventFlow Operations Assistant"
    }
