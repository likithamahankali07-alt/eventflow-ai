from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from db import supabase
from auth import get_current_user, AuthenticatedUser
import uuid
from datetime import datetime
import logging

logger = logging.getLogger("eventflow.certificates")

router = APIRouter(prefix="/api", tags=["Certificates"])

@router.post("/events/{event_id}/certificates/generate")
def generate_event_certificates(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        # Fetch event
        event_res = supabase.table("events").select("id, name").eq("id", event_id).execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")
        event = event_res.data[0]

        # Fetch checked in participants from attendance table
        att_res = supabase.table("attendance").select("participant_id").eq("event_id", event_id).execute()
        checked_in_pids = [a["participant_id"] for a in (att_res.data or [])]

        if not checked_in_pids:
            return {
                "message": "No checked-in participants found for this event. Certificates require attendance check-in.",
                "generated_count": 0
            }

        # Check existing certificates
        cert_res = supabase.table("certificates").select("participant_id").eq("event_id", event_id).execute()
        existing_pids = set(c["participant_id"] for c in (cert_res.data or []))

        to_create = [pid for pid in checked_in_pids if pid not in existing_pids]

        new_certs = []
        for pid in to_create:
            cid = f"CERT-{uuid.uuid4().hex[:10].upper()}"
            new_certs.append({
                "event_id": event_id,
                "participant_id": pid,
                "certificate_id": cid,
                "status": "generated"
            })

        if new_certs:
            supabase.table("certificates").insert(new_certs).execute()

            # Record activity
            supabase.table("event_activity").insert({
                "event_id": event_id,
                "actor_id": current_user.id,
                "activity_type": "CERTIFICATES_GENERATED",
                "description": f"Generated {len(new_certs)} certificates for attended participants.",
                "metadata": {"count": len(new_certs)}
            }).execute()

        return {
            "message": f"Successfully generated {len(new_certs)} new certificates.",
            "generated_count": len(new_certs),
            "total_certificates": len(existing_pids) + len(new_certs)
        }

    except Exception as e:
        logger.error(f"Error generating certificates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/certificates/verify/{certificate_id}")
def verify_certificate(certificate_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        cert_res = supabase.table("certificates").select(
            "id, certificate_id, status, generated_at, event_id, participant_id, events(name, date, event_type, venue, profiles(organization)), participants(name, email, college, branch)"
        ).eq("certificate_id", certificate_id.strip()).execute()

        if not cert_res.data:
            raise HTTPException(status_code=404, detail="Certificate not found or invalid certificate ID")

        cert = cert_res.data[0]
        event = cert.get("events") or {}
        part = cert.get("participants") or {}
        profile = event.get("profiles") or {}

        return {
            "is_valid": cert["status"] == "generated" or cert["status"] == "sent",
            "certificate_id": cert["certificate_id"],
            "status": cert["status"],
            "generated_at": cert["generated_at"],
            "recipient_name": part.get("name", "N/A"),
            "recipient_college": part.get("college", "N/A"),
            "event_name": event.get("name", "N/A"),
            "event_date": event.get("date", "N/A"),
            "issuing_organization": profile.get("organization", "Event Operations Team")
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error verifying certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
