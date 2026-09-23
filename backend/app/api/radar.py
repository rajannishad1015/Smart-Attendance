"""
Radar Hardware Gateway & Simulation API
Endpoints for ingesting presence signals and simulating classroom detection events.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import RadarDevice, RadarEvent, AttendanceRecord, AttendanceSession
from backend.app.schemas.schemas import RadarEventCreate, RadarStatusUpdate
from backend.app.services.radar_service import radar_service

router = APIRouter(prefix="/radar", tags=["radar"])

@router.post("/event")
def ingest_radar_event(payload: RadarEventCreate, db: Session = Depends(get_db)):
    """
    Receives presence event from physical radar gateway or simulator:
    {
      "device_id": "RADAR_001",
      "classroom_id": "ROOM_201",
      "student_identifier": "S101",
      "signal_strength": 0.88,
      "status": "DETECTED"
    }
    """
    # Verify registered device
    device = db.query(RadarDevice).filter(RadarDevice.device_id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=403, detail="Unregistered radar device rejected.")

    res = radar_service.ingest_event(
        db=db,
        device_id=payload.device_id,
        classroom_id=payload.classroom_id,
        student_identifier=payload.student_identifier,
        signal_strength=payload.signal_strength,
        status=payload.status
    )
    return res

@router.post("/simulate-presence")
def simulate_presence(payload: RadarStatusUpdate, db: Session = Depends(get_db)):
    """
    Interactive toggle for Teacher Dashboard or Radar Simulator to change student signal state:
    'DETECTED' (green) | 'WEAK_SIGNAL' (amber) | 'NOT_DETECTED' (red)
    """
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    if not session:
        raise HTTPException(status_code=404, detail="No active attendance session.")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.roll_number == payload.roll_number
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail=f"Student {payload.roll_number} not found in session.")

    record.radar_status = payload.radar_status
    db.commit()

    # Recalculate session stats
    radar_service.sync_session_stats(db, session.id)

    return {
        "success": True,
        "roll_number": payload.roll_number,
        "student_name": record.student_name,
        "new_radar_status": record.radar_status,
        "session_stats": {
            "total": session.total_students,
            "detected": session.detected_count,
            "not_detected": session.not_detected_count
        }
    }

@router.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(RadarDevice).all()
    return [
        {
            "device_id": d.device_id,
            "classroom_id": d.classroom_id,
            "status": d.status,
            "firmware_version": d.firmware_version,
            "last_seen": d.last_seen.isoformat() if d.last_seen else None
        }
        for d in devices
    ]
