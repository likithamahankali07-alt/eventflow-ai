from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time, datetime
from db import supabase
from auth import get_current_user, AuthenticatedUser
import logging

logger = logging.getLogger("eventflow.events")

router = APIRouter(prefix="/api/events", tags=["Events"])

class EventCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: str
    event_type: str = Field(..., example="workshop")
    date: str = Field(..., example="2026-10-15")
    start_time: str = Field(..., example="10:00:00")
    end_time: str = Field(..., example="17:00:00")
    venue: str
    capacity: int = Field(..., gt=0)
    registration_deadline: str

class EventUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    registration_deadline: Optional[str] = None
    status: Optional[str] = None
    registration_open: Optional[bool] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        # Check profile exists or auto-create profile for organizer
        profile_res = supabase.table("profiles").select("id").eq("id", current_user.id).execute()
        if not profile_res.data:
            supabase.table("profiles").insert({
                "id": current_user.id,
                "full_name": current_user.email.split("@")[0].capitalize(),
                "email": current_user.email,
                "organization": "College Club / Chapter",
                "role": "organizer"
            }).execute()

        event_data = {
            "organizer_id": current_user.id,
            "name": payload.name,
            "description": payload.description,
            "event_type": payload.event_type,
            "date": payload.date,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "venue": payload.venue,
            "capacity": payload.capacity,
            "registration_deadline": payload.registration_deadline,
            "status": "upcoming",
            "registration_open": True
        }

        res = supabase.table("events").insert(event_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create event")

        event = res.data[0]

        # Record event activity
        supabase.table("event_activity").insert({
            "event_id": event["id"],
            "actor_id": current_user.id,
            "activity_type": "EVENT_CREATED",
            "description": f"Event '{event['name']}' created with capacity {event['capacity']}.",
            "metadata": {"capacity": event["capacity"], "venue": event["venue"]}
        }).execute()

        return event

    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
def list_events(current_user: AuthenticatedUser = Depends(get_current_user)):
    if not supabase:
        return []

    try:
        res = supabase.table("events").select("*").eq("organizer_id", current_user.id).order("created_at", desc=True).execute()
        events = res.data or []

        # Enhance events with registration & attendance counts
        for event in events:
            reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event["id"]).execute().count or 0
            att_count = supabase.table("attendance").select("id", count="exact").eq("event_id", event["id"]).execute().count or 0
            event["total_registrations"] = reg_count
            event["total_attendance"] = att_count

        return events
    except Exception as e:
        logger.error(f"Error listing events: {e}")
        return []

@router.get("/public/{event_id}")
def get_public_event(event_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        res = supabase.table("events").select("id, name, description, event_type, date, start_time, end_time, venue, capacity, registration_deadline, status, registration_open").eq("id", event_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Event not found")

        event = res.data[0]
        reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        
        event["registered_count"] = reg_count
        event["spots_remaining"] = max(0, event["capacity"] - reg_count)
        
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}")
def get_event_details(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        res = supabase.table("events").select("*").eq("id", event_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Event not found")

        event = res.data[0]

        # Calculate exact statistics
        reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        att_count = supabase.table("attendance").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        feedback_res = supabase.table("feedback").select("overall_rating, content_rating, speaker_rating, organization_rating, hands_on_rating").eq("event_id", event_id).execute()
        
        feedbacks = feedback_res.data or []
        feedback_count = len(feedbacks)
        
        avg_rating = 0.0
        if feedback_count > 0:
            avg_rating = round(sum(f["overall_rating"] for f in feedbacks) / feedback_count, 1)

        cert_count = supabase.table("certificates").select("id", count="exact").eq("event_id", event_id).execute().count or 0

        event["stats"] = {
            "total_registrations": reg_count,
            "spots_remaining": max(0, event["capacity"] - reg_count),
            "checked_in": att_count,
            "attendance_rate": round((att_count / reg_count * 100), 1) if reg_count > 0 else 0.0,
            "feedback_responses": feedback_count,
            "average_rating": avg_rating,
            "certificates_issued": cert_count
        }

        return event
    except Exception as e:
        logger.error(f"Error fetching event details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{event_id}")
def update_event(
    event_id: str,
    payload: EventUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        res = supabase.table("events").update(update_data).eq("id", event_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Event not found or update failed")

        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
