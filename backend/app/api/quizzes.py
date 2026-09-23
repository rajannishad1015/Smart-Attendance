"""
Quizzes and Assessments API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import Quiz, QuizQuestion, QuizAttempt, StudentMetrics
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

class QuizSubmitRequest(BaseModel):
    quiz_id: int
    student_id: int
    answers: Dict[str, str] # {question_id: selected_option}
    time_taken_seconds: int

@router.get("/")
def list_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).all()
    return [
        {
            "id": q.id,
            "subject_name": q.subject_name,
            "title": q.title,
            "topic": q.topic,
            "total_questions": q.total_questions,
            "duration_minutes": q.duration_minutes
        }
        for q in quizzes
    ]

@router.get("/student/{student_id}/attempts")
def get_student_quiz_attempts(student_id: int, db: Session = Depends(get_db)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).order_by(QuizAttempt.id.desc()).all()
    results = []
    for a in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        results.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "quiz_title": quiz.title if quiz else f"Quiz #{a.quiz_id}",
            "subject_name": quiz.subject_name if quiz else "General",
            "score": a.score,
            "correct_count": a.correct_count,
            "total_questions": a.total_questions,
            "passed": a.score >= 60.0,
            "attempted_at": a.attempted_at.strftime("%b %d, %I:%M %p") if a.attempted_at else "Recently"
        })
    return results

@router.get("/{quiz_id}")
def get_quiz_details(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    return {
        "id": quiz.id,
        "subject_name": quiz.subject_name,
        "title": quiz.title,
        "topic": quiz.topic,
        "duration_minutes": quiz.duration_minutes,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": {
                    "A": q.option_a,
                    "B": q.option_b,
                    "C": q.option_c,
                    "D": q.option_d
                },
                "correct_option": q.correct_option,
                "explanation": q.explanation
            }
            for q in questions
        ]
    }

@router.post("/submit")
def submit_quiz_attempt(payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    correct = 0
    total = len(questions)

    for q in questions:
        user_ans = payload.answers.get(str(q.id))
        if user_ans == q.correct_option:
            correct += 1

    score_pct = round((correct / total * 100), 1) if total > 0 else 0.0

    attempt = QuizAttempt(
        student_id=payload.student_id,
        quiz_id=payload.quiz_id,
        score=score_pct,
        correct_count=correct,
        total_questions=total,
        time_taken_seconds=payload.time_taken_seconds
    )
    db.add(attempt)

    # Dynamically update real student metrics in DB
    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == payload.student_id).first()
    if metrics:
        metrics.attempted_quizzes += 1
        if metrics.pending_quizzes > 0:
            metrics.pending_quizzes -= 1
        # Recalculate average
        metrics.quiz_average = int(round((metrics.quiz_average + score_pct) / 2))
        metrics.learning_progress = int(round((metrics.overall_attendance + metrics.quiz_average) / 2))

    db.commit()

    return {
        "attempt_id": attempt.id,
        "score_percentage": score_pct,
        "correct_count": correct,
        "total_questions": total,
        "time_taken_seconds": payload.time_taken_seconds,
        "passed": score_pct >= 60.0
    }

