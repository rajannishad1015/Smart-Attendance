"""
Radar Presence Service & Device Simulator Gateway
Tracks classroom presence signals from radar devices:
- Status: 'DETECTED', 'WEAK_SIGNAL', 'NOT_DETECTED'
- Signal strength: 0.0 - 1.0
- Updates attendance session presence counts in real time
"""

from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.entities import AttendanceSession, AttendanceRecord, RadarDevice, RadarEvent

class RadarPresenceService:
    def __init__(self):
        # In-memory fast cache of current presence states: {roll_number: {"status": ..., "signal": ...}}
        self._live_presence: Dict[str, Dict[str, Any]] = {}

    def ingest_event(
        self,
        db: Session,
        device_id: str,
        classroom_id: str,
        student_identifier: str,
        signal_strength: float,
        status: str = "DETECTED"
    ) -> Dict[str, Any]:
        """
        Receives radar signal event, verifies device, stores event, and updates live record
        """
        # Save event
        event = RadarEvent(
            device_id=device_id,
            classroom_id=classroom_id,
            student_identifier=student_identifier,
            signal_strength=signal_strength,
            status=status,
            detected_at=datetime.utcnow()
        )
        db.add(event)

        # Update cache
        self._live_presence[student_identifier] = {
            "status": status,
            "signal_strength": signal_strength,
            "detected_at": datetime.utcnow().isoformat()
        }

        # If there is an active session, update student's record
        active_session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
        if active_session:
            record = db.query(AttendanceRecord).filter(
                AttendanceRecord.session_id == active_session.id,
                AttendanceRecord.roll_number == student_identifier
            ).first()
            if record:
                record.radar_status = status
                db.commit()
                # Recalculate session statistics
                self.sync_session_stats(db, active_session.id)

        db.commit()
        return {
            "success": True,
            "student_identifier": student_identifier,
            "status": status,
            "signal_strength": signal_strength
        }

    def sync_session_stats(self, db: Session, session_id: int):
        """
        Recalculates counts for detected, requested, marked present, not detected
        """
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        if not session:
            return

        records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
        session.total_students = len(records)
        session.detected_count = sum(1 for r in records if r.radar_status in ["DETECTED", "WEAK_SIGNAL"])
        session.not_detected_count = sum(1 for r in records if r.radar_status == "NOT_DETECTED")
        session.requested_count = sum(1 for r in records if r.request_status == "YES")
        session.marked_count = sum(1 for r in records if r.attendance_status == "PRESENT")
        db.commit()

radar_service = RadarPresenceService()
