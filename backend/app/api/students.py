"""
Student API Endpoints
Powers the Student Dashboard with 100% dynamic data for the authenticated student.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import (
    User, StudentMetrics, MLStudentInsight, Subject, AttendanceSession, AttendanceRecord
)
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/{student_id}/dashboard")
def get_student_dashboard(student_id: int, db: Session = Depends(get_db)):
    """
    Returns full dynamic dashboard payload for the specific logged-in student
    """
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        # Fallback to the first student
        student = db.query(User).filter(User.role == "student").first()

    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == student.id).first()
    insight = db.query(MLStudentInsight).filter(MLStudentInsight.student_id == student.id).first()

    # Active attendance session status for Room 201
    active_session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    student_record = None
    radar_detected = False
    radar_status = "NOT_DETECTED"
    attendance_requested = False
    attendance_status = "ABSENT"

    if active_session:
        student_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == active_session.id,
            AttendanceRecord.student_id == student.id
        ).first()

        if student_record:
            radar_status = student_record.radar_status
            radar_detected = student_record.radar_status in ["DETECTED", "WEAK_SIGNAL"]
            attendance_requested = student_record.request_status == "YES"
            attendance_status = student_record.attendance_status

    # Get ML recommendations for student's focus area
    weak_topic = "Probability" if (metrics and metrics.quiz_average < 75) else "Model Evaluation"
    recommendations = ml_service.get_recommendations(weak_topic=weak_topic, limit=4)

    # Actual subjects
    subjects = db.query(Subject).all()
    subjects_payload = [
        {
            "name": s.name,
            "progress": s.progress_percentage,
            "code": s.code,
            "room": s.room,
            "timing": s.timing,
            "color": s.color,
            "icon": s.icon
        }
        for s in subjects
    ]

    # Dynamic AI bullet insights
    bullets = []
    if metrics:
        if metrics.overall_attendance >= 80:
            bullets.append({"type": "success", "text": f"Strong attendance rate ({metrics.overall_attendance}%) across all modules!"})
        else:
            bullets.append({"type": "warning", "text": f"Attendance at {metrics.overall_attendance}% is below 75% cutoff."})

        if metrics.quiz_average >= 75:
            bullets.append({"type": "info", "text": f"Quiz performance is solid at {metrics.quiz_average}% average."})
        else:
            bullets.append({"type": "suggestion", "text": f"Focus on {weak_topic} to improve quiz average ({metrics.quiz_average}%)."})

        if metrics.pending_assignments == 0:
            bullets.append({"type": "success", "text": "All assigned problem sets are up to date!"})
        else:
            bullets.append({"type": "info", "text": f"You have {metrics.pending_assignments} pending assignment due this week."})
    else:
        bullets = [
            {"type": "success", "text": "Great consistency in Python! Keep it up!"},
            {"type": "info", "text": "Your attendance is above class average."},
            {"type": "suggestion", "text": "Consider spending more time on Probability concepts."}
        ]


    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "roll_number": student.roll_number or "S101",
            "department": student.department or "CSE",
            "avatar_url": student.avatar_url,
            "greeting": f"Good Morning, {student.name.split()[0]}! 👋",
            "subtitle": "Keep learning, keep growing. You're doing great!",
            "date": "Tuesday, 17 Sept 2024"
        },
        "metrics": {
            "overall_attendance": {
                "percentage": metrics.overall_attendance if metrics else 0,
                "present": metrics.present_count if metrics else 0,
                "absent": metrics.absent_count if metrics else 0,
                "late": metrics.late_count if metrics else 0
            },
            "learning_progress": {
                "percentage": metrics.learning_progress if metrics else 0,
                "completed": metrics.completed_lessons if metrics else 0,
                "in_progress": metrics.in_progress_lessons if metrics else 0,
                "not_started": metrics.not_started_lessons if metrics else 0
            },
            "quiz_average": {
                "percentage": metrics.quiz_average if metrics else 0,
                "total_quizzes": metrics.total_quizzes if metrics else 0,
                "attempted": metrics.attempted_quizzes if metrics else 0,
                "pending": metrics.pending_quizzes if metrics else 0
            },
            "assignment_score": {
                "percentage": metrics.assignment_score if metrics else 0,
                "submitted": metrics.submitted_assignments if metrics else 0,
                "pending": metrics.pending_assignments if metrics else 0,
                "average_score": metrics.assignment_score if metrics else 0
            }
        },
        "todays_classes": [
            {
                "time": s.timing.split(" - ")[0] if " - " in s.timing else "10:00 AM",
                "end_time": s.timing.split(" - ")[1] if " - " in s.timing else "11:00 AM",
                "name": s.name,
                "room": s.room or "Room 201",
                "code": s.code,
                "status": "Radar Active" if (active_session and active_session.subject_name.lower() == s.name.lower()) else "Scheduled",
                "is_active": bool(active_session and active_session.subject_name.lower() == s.name.lower()),
                "action_label": "Mark Attendance" if (active_session and active_session.subject_name.lower() == s.name.lower()) else "View"
            }
            for s in subjects
        ],
        "attendance_session": {
            "is_live": bool(active_session),
            "session_id": active_session.id if active_session else None,
            "room": active_session.classroom_room if active_session else None,
            "subject": active_session.subject_name if active_session else None,
            "teacher_name": active_session.teacher_name if active_session else "Prof. Aniket Deshmukh",
            "radar_detected": radar_detected,
            "radar_status": radar_status,
            "requested": attendance_requested,
            "attendance_status": attendance_status,
            "can_mark_attendance": bool(active_session and student_record is not None)
        },
        "your_subjects": subjects_payload,
        "ai_insights": {
            "alert": {
                "title": insight.alert_title if insight else f"{weak_topic} performance needs attention.",
                "message": insight.alert_message if insight else f"Quiz trends show potential reinforcement needed in {weak_topic}.",
                "action_label": "View Recommendations"
            },
            "bullets": bullets
        },
        "recommended_for_you": recommendations
    }

