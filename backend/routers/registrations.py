from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from db import supabase
from auth import get_current_user, AuthenticatedUser
import uuid
import logging

logger = logging.getLogger("eventflow.registrations")

router = APIRouter(prefix="/api", tags=["Registrations & Participants"])

class PublicRegistrationRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str
    college: str
    branch: str
    year: str
    student_id: str

@router.post("/register/{event_id}", status_code=status.HTTP_201_CREATED)
def register_participant(event_id: str, payload: PublicRegistrationRequest):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unconfigured")

    try:
        # 1. Fetch Event and check availability
        event_res = supabase.table("events").select("id, name, capacity, registration_deadline, status, registration_open").eq("id", event_id).execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")

        event = event_res.data[0]
        if not event.get("registration_open") or event.get("status") in ["completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Registration for this event is closed")

        # 2. Check current capacity
        reg_count = supabase.table("registrations").select("id", count="exact").eq("event_id", event_id).execute().count or 0
        if reg_count >= event["capacity"]:
            raise HTTPException(status_code=400, detail="Event capacity reached. Registration is full.")

        # 3. Create or update Participant record by unique email
        part_res = supabase.table("participants").select("id").eq("email", payload.email).execute()
        if part_res.data:
            participant_id = part_res.data[0]["id"]
            # Update existing participant info
            supabase.table("participants").update({
                "name": payload.name,
                "phone": payload.phone,
                "college": payload.college,
                "branch": payload.branch,
                "year": payload.year,
                "student_id": payload.student_id
            }).eq("id", participant_id).execute()
        else:
            new_part = supabase.table("participants").insert({
                "name": payload.name,
                "email": payload.email,
                "phone": payload.phone,
                "college": payload.college,
                "branch": payload.branch,
                "year": payload.year,
                "student_id": payload.student_id
            }).execute()
            if not new_part.data:
                raise HTTPException(status_code=400, detail="Failed to create participant record")
            participant_id = new_part.data[0]["id"]

        # 4. Check duplicate registration
        existing_reg = supabase.table("registrations").select("id, registration_token").eq("event_id", event_id).eq("participant_id", participant_id).execute()
        if existing_reg.data:
            return {
                "message": "Already registered for this event.",
                "registration_token": existing_reg.data[0]["registration_token"],
                "already_registered": True
            }

        # 5. Create Registration record with unique token
        token = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        reg_insert = supabase.table("registrations").insert({
            "event_id": event_id,
            "participant_id": participant_id,
            "registration_status": "confirmed",
            "registration_token": token
        }).execute()

        if not reg_insert.data:
            raise HTTPException(status_code=400, detail="Failed to complete registration")

        registration = reg_insert.data[0]

        # Record activity
        supabase.table("event_activity").insert({
            "event_id": event_id,
            "activity_type": "NEW_REGISTRATION",
            "description": f"{payload.name} ({payload.college}) registered for the event.",
            "metadata": {"participant_name": payload.name, "email": payload.email}
        }).execute()

        return {
            "message": "Registration successful!",
            "registration_id": registration["id"],
            "registration_token": token,
            "event_name": event["name"],
            "registered_at": registration["registered_at"]
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}/participants")
def list_event_participants(
    event_id: str,
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        return []

    try:
        # Join registrations with participants
        res = supabase.table("registrations").select(
            "id, registration_status, registration_token, registered_at, participant_id, participants(id, name, email, phone, college, branch, year, student_id)"
        ).eq("event_id", event_id).execute()

        registrations = res.data or []

        # Fetch attendance records for this event
        att_res = supabase.table("attendance").select("participant_id, check_in_time, status").eq("event_id", event_id).execute()
        attendance_map = {a["participant_id"]: a for a in (att_res.data or [])}

        # Fetch certificate records for this event
        cert_res = supabase.table("certificates").select("participant_id, certificate_id, status").eq("event_id", event_id).execute()
        cert_map = {c["participant_id"]: c for c in (cert_res.data or [])}

        output = []
        for reg in registrations:
            part = reg.get("participants") or {}
            pid = part.get("id") or reg.get("participant_id")
            
            att_data = attendance_map.get(pid)
            cert_data = cert_map.get(pid)

            item = {
                "registration_id": reg["id"],
                "registration_token": reg["registration_token"],
                "registered_at": reg["registered_at"],
                "registration_status": reg["registration_status"],
                "participant_id": pid,
                "name": part.get("name", "Unknown"),
                "email": part.get("email", ""),
                "phone": part.get("phone", ""),
                "college": part.get("college", ""),
                "branch": part.get("branch", ""),
                "year": part.get("year", ""),
                "student_id": part.get("student_id", ""),
                "is_checked_in": att_data is not None,
                "check_in_time": att_data.get("check_in_time") if att_data else None,
                "has_certificate": cert_data is not None,
                "certificate_id": cert_data.get("certificate_id") if cert_data else None
            }

            # Search filter logic
            if search:
                s = search.lower()
                if not (s in item["name"].lower() or s in item["email"].lower() or s in item["college"].lower() or s in item["registration_token"].lower()):
                    continue

            # Status filter logic
            if status_filter:
                if status_filter == "checked_in" and not item["is_checked_in"]:
                    continue
                elif status_filter == "pending" and item["is_checked_in"]:
                    continue

            output.append(item)

        return output
    except Exception as e:
        logger.error(f"Error listing participants: {e}")
        return []
