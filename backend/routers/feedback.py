from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
from db import supabase
from auth import get_current_user, AuthenticatedUser
import logging

logger = logging.getLogger("eventflow.feedback")

router = APIRouter(prefix="/api/events", tags=["Feedback"])

class FeedbackSubmitRequest(BaseModel):
    participant_email: Optional[str] = None
    overall_rating: int = Field(..., ge=1, le=5)
    content_rating: int = Field(..., ge=1, le=5)
    speaker_rating: int = Field(..., ge=1, le=5)
    organization_rating: int = Field(..., ge=1, le=5)
    hands_on_rating: int = Field(..., ge=1, le=5)
    liked: Optional[str] = None
    improvement: Optional[str] = None
    future_topic: Optional[str] = None

@router.post("/{event_id}/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(event_id: str, payload: FeedbackSubmitRequest):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        # Check event exists
        event_res = supabase.table("events").select("id, name").eq("id", event_id).execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")

        participant_id = None
        if payload.participant_email:
            part_res = supabase.table("participants").select("id").eq("email", payload.participant_email.strip()).execute()
            if part_res.data:
                participant_id = part_res.data[0]["id"]

        feedback_data = {
            "event_id": event_id,
            "participant_id": participant_id,
            "overall_rating": payload.overall_rating,
            "content_rating": payload.content_rating,
            "speaker_rating": payload.speaker_rating,
            "organization_rating": payload.organization_rating,
            "hands_on_rating": payload.hands_on_rating,
            "liked": payload.liked,
            "improvement": payload.improvement,
            "future_topic": payload.future_topic
        }

        res = supabase.table("feedback").insert(feedback_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to record feedback")

        # Record activity
        supabase.table("event_activity").insert({
            "event_id": event_id,
            "activity_type": "NEW_FEEDBACK",
            "description": f"New feedback submitted with overall rating {payload.overall_rating}/5.",
            "metadata": {"overall_rating": payload.overall_rating}
        }).execute()

        return {"message": "Thank you for submitting your feedback!", "feedback_id": res.data[0]["id"]}

    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}/feedback/summary")
def get_feedback_summary(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not supabase:
        return {"total_responses": 0}

    try:
        res = supabase.table("feedback").select("*").eq("event_id", event_id).order("submitted_at", desc=True).execute()
        feedbacks = res.data or []
        total = len(feedbacks)

        if total == 0:
            return {
                "total_responses": 0,
                "averages": {
                    "overall": 0.0,
                    "content": 0.0,
                    "speaker": 0.0,
                    "organization": 0.0,
                    "hands_on": 0.0
                },
                "responses": []
            }

        avg_overall = round(sum(f["overall_rating"] for f in feedbacks) / total, 1)
        avg_content = round(sum(f["content_rating"] for f in feedbacks) / total, 1)
        avg_speaker = round(sum(f["speaker_rating"] for f in feedbacks) / total, 1)
        avg_org = round(sum(f["organization_rating"] for f in feedbacks) / total, 1)
        avg_handson = round(sum(f["hands_on_rating"] for f in feedbacks) / total, 1)

        return {
            "total_responses": total,
            "averages": {
                "overall": avg_overall,
                "content": avg_content,
                "speaker": avg_speaker,
                "organization": avg_org,
                "hands_on": avg_handson
            },
            "responses": feedbacks
        }

    except Exception as e:
        logger.error(f"Error fetching feedback summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
