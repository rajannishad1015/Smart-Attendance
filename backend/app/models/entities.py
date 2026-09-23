"""
Database Models for SmartAttend AI
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student") # 'student', 'teacher', 'admin'
    avatar_url = Column(String(255), default="/avatars/default.png")
    roll_number = Column(String(20), index=True, nullable=True) # e.g. S101
    department = Column(String(50), default="Computer Science")
    created_at = Column(DateTime, default=datetime.utcnow)

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True) # e.g. "Room 201"
    building = Column(String(50), default="Engineering Block A")
    capacity = Column(Integer, default=60)
    radar_device_id = Column(String(50), default="RADAR_001")

class RadarDevice(Base):
    __tablename__ = "radar_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True) # e.g. "RADAR_001"
    classroom_id = Column(String(50), default="ROOM_201")
    status = Column(String(20), default="ONLINE") # 'ONLINE', 'OFFLINE', 'MAINTENANCE'
    last_seen = Column(DateTime, default=datetime.utcnow)
    firmware_version = Column(String(20), default="v2.4.1")

class RadarEvent(Base):
    __tablename__ = "radar_events"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True)
    classroom_id = Column(String(50), index=True)
    student_identifier = Column(String(50), index=True) # e.g. "S101"
    signal_strength = Column(Float, default=0.85)
    status = Column(String(20), default="DETECTED") # 'DETECTED', 'WEAK_SIGNAL', 'NOT_DETECTED'
    detected_at = Column(DateTime, default=datetime.utcnow)

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True) # e.g. "ML-2024-09-17-001"
    subject_name = Column(String(100), nullable=False) # e.g. "Machine Learning"
    classroom_room = Column(String(50), default="Room 201")
    teacher_id = Column(Integer, ForeignKey("users.id"))
    teacher_name = Column(String(100), default="Prof. Aniket Deshmukh")
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="ACTIVE") # 'ACTIVE', 'ENDED'
    total_students = Column(Integer, default=50)
    detected_count = Column(Integer, default=42)
    requested_count = Column(Integer, default=38)
    marked_count = Column(Integer, default=36)
    not_detected_count = Column(Integer, default=8)

    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    student_name = Column(String(100))
    roll_number = Column(String(20), index=True) # "S101"
    avatar_url = Column(String(255))
    radar_status = Column(String(20), default="DETECTED") # 'DETECTED', 'WEAK_SIGNAL', 'NOT_DETECTED'
    request_status = Column(String(10), default="YES") # 'YES', 'NO'
    selfie_url = Column(Text, nullable=True)
    selfie_verified = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(200), nullable=True)
    geo_verified = Column(Boolean, default=True)
    photo_timestamp = Column(DateTime, nullable=True)
    attendance_status = Column(String(20), default="PRESENT") # 'PRESENT', 'ABSENT', 'LATE'
    marked_at = Column(DateTime, default=datetime.utcnow)
    marked_by = Column(String(50), default="TEACHER")

    session = relationship("AttendanceSession", back_populates="records")

class AttendanceAuditLog(Base):
    __tablename__ = "attendance_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    student_id = Column(Integer, index=True)
    student_name = Column(String(100))
    old_status = Column(String(20))
    new_status = Column(String(20))
    changed_by = Column(String(100))
    reason = Column(String(255), default="Manual teacher adjustment")
    timestamp = Column(DateTime, default=datetime.utcnow)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. "Machine Learning", "Statistics"
    code = Column(String(20), unique=True)
    room = Column(String(50), default="Room 201")
    timing = Column(String(50), default="10:00 AM - 11:00 AM")
    progress_percentage = Column(Integer, default=75)
    color = Column(String(20), default="blue")
    icon = Column(String(50), default="book")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String(100), default="Statistics")
    title = Column(String(150), nullable=False)
    topic = Column(String(100), default="Probability")
    total_questions = Column(Integer, default=10)
    duration_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_option = Column(String(5), nullable=False) # 'A', 'B', 'C', 'D'
    explanation = Column(Text)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float, default=0.0) # e.g. 75.0
    correct_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=10)
    time_taken_seconds = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String(100), default="Machine Learning")
    title = Column(String(150), nullable=False)
    instructions = Column(Text)
    due_date = Column(DateTime)
    total_marks = Column(Integer, default=100)
    status = Column(String(20), default="ACTIVE") # 'ACTIVE', 'CLOSED'

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    file_name = Column(String(255))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="SUBMITTED") # 'SUBMITTED', 'GRADED', 'LATE'
    marks_obtained = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

class StudentMetrics(Base):
    __tablename__ = "student_metrics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), unique=True)
    overall_attendance = Column(Integer, default=82)
    present_count = Column(Integer, default=42)
    absent_count = Column(Integer, default=7)
    late_count = Column(Integer, default=3)
    learning_progress = Column(Integer, default=72)
    completed_lessons = Column(Integer, default=24)
    in_progress_lessons = Column(Integer, default=8)
    not_started_lessons = Column(Integer, default=5)
    quiz_average = Column(Integer, default=76)
    total_quizzes = Column(Integer, default=12)
    attempted_quizzes = Column(Integer, default=10)
    pending_quizzes = Column(Integer, default=2)
    assignment_score = Column(Integer, default=81)
    submitted_assignments = Column(Integer, default=9)
    pending_assignments = Column(Integer, default=2)

class MLStudentInsight(Base):
    __tablename__ = "ml_student_insights"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), unique=True)
    risk_label = Column(String(20), default="MEDIUM") # 'LOW', 'MEDIUM', 'HIGH'
    risk_probability = Column(Float, default=0.68)
    predicted_score_min = Column(Float, default=68.0)
    predicted_score_max = Column(Float, default=74.0)
    engagement_level = Column(String(20), default="HIGH")
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.15)
    cluster_name = Column(String(100), default="Cluster B: High Attendance + High Performance")
    alert_title = Column(String(150), default="Statistics performance has declined recently.")
    alert_message = Column(Text, default="Your quiz scores have dropped by 18% in the last 3 weeks.")
    contributing_signals = Column(Text) # JSON string with factors
    updated_at = Column(DateTime, default=datetime.utcnow)
