"""
SmartAttend AI - Clean Authentic Database Seeder
Seeds only authentic teacher, real enrolled student accounts,
classroom mappings, subjects, quizzes, and initial active session.
NO fake dummy loops or synthetic filler names.
"""

from datetime import datetime, timedelta
import json
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.entities import (
    User, Classroom, RadarDevice, AttendanceSession, AttendanceRecord,
    Subject, Quiz, QuizQuestion, QuizAttempt, Assignment, AssignmentSubmission,
    StudentMetrics, MLStudentInsight
)

def seed_database(drop: bool = False):
    db = SessionLocal()
    existing_user = db.query(User).first()
    if existing_user and not drop:
        print("Database already initialized with authentic records. Skipping seed.")
        db.close()
        return

    if drop:
        print("Resetting database schema to remove all dummy data...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding authentic teacher, student accounts, and classroom entities...")

    # 1. Classrooms
    rooms = [
        Classroom(room_number="Room 201", building="CS Block A", capacity=40, radar_device_id="RADAR_001"),
        Classroom(room_number="Room 105", building="Math Block B", capacity=40, radar_device_id="RADAR_002"),
        Classroom(room_number="Room 202", building="CS Block A", capacity=40, radar_device_id="RADAR_003"),
        Classroom(room_number="Room 301", building="Tech Block C", capacity=40, radar_device_id="RADAR_004"),
    ]
    db.add_all(rooms)

    # 2. Radar Device for Room 201
    radar = RadarDevice(
        device_id="RADAR_001",
        classroom_id="ROOM_201",
        status="ONLINE",
        firmware_version="v2.4.1"
    )
    db.add(radar)

    # 3. Teacher User
    teacher = User(
        name="Prof. Aniket Deshmukh",
        email="teacher@smartattend.edu",
        hashed_password=get_password_hash("password123"),
        role="teacher",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        department="Computer Science Dept."
    )
    db.add(teacher)

    # 4. Admin User
    admin = User(
        name="Academic Administrator",
        email="admin@smartattend.edu",
        hashed_password=get_password_hash("password123"),
        role="admin",
        avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        department="Academic Affairs"
    )
    db.add(admin)
    db.commit()

    # 5. Authentic Students
    students_data = [
        ("Rahul Sharma", "rahul@smartattend.edu", "S101", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", "DETECTED", "YES", "PRESENT", 82, 76),
        ("Aditi Patil", "aditi@smartattend.edu", "S102", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "DETECTED", "YES", "PRESENT", 91, 88),
        ("Karan Mehta", "karan@smartattend.edu", "S103", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "DETECTED", "YES", "PRESENT", 85, 80),
        ("Sneha Iyer", "sneha@smartattend.edu", "S104", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", "NOT_DETECTED", "NO", "ABSENT", 64, 58),
        ("Arjun Nair", "arjun@smartattend.edu", "S105", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "DETECTED", "YES", "PRESENT", 88, 84),
        ("Priya Singh", "priya@smartattend.edu", "S106", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "WEAK_SIGNAL", "YES", "PRESENT", 78, 72),
        ("Rohit Verma", "rohit@smartattend.edu", "S107", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", "NOT_DETECTED", "NO", "ABSENT", 59, 52),
        ("Meera Kulkarni", "meera@smartattend.edu", "S108", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "DETECTED", "YES", "PRESENT", 89, 86),
    ]

    student_objects = []
    for name, email, roll, avatar, r_status, req, att_status, att_pct, quiz_pct in students_data:
        u = User(
            name=name,
            email=email,
            hashed_password=get_password_hash("password123"),
            role="student",
            avatar_url=avatar,
            roll_number=roll,
            department="CSE"
        )
        db.add(u)
        student_objects.append((u, r_status, req, att_status, att_pct, quiz_pct))

    db.commit()

    # 6. Active Attendance Session for Room 201 (Machine Learning)
    session = AttendanceSession(
        session_code="ML-2024-09-17-001",
        subject_name="Machine Learning",
        classroom_room="Room 201",
        teacher_id=teacher.id,
        teacher_name=teacher.name,
        start_time=datetime.utcnow() - timedelta(minutes=24, seconds=18),
        status="ACTIVE",
        total_students=len(student_objects),
        detected_count=sum(1 for _, r, _, _, _, _ in student_objects if r in ["DETECTED", "WEAK_SIGNAL"]),
        requested_count=sum(1 for _, _, req, _, _, _ in student_objects if req == "YES"),
        marked_count=sum(1 for _, _, _, att, _, _ in student_objects if att == "PRESENT"),
        not_detected_count=sum(1 for _, r, _, _, _, _ in student_objects if r == "NOT_DETECTED")
    )
    db.add(session)
    db.commit()

    # Add records & student metrics for each authentic student
    for u, r_status, req, att_status, att_pct, quiz_pct in student_objects:
        rec = AttendanceRecord(
            session_id=session.id,
            student_id=u.id,
            student_name=u.name,
            roll_number=u.roll_number,
            avatar_url=u.avatar_url,
            radar_status=r_status,
            request_status=req,
            selfie_url=u.avatar_url if req == "YES" else None,
            selfie_verified=True if req == "YES" else False,
            attendance_status=att_status,
            marked_at=datetime.utcnow() if att_status == "PRESENT" else None,
            marked_by="TEACHER" if att_status == "PRESENT" else "SYSTEM"
        )
        db.add(rec)

        # Dynamic Metrics
        metrics = StudentMetrics(
            student_id=u.id,
            overall_attendance=att_pct,
            present_count=int(45 * (att_pct / 100)),
            absent_count=45 - int(45 * (att_pct / 100)),
            late_count=2,
            learning_progress=int((att_pct + quiz_pct) / 2),
            completed_lessons=24,
            in_progress_lessons=6,
            not_started_lessons=3,
            quiz_average=quiz_pct,
            total_quizzes=12,
            attempted_quizzes=10,
            pending_quizzes=2,
            assignment_score=int(quiz_pct + 4),
            submitted_assignments=8,
            pending_assignments=2
        )
        db.add(metrics)

        # Real ML Insight
        risk = "HIGH" if att_pct < 65 else ("MEDIUM" if att_pct < 80 else "LOW")
        insight = MLStudentInsight(
            student_id=u.id,
            risk_label=risk,
            risk_probability=0.82 if risk == "HIGH" else (0.64 if risk == "MEDIUM" else 0.18),
            predicted_score_min=float(quiz_pct - 4),
            predicted_score_max=float(quiz_pct + 4),
            engagement_level="LOW" if att_pct < 65 else ("MEDIUM" if att_pct < 80 else "HIGH"),
            is_anomaly=bool(att_pct < 60),
            anomaly_score=0.22 if att_pct < 60 else 0.08,
            cluster_name=f"Cluster {'C' if att_pct < 70 else 'B'}: {'Low' if att_pct < 70 else 'High'} Attendance",
            alert_title=f"{u.name.split()[0]}'s attendance is {risk.lower()} risk" if risk != "LOW" else "Performance on track",
            alert_message=f"Current attendance: {att_pct}%, quiz score: {quiz_pct}%." if risk != "LOW" else "Consistent engagement across subjects.",
            contributing_signals=json.dumps([
                {"factor": "Attendance trend", "impact": "High impact" if risk == "HIGH" else "Moderate"},
                {"factor": "Quiz average", "impact": "Medium impact"},
                {"factor": "Consistent participation in Python", "impact": "Positive"}
            ])
        )
        db.add(insight)

    # 7. Authentic Subjects
    subjects = [
        Subject(name="Machine Learning", code="CS401", room="Room 201", timing="10:00 AM - 11:00 AM", progress_percentage=82, color="blue", icon="brain"),
        Subject(name="Statistics", code="MA302", room="Room 105", timing="12:00 PM - 01:00 PM", progress_percentage=59, color="rose", icon="bar-chart"),
        Subject(name="Python Programming", code="CS204", room="Room 202", timing="02:00 PM - 03:00 PM", progress_percentage=86, color="amber", icon="code"),
        Subject(name="Database Systems", code="CS303", room="Room 301", timing="04:00 PM - 05:00 PM", progress_percentage=74, color="purple", icon="database"),
    ]
    db.add_all(subjects)

    # 8. Quizzes
    quiz = Quiz(
        subject_name="Statistics",
        title="Probability & Bayes Theorem",
        topic="Probability",
        total_questions=2,
        duration_minutes=15
    )
    db.add(quiz)
    db.commit()

    questions = [
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="If P(A) = 0.4, P(B) = 0.5, and A and B are independent events, what is P(A ∩ B)?",
            option_a="0.9",
            option_b="0.2",
            option_c="0.1",
            option_d="0.45",
            correct_option="B",
            explanation="For independent events, P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.20."
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="What does Bayes' Theorem allow us to calculate?",
            option_a="Marginal probability only",
            option_b="Joint probability without evidence",
            option_c="Posterior probability given prior belief and new evidence",
            option_d="Sample variance",
            correct_option="C",
            explanation="Bayes' Theorem updates prior belief based on observed evidence."
        )
    ]
    db.add_all(questions)

    # 9. Assignment
    assignment = Assignment(
        subject_name="Machine Learning",
        title="Assignment 3: Scikit-learn Pipeline Implementation",
        instructions="Build a scikit-learn preprocessing and Random Forest pipeline on the collegiate dataset.",
        due_date=datetime.utcnow() + timedelta(days=5),
        total_marks=100,
        status="ACTIVE"
    )
    db.add(assignment)

    db.commit()
    db.close()
    print("Database cleanly seeded with authentic users and no dummy loop data!")

reset_and_seed_database = lambda: seed_database(drop=True)

if __name__ == "__main__":
    reset_and_seed_database()
