from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from config import settings
from db import supabase
from auth import get_current_user, AuthenticatedUser
import logging
import json
import uuid

logger = logging.getLogger("eventflow.ai_agent")

router = APIRouter(prefix="/api/ai/agent", tags=["AI Agent Workspace"])

class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str

class AgentChatRequest(BaseModel):
    event_id: str
    messages: List[ChatMessage]

class ConfirmActionRequest(BaseModel):
    event_id: str
    action_type: str
    params: Dict[str, Any] = {}

# ----------------------------------------------------
# 1. READ TOOLS
# ----------------------------------------------------

def get_event(event_id: str) -> str:
    """Tool: Retrieves basic details, schedule, venue, capacity, and status for a given event ID."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("events").select("*").eq("id", event_id).execute()
        if not res.data:
            return json.dumps({"error": f"No event found with ID '{event_id}'"})
        return json.dumps(res.data[0])
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_registration_statistics(event_id: str) -> str:
    """Tool: Calculates total registration count, capacity, spots remaining, and registration status distribution."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        evt_res = supabase.table("events").select("capacity, name").eq("id", event_id).execute()
        if not evt_res.data:
            return json.dumps({"error": "Event not found"})
        capacity = evt_res.data[0]["capacity"]

        reg_res = supabase.table("registrations").select("id, registration_status", count="exact").eq("event_id", event_id).execute()
        total_regs = reg_res.count or 0

        return json.dumps({
            "event_id": event_id,
            "event_name": evt_res.data[0]["name"],
            "total_registrations": total_regs,
            "capacity": capacity,
            "spots_remaining": max(0, capacity - total_regs),
            "is_full": total_regs >= capacity
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def search_participants(event_id: str, query: str = "", college: str = "", branch: str = "", year: str = "") -> str:
    """Tool: Searches and filters registered participants by query string, college, branch, or academic year."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("registrations").select("participant_id, registered_at, participants(name, email, phone, college, branch, year, student_id)").eq("event_id", event_id).execute()
        regs = res.data or []
        
        matches = []
        for r in regs:
            p = r.get("participants") or {}
            name = p.get("name", "")
            email = p.get("email", "")
            p_college = p.get("college", "")
            p_branch = p.get("branch", "")
            p_year = p.get("year", "")

            # Filter checks
            if query and not (query.lower() in name.lower() or query.lower() in email.lower() or query.lower() in p_college.lower()):
                continue
            if college and college.lower() not in p_college.lower():
                continue
            if branch and branch.lower() not in p_branch.lower():
                continue
            if year and year.lower() not in p_year.lower():
                continue

            matches.append({
                "participant_id": r["participant_id"],
                "name": name,
                "email": email,
                "college": p_college,
                "branch": p_branch,
                "year": p_year,
                "registered_at": r["registered_at"]
            })

        return json.dumps({
            "matched_count": len(matches),
            "participants": matches
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_attendance_statistics(event_id: str) -> str:
    """Tool: Calculates check-in count, absent count, and attendance percentage rate from actual attendance records."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        att_count = supabase.table("attendance").select("id", count="exact").eq("event_id", event_id).execute().count or 0

        rate = round((att_count / reg_count * 100), 1) if reg_count > 0 else 0.0

        return json.dumps({
            "total_registrations": reg_count,
            "checked_in_present": att_count,
            "absent_count": max(0, reg_count - att_count),
            "attendance_rate_percentage": f"{rate}%"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def find_absentees(event_id: str) -> str:
    """Tool: Identifies all registered participants who have NOT yet checked in for the event."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        # Get registered participant IDs
        regs_res = supabase.table("registrations").select("participant_id, registration_token, participants(name, email, college, branch, phone)").eq("event_id", event_id).execute()
        regs = regs_res.data or []

        # Get checked in participant IDs
        att_res = supabase.table("attendance").select("participant_id").eq("event_id", event_id).execute()
        checked_in_pids = set(a["participant_id"] for a in (att_res.data or []))

        absentees = []
        for r in regs:
            pid = r["participant_id"]
            if pid not in checked_in_pids:
                p = r.get("participants") or {}
                absentees.append({
                    "participant_id": pid,
                    "name": p.get("name", "Unknown"),
                    "email": p.get("email", ""),
                    "college": p.get("college", ""),
                    "branch": p.get("branch", ""),
                    "phone": p.get("phone", ""),
                    "registration_token": r.get("registration_token", "")
                })

        return json.dumps({
            "total_absentees": len(absentees),
            "absentees": absentees
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_feedback(event_id: str) -> str:
    """Tool: Retrieves actual attendee feedback submissions text, liked points, and suggested improvements."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("feedback").select("*").eq("event_id", event_id).order("submitted_at", desc=True).execute()
        feedbacks = res.data or []
        return json.dumps({
            "total_feedback_count": len(feedbacks),
            "feedback_records": feedbacks
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_feedback_statistics(event_id: str) -> str:
    """Tool: Calculates category rating averages (overall, content, speaker, organization, hands-on) and 1-5 star distributions."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("feedback").select("overall_rating, content_rating, speaker_rating, organization_rating, hands_on_rating").eq("event_id", event_id).execute()
        fbs = res.data or []
        total = len(fbs)

        if total == 0:
            return json.dumps({
                "total_responses": 0,
                "message": "No feedback has been submitted yet for this event."
            })

        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for f in fbs:
            r = f["overall_rating"]
            rating_dist[r] = rating_dist.get(r, 0) + 1

        return json.dumps({
            "total_responses": total,
            "averages": {
                "overall": round(sum(f["overall_rating"] for f in fbs) / total, 1),
                "content": round(sum(f["content_rating"] for f in fbs) / total, 1),
                "speaker": round(sum(f["speaker_rating"] for f in fbs) / total, 1),
                "organization": round(sum(f["organization_rating"] for f in fbs) / total, 1),
                "hands_on": round(sum(f["hands_on_rating"] for f in fbs) / total, 1)
            },
            "overall_rating_distribution": rating_dist
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def get_event_activity(event_id: str) -> str:
    """Tool: Retrieves the audit log activity stream for an event."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("event_activity").select("*").eq("event_id", event_id).order("created_at", desc=True).limit(20).execute()
        return json.dumps({"activity_log": res.data or []})
    except Exception as e:
        return json.dumps({"error": str(e)})

def generate_event_report(event_id: str) -> str:
    """Tool: Synthesizes a full comprehensive event report from database metrics."""
    summary = get_registration_statistics(event_id)
    attendance = get_attendance_statistics(event_id)
    feedback = get_feedback_statistics(event_id)
    return json.dumps({
        "registration_stats": json.loads(summary),
        "attendance_stats": json.loads(attendance),
        "feedback_stats": json.loads(feedback)
    })

# ----------------------------------------------------
# 2. WRITE TOOLS (Requires Organizer Confirmation)
# ----------------------------------------------------

def send_registration_reminder_action(event_id: str, actor_id: str) -> Dict[str, Any]:
    """Executes registration reminder broadcast after organizer confirmation."""
    if not supabase:
        return {"success": False, "message": "Database connection unavailable."}
    
    # Query pending registrations
    regs_res = supabase.table("registrations").select("participant_id").eq("event_id", event_id).execute()
    count = len(regs_res.data or [])

    # Log action to event_activity
    supabase.table("event_activity").insert({
        "event_id": event_id,
        "actor_id": actor_id,
        "activity_type": "REMINDER_SENT",
        "description": f"Registration reminder broadcast issued to {count} participants (SMTP service not configured).",
        "metadata": {"count": count, "channel": "email"}
    }).execute()

    return {
        "success": True,
        "message": f"Registration reminder action executed for {count} registered participants. Note: Email service is unconfigured in development mode.",
        "recipients_count": count
    }

def send_attendance_reminder_action(event_id: str, actor_id: str) -> Dict[str, Any]:
    """Executes attendance reminder broadcast to absentees after organizer confirmation."""
    if not supabase:
        return {"success": False, "message": "Database connection unavailable."}

    abs_data = json.loads(find_absentees(event_id))
    absentees = abs_data.get("absentees", [])
    count = len(absentees)

    supabase.table("event_activity").insert({
        "event_id": event_id,
        "actor_id": actor_id,
        "activity_type": "ATTENDANCE_REMINDER_SENT",
        "description": f"Attendance check-in reminder issued to {count} absent participants.",
        "metadata": {"count": count}
    }).execute()

    return {
        "success": True,
        "message": f"Attendance check-in reminder sent to {count} absent participants. (Email service pending production SMTP configuration).",
        "recipients_count": count
    }

def generate_certificates_action(event_id: str, actor_id: str) -> Dict[str, Any]:
    """Executes certificate generation for checked-in attendees after organizer confirmation."""
    if not supabase:
        return {"success": False, "message": "Database connection unavailable."}

    att_res = supabase.table("attendance").select("participant_id").eq("event_id", event_id).execute()
    checked_in_pids = [a["participant_id"] for a in (att_res.data or [])]

    if not checked_in_pids:
        return {"success": False, "message": "Zero checked-in participants found for this event. Certificates require attendance check-in."}

    cert_res = supabase.table("certificates").select("participant_id").eq("event_id", event_id).execute()
    existing_pids = set(c["participant_id"] for c in (cert_res.data or []))

    new_certs = []
    for pid in checked_in_pids:
        if pid not in existing_pids:
            cid = f"CERT-{uuid.uuid4().hex[:10].upper()}"
            new_certs.append({
                "event_id": event_id,
                "participant_id": pid,
                "certificate_id": cid,
                "status": "generated"
            })

    if new_certs:
        supabase.table("certificates").insert(new_certs).execute()

    supabase.table("event_activity").insert({
        "event_id": event_id,
        "actor_id": actor_id,
        "activity_type": "CERTIFICATES_GENERATED",
        "description": f"Issued {len(new_certs)} new certificates via AI Agent action.",
        "metadata": {"count": len(new_certs)}
    }).execute()

    return {
        "success": True,
        "message": f"Successfully generated {len(new_certs)} certificates for checked-in attendees.",
        "generated_count": len(new_certs)
    }

# ----------------------------------------------------
# 3. FASTAPI AGENT ENDPOINTS
# ----------------------------------------------------

@router.post("/chat")
def agent_chat(
    payload: AgentChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    event_id = payload.event_id
    user_prompt = payload.messages[-1].content.lower()

    executed_tools = []
    grounded_context = {}
    pending_action = None

    # Deterministic Tool Routing based on User Intent
    if any(k in user_prompt for k in ["register", "registrations", "how many registered", "total registered"]):
        executed_tools.append("get_registration_statistics")
        grounded_context["registration_stats"] = json.loads(get_registration_statistics(event_id))

    if any(k in user_prompt for k in ["cse", "year", "student", "who registered", "demographic", "branch", "college", "find"]):
        executed_tools.append("search_participants")
        grounded_context["participants"] = json.loads(search_participants(event_id))

    if any(k in user_prompt for k in ["attendance", "checkin", "checked in", "present", "rate"]):
        executed_tools.append("get_attendance_statistics")
        grounded_context["attendance_stats"] = json.loads(get_attendance_statistics(event_id))

    if any(k in user_prompt for k in ["absent", "who hasn't", "hasn't checked", "missing"]):
        executed_tools.append("find_absentees")
        grounded_context["absentees"] = json.loads(find_absentees(event_id))

    if any(k in user_prompt for k in ["feedback", "rating", "dislike", "like", "improve", "comment", "review"]):
        executed_tools.append("get_feedback_statistics")
        executed_tools.append("get_feedback")
        grounded_context["feedback_stats"] = json.loads(get_feedback_statistics(event_id))
        grounded_context["feedback_data"] = json.loads(get_feedback(event_id))

    if any(k in user_prompt for k in ["activity", "history", "log"]):
        executed_tools.append("get_event_activity")
        grounded_context["activity"] = json.loads(get_event_activity(event_id))

    if any(k in user_prompt for k in ["report", "summary"]):
        executed_tools.append("generate_event_report")
        grounded_context["report"] = json.loads(generate_event_report(event_id))

    # Check Write Action Intents
    if "reminder" in user_prompt and any(k in user_prompt for k in ["absent", "checkin", "attendance"]):
        abs_data = json.loads(find_absentees(event_id))
        count = abs_data.get("total_absentees", 0)
        pending_action = {
            "action_type": "send_attendance_reminder",
            "prompt_text": f"I found {count} registered participant(s) who have not checked in. Would you like me to send them an attendance check-in reminder?",
            "params": {"count": count}
        }

    if "certificate" in user_prompt and any(k in user_prompt for k in ["generate", "issue", "create"]):
        pending_action = {
            "action_type": "generate_certificates",
            "prompt_text": "Would you like me to generate digital certificates for all checked-in attendees?",
            "params": {}
        }

    # Default fallback tool if no specific keywords matched
    if not executed_tools:
        executed_tools.append("get_event")
        executed_tools.append("get_registration_statistics")
        grounded_context["event"] = json.loads(get_event(event_id))
        grounded_context["registration_stats"] = json.loads(get_registration_statistics(event_id))

    # Gemini LLM Call with Strict Anti-Hallucination Prompt
    gemini_key = settings.GEMINI_API_KEY
    agent_reply = ""

    if gemini_key and gemini_key != "placeholder-gemini-key":
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)

            sys_prompt = (
                "You are EventFlow AI Agent, a grounded, anti-hallucination Event Operations Assistant. "
                "CRITICAL RULES:\n"
                "1. Base ALL facts, counts, attendance numbers, feedback quotes, and participant lists STRICTLY on the provided database context JSON below.\n"
                "2. If a metric or count is 0, explicitly report 0.\n"
                "3. If there is no feedback or no participants, explicitly state that no feedback or participants exist.\n"
                "4. NEVER invent fake names, email addresses, or artificial comparisons.\n\n"
                f"EXACT DATABASE CONTEXT:\n{json.dumps(grounded_context, indent=2)}"
            )

            res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=payload.messages[-1].content,
                config={"system_instruction": sys_prompt}
            )
            agent_reply = res.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")

    if not agent_reply:
        # Rule-based Grounded Response formatting if Gemini API is unreachable
        if "registration_stats" in grounded_context:
            rs = grounded_context["registration_stats"]
            agent_reply = f"📊 **Registration Statistics for '{rs.get('event_name', 'Event')}'**:\n- Total Registrations: **{rs.get('total_registrations', 0)}**\n- Seating Capacity: **{rs.get('capacity', 0)}**\n- Spots Remaining: **{rs.get('spots_remaining', 0)}**"
        elif "absentees" in grounded_context:
            abs_info = grounded_context["absentees"]
            agent_reply = f"⚠️ **Absentee List**:\nThere are **{abs_info.get('total_absentees', 0)}** registered participant(s) who have not checked in."
        elif "feedback_stats" in grounded_context:
            fs = grounded_context["feedback_stats"]
            if fs.get("total_responses", 0) == 0:
                agent_reply = "📝 **Feedback Analysis**: Zero feedback submissions have been recorded yet for this event."
            else:
                agent_reply = f"⭐ **Feedback Summary ({fs['total_responses']} responses)**:\n- Overall Rating: **{fs['averages']['overall']}/5**\n- Content Quality: **{fs['averages']['content']}/5**\n- Speaker Quality: **{fs['averages']['speaker']}/5**"
        else:
            agent_reply = f"Hello! Based on live database queries, your event statistics are currently updated in real-time."

    return {
        "reply": agent_reply,
        "executed_tools": executed_tools,
        "grounded_data": grounded_context,
        "pending_action": pending_action
    }

@router.post("/action/confirm")
def confirm_agent_action(
    payload: ConfirmActionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    action_type = payload.action_type
    event_id = payload.event_id

    if action_type == "send_attendance_reminder":
        result = send_attendance_reminder_action(event_id, current_user.id)
    elif action_type == "send_registration_reminder":
        result = send_registration_reminder_action(event_id, current_user.id)
    elif action_type == "generate_certificates":
        result = generate_certificates_action(event_id, current_user.id)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown write action type '{action_type}'")

    return result
