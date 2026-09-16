from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from db import supabase
from auth import get_current_user, AuthenticatedUser
from datetime import datetime
import logging

logger = logging.getLogger("eventflow.attendance")

router = APIRouter(prefix="/api/events", tags=["Attendance"])

class CheckInRequest(BaseModel):
    token_or_id: str = Field(..., description="Registration token or Participant ID")

@router.post("/{event_id}/checkin")
def check_in_participant(
    event_id: str,
    payload: CheckInRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    token_or_id = payload.token_or_id.strip()

    try:
        # 1. Look up registration by registration_token or participant_id
        reg_res = supabase.table("registrations").select("id, participant_id, event_id, registration_token").eq("event_id", event_id).or_(
            f"registration_token.eq.{token_or_id},participant_id.eq.{token_or_id}"
        ).execute()

        if not reg_res.data:
            # Fallback search by participant ID direct
            reg_res = supabase.table("registrations").select("id, participant_id, event_id, registration_token").eq("event_id", event_id).eq("participant_id", token_or_id).execute()

        if not reg_res.data:
            raise HTTPException(status_code=404, detail=f"No registration found matching '{token_or_id}' for this event")

        reg = reg_res.data[0]
        participant_id = reg["participant_id"]

        # Fetch participant details for response
        part_res = supabase.table("participants").select("name, email, college, branch").eq("id", participant_id).execute()
        part_info = part_res.data[0] if part_res.data else {"name": "Participant", "email": ""}

        # 2. Check if already checked in
        existing_att = supabase.table("attendance").select("id, check_in_time").eq("event_id", event_id).eq("participant_id", participant_id).execute()
        if existing_att.data:
            return {
                "message": "Participant is already checked in!",
                "already_checked_in": True,
                "check_in_time": existing_att.data[0]["check_in_time"],
                "participant": part_info
            }

        # 3. Insert Attendance record
        att_insert = supabase.table("attendance").insert({
            "event_id": event_id,
            "participant_id": participant_id,
            "status": "present",
            "checked_in_by": current_user.id
        }).execute()

        if not att_insert.data:
            raise HTTPException(status_code=400, detail="Failed to record check-in")

        attendance_record = att_insert.data[0]

        # Log activity
        supabase.table("event_activity").insert({
            "event_id": event_id,
            "actor_id": current_user.id,
            "activity_type": "CHECKIN_SUCCESSFUL",
            "description": f"Checked in {part_info['name']} ({reg['registration_token']}).",
            "metadata": {"participant_id": participant_id, "token": reg["registration_token"]}
        }).execute()

        return {
            "message": "Check-in successful!",
            "already_checked_in": False,
            "check_in_time": attendance_record["check_in_time"],
            "participant": part_info
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Check-in failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
