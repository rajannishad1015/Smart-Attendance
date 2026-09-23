"""
Recommendations and AI Study Planner Endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.schemas import StudyPlanRequest, StudyPlanResponse
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/student/{student_id}")
def get_recommendations(
    student_id: int,
    weak_topic: str = Query("Probability", description="Topic needing reinforcement"),
    limit: int = Query(4, description="Number of recommendations")
):
    """
    Returns personalized learning materials ranked by TF-IDF cosine similarity
    """
    items = ml_service.get_recommendations(weak_topic=weak_topic, limit=limit)
    return {
        "weak_topic": weak_topic,
        "recommendations": items
    }

@router.post("/study-planner", response_model=StudyPlanResponse)
def generate_study_plan(payload: StudyPlanRequest):
    """
    Generates structured AI study plan based on student's available hours and weak topics
    """
    plan = ml_service.generate_study_plan(
        available_hours=payload.available_hours_per_day,
        weak_topics=payload.weak_topics
    )
    return plan
