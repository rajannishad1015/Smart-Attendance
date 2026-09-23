"""
Pydantic schemas for SmartAttend AI API
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: str
    roll_number: Optional[str] = None
    department: str

# Radar
class RadarEventCreate(BaseModel):
    device_id: str = "RADAR_001"
    classroom_id: str = "ROOM_201"
    student_identifier: str = "S101"
    signal_strength: float = 0.88
    status: str = "DETECTED" # 'DETECTED', 'WEAK_SIGNAL', 'NOT_DETECTED'

class RadarStatusUpdate(BaseModel):
    student_id: Optional[int] = None
    roll_number: str
    radar_status: str # 'DETECTED', 'WEAK_SIGNAL', 'NOT_DETECTED'

# Attendance
class AttendanceSessionCreate(BaseModel):
    subject_name: str = "Machine Learning"
    classroom_room: str = "Room 201"
    total_students: int = 50

class AttendanceSessionStartPayload(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str
    classroom_room: Optional[str] = None
    teacher_id: Optional[int] = None

class AttendanceSessionEndPayload(BaseModel):
    session_id: Optional[int] = None

class AttendanceRequestCreate(BaseModel):
    session_id: int
    student_id: int
    selfie_data: Optional[str] = None # Base64 image data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    timestamp: Optional[str] = None

class AttendanceApprovalPayload(BaseModel):
    record_id: int
    status: str = "PRESENT" # 'PRESENT', 'ABSENT', 'LATE'

class BulkApprovalPayload(BaseModel):
    session_id: int
    status: str = "PRESENT"

class AttendanceModifyPayload(BaseModel):
    record_id: int
    new_status: str
    reason: str = "Manual adjustment"

# Selfie
class SelfieQualityCheck(BaseModel):
    image_base64: str

class SelfieCheckResult(BaseModel):
    valid: bool
    face_count: int
    blur_score: float
    brightness: float
    message: str
    metrics: Dict[str, Any]

# ML & Insights
class MLRiskPredictRequest(BaseModel):
    attendance_percentage: float
    absence_streak: int
    late_count: int
    attendance_trend: float
    classes_attended: int
    classes_missed: int
    quiz_average: float
    assignment_average: float

class MLRiskPredictResponse(BaseModel):
    risk_label: str
    risk_probability: float
    probabilities: Dict[str, float]
    contributing_factors: List[Dict[str, Any]]
    explanation: str

class StudyPlanRequest(BaseModel):
    student_id: int
    available_hours_per_day: float = 2.5
    exam_date: Optional[str] = "2026-10-15"
    weak_topics: List[str] = ["Probability", "Model Evaluation"]

class StudyPlanDay(BaseModel):
    day: str
    subject: str
    topic: str
    duration_minutes: int
    activity_type: str
    recommended_resource: str

class StudyPlanResponse(BaseModel):
    weekly_plan: List[StudyPlanDay]
    total_study_minutes: int
    focus_areas: List[str]
