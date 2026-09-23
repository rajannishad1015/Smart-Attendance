"""
Assignments API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import Assignment, AssignmentSubmission, StudentMetrics
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/assignments", tags=["assignments"])

class AssignmentSubmitPayload(BaseModel):
    assignment_id: int
    student_id: int
    file_name: str = "solution_pipeline.py"

@router.get("/")
def list_assignments(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).all()
    return [
        {
            "id": a.id,
            "subject_name": a.subject_name,
            "title": a.title,
            "instructions": a.instructions,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "total_marks": a.total_marks,
            "status": a.status
        }
        for a in assignments
    ]

@router.get("/student/{student_id}/submissions")
def get_student_submissions(student_id: int, db: Session = Depends(get_db)):
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student_id).all()
    sub_map = {s.assignment_id: s for s in submissions}

    assignments = db.query(Assignment).all()
    results = []
    for a in assignments:
        sub = sub_map.get(a.id)
        results.append({
            "assignment_id": a.id,
            "title": a.title,
            "subject_name": a.subject_name,
            "instructions": a.instructions,
            "due_date": a.due_date.strftime("%b %d, %Y") if a.due_date else "Upcoming",
            "total_marks": a.total_marks,
            "is_submitted": bool(sub),
            "status": sub.status if sub else "PENDING",
            "submitted_file": sub.file_name if sub else None,
            "submitted_at": sub.submitted_at.strftime("%b %d, %I:%M %p") if (sub and sub.submitted_at) else None,
            "marks_obtained": sub.marks_obtained if sub else None,
            "feedback": sub.feedback if sub else None
        })
    return results

@router.post("/submit")
def submit_assignment(payload: AssignmentSubmitPayload, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == payload.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = AssignmentSubmission(
        assignment_id=payload.assignment_id,
        student_id=payload.student_id,
        file_name=payload.file_name,
        submitted_at=datetime.utcnow(),
        status="SUBMITTED",
        marks_obtained=None,
        feedback="Awaiting teacher review."
    )
    db.add(submission)

    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == payload.student_id).first()
    if metrics:
        metrics.submitted_assignments += 1
        if metrics.pending_assignments > 0:
            metrics.pending_assignments -= 1

    db.commit()

    return {
        "success": True,
        "submission_id": submission.id,
        "status": submission.status,
        "message": "Assignment successfully submitted."
    }

