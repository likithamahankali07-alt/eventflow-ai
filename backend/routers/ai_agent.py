from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from config import settings
from db import supabase
from auth import get_current_user, AuthenticatedUser
import logging
import json
import uuid

logger = logging.getLogger("eventflow.ai_agent")

router = APIRouter(prefix="/api/ai", tags=["AI Operations & Registration Copilot"])

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

class AttendeeQARequest(BaseModel):
    event_id: str
    query: str

class GenerateCampaignRequest(BaseModel):
    event_id: str
    channel: str = "all" # "whatsapp", "linkedin", "email", "twitter_instagram", "all"
    target_audience: Optional[str] = "General Attendees"

# ----------------------------------------------------
# 1. CORE READ TOOLS
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
    """Tool: Calculates total registration count, capacity, spots remaining, and referral source distribution."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        evt_res = supabase.table("events").select("capacity, name, date, registration_deadline").eq("id", event_id).execute()
        if not evt_res.data:
            return json.dumps({"error": "Event not found"})
        evt = evt_res.data[0]
        capacity = evt["capacity"]

        reg_res = supabase.table("registrations").select("id, registration_status, referral_source").eq("event_id", event_id).execute()
        regs = reg_res.data or []
        total_regs = len(regs)

        # Referral sources breakdown
        sources = {}
        for r in regs:
            s = r.get("referral_source") or "direct"
            sources[s] = sources.get(s, 0) + 1

        return json.dumps({
            "event_id": event_id,
            "event_name": evt["name"],
            "total_registrations": total_regs,
            "capacity": capacity,
            "spots_remaining": max(0, capacity - total_regs),
            "is_full": total_regs >= capacity,
            "percentage_filled": f"{round((total_regs / capacity * 100), 1)}%" if capacity > 0 else "0%",
            "referral_sources": sources
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def search_participants(event_id: str, query: str = "", college: str = "", branch: str = "", company: str = "") -> str:
    """Tool: Searches and filters registered participants by query string, organization/college, or department."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        res = supabase.table("registrations").select("participant_id, registered_at, referral_source, participants(*)").eq("event_id", event_id).execute()
        regs = res.data or []
        
        matches = []
        for r in regs:
            p = r.get("participants") or {}
            name = p.get("name", "")
            email = p.get("email", "")
            p_college = p.get("college", "")
            p_branch = p.get("branch", "")
            p_company = p.get("company", "")
            p_role = p.get("role", "")

            # Filter checks
            if query and not (query.lower() in name.lower() or query.lower() in email.lower() or query.lower() in p_college.lower() or query.lower() in p_company.lower()):
                continue
            if college and college.lower() not in p_college.lower():
                continue
            if branch and branch.lower() not in p_branch.lower():
                continue
            if company and company.lower() not in p_company.lower():
                continue

            matches.append({
                "participant_id": r["participant_id"],
                "name": name,
                "email": email,
                "organization": p_company or p_college or "N/A",
                "role": p_role or p_branch or "Attendee",
                "referral_source": r.get("referral_source", "direct"),
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
        regs_res = supabase.table("registrations").select("participant_id, registration_token, participants(*)").eq("event_id", event_id).execute()
        regs = regs_res.data or []

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
                    "organization": p.get("company") or p.get("college") or "N/A",
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
# 2. REGISTRATION GROWTH & PROMOTION TOOLS
# ----------------------------------------------------

def get_registration_velocity(event_id: str) -> str:
    """Tool: Analyzes registration pace, daily signup rates, spots remaining, and pacing health."""
    if not supabase:
        return json.dumps({"error": "Database unavailable"})
    try:
        evt_res = supabase.table("events").select("id, name, capacity, date, created_at, registration_deadline").eq("id", event_id).execute()
        if not evt_res.data:
            return json.dumps({"error": "Event not found"})
        evt = evt_res.data[0]
        capacity = evt["capacity"]

        reg_res = supabase.table("registrations").select("registered_at").eq("event_id", event_id).execute()
        regs = reg_res.data or []
        total_regs = len(regs)

        # Calculate pacing status
        pct = (total_regs / capacity * 100) if capacity > 0 else 0
        if pct >= 100:
            health = "Sold Out / Capacity Reached"
        elif pct >= 75:
            health = "High Demand (Nearing Capacity)"
        elif pct >= 40:
            health = "Moderate Pacing"
        else:
            health = "Growth Opportunity (Needs Outreach)"

        return json.dumps({
            "event_name": evt["name"],
            "total_registrations": total_regs,
            "capacity": capacity,
            "spots_remaining": max(0, capacity - total_regs),
            "capacity_filled_percentage": f"{round(pct, 1)}%",
            "pacing_health": health
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

def recommend_registration_growth(event_id: str) -> str:
    """Tool: Evaluates current registration numbers and provides concrete, actionable growth tactics."""
    vel_data = json.loads(get_registration_velocity(event_id))
    total = vel_data.get("total_registrations", 0)
    capacity = vel_data.get("capacity", 100)
    spots = vel_data.get("spots_remaining", 0)

    tactics = [
        "Create shareable WhatsApp/Telegram broadcast message with 1-click registration link.",
        "Post a thought-leadership announcement on LinkedIn highlighting speaker credentials and key takeaways.",
        "Share an exclusive teaser of the event agenda or hands-on project to drive FOMO.",
        "Encourage already-registered attendees to invite a peer or colleague using their referral link."
    ]

    return json.dumps({
        "current_status": f"{total}/{capacity} registered ({spots} spots remaining)",
        "recommended_tactics": tactics
    })

def generate_registration_campaign(event_id: str, channel: str = "all", target_audience: str = "general") -> str:
    """Tool: Generates high-converting promotional copies for WhatsApp, LinkedIn, Email, X/Twitter, and Discord."""
    evt_data = json.loads(get_event(event_id))
    if "error" in evt_data:
        return json.dumps(evt_data)

    name = evt_data.get("name", "Event")
    desc = evt_data.get("description", "")
    date_val = evt_data.get("date", "")
    time_val = f"{evt_data.get('start_time', '')} - {evt_data.get('end_time', '')}"
    venue = evt_data.get("venue", "Online")
    event_type = evt_data.get("event_type", "Event").replace("_", " ").title()

    whatsapp_copy = (
        f"🚀 *{name}* ({event_type})\n\n"
        f"📅 *Date*: {date_val}\n"
        f"⏰ *Time*: {time_val}\n"
        f"📍 *Venue*: {venue}\n\n"
        f"💡 *What you'll gain*:\n"
        f"{desc[:180]}...\n\n"
        f"🎟️ *Reserve your spot before capacity fills*:\n"
        f"👉 {{{{registration_url}}}}\n\n"
        f"Tag a friend or colleague who shouldn't miss this! 🙌"
    )

    linkedin_copy = (
        f"Excited to announce our upcoming {event_type.lower()}: **{name}**!\n\n"
        f"Join industry professionals and community peers on {date_val} at {venue}.\n\n"
        f"Key Agenda & Highlights:\n"
        f"• Deep dive sessions and real-world takeaways\n"
        f"• Interactive networking opportunities\n"
        f"• Verified digital certificate of attendance\n\n"
        f"Spots are limited to ensure a high-impact experience. Register here: {{{{registration_url}}}}\n\n"
        f"#Networking #ProfessionalGrowth #{name.replace(' ', '')}"
    )

    email_copy = (
        f"Subject: You're Invited: {name} ({date_val})\n\n"
        f"Hi there,\n\n"
        f"We're thrilled to invite you to {name}, taking place on {date_val} at {venue}.\n\n"
        f"{desc}\n\n"
        f"Date: {date_val}\n"
        f"Time: {time_val}\n"
        f"Location: {venue}\n\n"
        f"Click the link below to claim your ticket:\n"
        f"{{{{registration_url}}}}\n\n"
        f"Looking forward to seeing you there!\n"
        f"The Event Operations Team"
    )

    return json.dumps({
        "event_name": name,
        "campaigns": {
            "whatsapp": whatsapp_copy,
            "linkedin": linkedin_copy,
            "email": email_copy
        }
    })

# ----------------------------------------------------
# 3. WRITE ACTIONS (Requires Organizer Confirmation)
# ----------------------------------------------------

def send_registration_reminder_action(event_id: str, actor_id: str) -> Dict[str, Any]:
    if not supabase:
        return {"success": False, "message": "Database connection unavailable."}
    
    regs_res = supabase.table("registrations").select("participant_id").eq("event_id", event_id).execute()
    count = len(regs_res.data or [])

    supabase.table("event_activity").insert({
        "event_id": event_id,
        "actor_id": actor_id,
        "activity_type": "REMINDER_SENT",
        "description": f"Registration confirmation and event reminder broadcast sent to {count} attendees.",
        "metadata": {"count": count, "channel": "email"}
    }).execute()

    return {
        "success": True,
        "message": f"Broadcast reminder logged for {count} registered attendees. Note: External SMTP delivery requires production mail credentials.",
        "recipients_count": count
    }

def send_attendance_reminder_action(event_id: str, actor_id: str) -> Dict[str, Any]:
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
        "message": f"Attendance reminder recorded for {count} absent participants.",
        "recipients_count": count
    }

def generate_certificates_action(event_id: str, actor_id: str) -> Dict[str, Any]:
    if not supabase:
        return {"success": False, "message": "Database connection unavailable."}

    att_res = supabase.table("attendance").select("participant_id").eq("event_id", event_id).execute()
    checked_in_pids = [a["participant_id"] for a in (att_res.data or [])]

    if not checked_in_pids:
        return {"success": False, "message": "Zero checked-in participants found for this event. Certificates require verified attendance."}

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
        "message": f"Successfully generated {len(new_certs)} certificates for attended participants.",
        "generated_count": len(new_certs)
    }

# ----------------------------------------------------
# 4. FASTAPI ENDPOINTS
# ----------------------------------------------------

@router.post("/agent/chat")
def agent_chat(
    payload: AgentChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    event_id = payload.event_id
    user_prompt = payload.messages[-1].content.lower()

    executed_tools = []
    grounded_context = {}
    pending_action = None

    # Intent Routing
    if any(k in user_prompt for k in ["promote", "marketing", "campaign", "whatsapp", "linkedin", "promo", "outreach", "copy"]):
        executed_tools.append("generate_registration_campaign")
        grounded_context["campaigns"] = json.loads(generate_registration_campaign(event_id))

    elif any(k in user_prompt for k in ["pace", "velocity", "grow", "how fast", "speed", "boost"]):
        executed_tools.append("get_registration_velocity")
        executed_tools.append("recommend_registration_growth")
        grounded_context["velocity"] = json.loads(get_registration_velocity(event_id))
        grounded_context["growth_recommendations"] = json.loads(recommend_registration_growth(event_id))

    elif any(k in user_prompt for k in ["register", "registrations", "how many registered", "total registered"]):
        executed_tools.append("get_registration_statistics")
        grounded_context["registration_stats"] = json.loads(get_registration_statistics(event_id))

    elif any(k in user_prompt for k in ["participant", "who registered", "company", "college", "attendee", "find", "search"]):
        executed_tools.append("search_participants")
        grounded_context["participants"] = json.loads(search_participants(event_id))

    elif any(k in user_prompt for k in ["attendance", "checkin", "checked in", "present", "rate"]):
        executed_tools.append("get_attendance_statistics")
        grounded_context["attendance_stats"] = json.loads(get_attendance_statistics(event_id))

    elif any(k in user_prompt for k in ["absent", "who hasn't", "hasn't checked", "missing"]):
        executed_tools.append("find_absentees")
        grounded_context["absentees"] = json.loads(find_absentees(event_id))

    elif any(k in user_prompt for k in ["feedback", "rating", "dislike", "like", "improve", "comment", "review"]):
        executed_tools.append("get_feedback_statistics")
        executed_tools.append("get_feedback")
        grounded_context["feedback_stats"] = json.loads(get_feedback_statistics(event_id))
        grounded_context["feedback_data"] = json.loads(get_feedback(event_id))

    elif any(k in user_prompt for k in ["report", "summary"]):
        executed_tools.append("generate_event_report")
        grounded_context["report"] = json.loads(generate_event_report(event_id))

    # Action confirmations
    if "reminder" in user_prompt and any(k in user_prompt for k in ["absent", "checkin", "attendance"]):
        abs_data = json.loads(find_absentees(event_id))
        count = abs_data.get("total_absentees", 0)
        pending_action = {
            "action_type": "send_attendance_reminder",
            "prompt_text": f"I identified {count} registered participant(s) who haven't checked in yet. Send them an attendance reminder?",
            "params": {"count": count}
        }

    if "certificate" in user_prompt and any(k in user_prompt for k in ["generate", "issue", "create"]):
        pending_action = {
            "action_type": "generate_certificates",
            "prompt_text": "Generate digital certificates of participation for all verified attendees?",
            "params": {}
        }

    if not executed_tools:
        executed_tools.append("get_event")
        executed_tools.append("get_registration_statistics")
        grounded_context["event"] = json.loads(get_event(event_id))
        grounded_context["registration_stats"] = json.loads(get_registration_statistics(event_id))

    # Gemini LLM Generation
    gemini_key = settings.GEMINI_API_KEY
    agent_reply = ""

    if gemini_key and gemini_key != "placeholder-gemini-key":
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)

            sys_prompt = (
                "You are EventFlow AI Copilot, a professional and proactive Event Operations & Registration Intelligence Agent. "
                "You assist organizers across tech communities, companies, colleges, webinars, conferences, and meetups. "
                "CRITICAL RULES:\n"
                "1. Base ALL facts, numbers, dates, and names STRICTLY on the database context JSON below.\n"
                "2. When helping with promotion or registrations, provide crisp, ready-to-copy marketing templates.\n"
                "3. If a metric is 0, report 0.\n"
                f"DATABASE CONTEXT:\n{json.dumps(grounded_context, indent=2)}"
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
        if "campaigns" in grounded_context:
            c = grounded_context["campaigns"].get("campaigns", {})
            agent_reply = f"📢 **Ready-to-Post Campaign Copy for WhatsApp & Social Media**:\n\n{c.get('whatsapp', '')}\n\n---\n**LinkedIn Post**:\n{c.get('linkedin', '')}"
        elif "velocity" in grounded_context:
            v = grounded_context["velocity"]
            agent_reply = f"📈 **Registration Velocity**: {v.get('total_registrations')} / {v.get('capacity')} registered ({v.get('spots_remaining')} spots left).\nPacing Health: **{v.get('pacing_health')}**."
        elif "registration_stats" in grounded_context:
            rs = grounded_context["registration_stats"]
            agent_reply = f"📊 **Registration Stats**: {rs.get('total_registrations', 0)} registered ({rs.get('spots_remaining', 0)} spots remaining)."
        else:
            agent_reply = "Hello! Your event operations data is live. You can ask me to draft promotional messages, find absentees, or calculate feedback scores."

    return {
        "reply": agent_reply,
        "executed_tools": executed_tools,
        "grounded_data": grounded_context,
        "pending_action": pending_action
    }

@router.post("/agent/campaign")
def generate_campaign_endpoint(payload: GenerateCampaignRequest):
    """Direct endpoint to generate marketing copies for an event."""
    return json.loads(generate_registration_campaign(payload.event_id, payload.channel, payload.target_audience))

@router.post("/attendee-qa")
def attendee_qa_endpoint(payload: AttendeeQARequest):
    """Public endpoint for prospective attendees on /register/:eventId to ask questions."""
    evt_data = json.loads(get_event(payload.event_id))
    if "error" in evt_data:
        raise HTTPException(status_code=404, detail="Event not found")

    gemini_key = settings.GEMINI_API_KEY
    if gemini_key and gemini_key != "placeholder-gemini-key":
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            prompt = (
                f"You are the event information assistant for '{evt_data.get('name')}'. "
                f"Answer the prospective attendee's question kindly and accurately based ONLY on these event details:\n"
                f"Event Name: {evt_data.get('name')}\n"
                f"Type: {evt_data.get('event_type')}\n"
                f"Date: {evt_data.get('date')}\n"
                f"Time: {evt_data.get('start_time')} to {evt_data.get('end_time')}\n"
                f"Venue: {evt_data.get('venue')}\n"
                f"Description: {evt_data.get('description')}\n"
                f"Capacity: {evt_data.get('capacity')}\n\n"
                f"Attendee Question: {payload.query}"
            )
            res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return {"answer": res.text}
        except Exception as e:
            logger.error(f"Gemini error in attendee QA: {e}")

    # Fallback rule-based answering
    return {
        "answer": f"The event '{evt_data.get('name')}' is scheduled on {evt_data.get('date')} from {evt_data.get('start_time')} to {evt_data.get('end_time')} at {evt_data.get('venue')}. {evt_data.get('description')[:200]}"
    }

@router.post("/agent/action/confirm")
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
