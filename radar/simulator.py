"""
SmartAttend AI - Interactive Radar Presence Simulator
Simulates a classroom mmWave radar device or beacon gateway sending presence events:
{
  "device_id": "RADAR_001",
  "classroom_id": "ROOM_201",
  "student_identifier": "S101",
  "detected_at": "timestamp",
  "signal_strength": 0.88,
  "status": "DETECTED"
}
Can run in single-event or continuous classroom simulation mode.
"""

import time
import random
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api/radar/event"
DEVICE_ID = "RADAR_001"
CLASSROOM_ID = "ROOM_201"

def send_radar_event(student_id: str, status: str = "DETECTED", strength: float = 0.88):
    payload = {
        "device_id": DEVICE_ID,
        "classroom_id": CLASSROOM_ID,
        "student_identifier": student_id,
        "signal_strength": round(strength, 2),
        "status": status
    }
    try:
        resp = requests.post(API_URL, json=payload, timeout=3)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent event for {student_id}: {status} (Strength: {strength}) -> Status {resp.status_code}")
        return resp.json()
    except Exception as e:
        print(f"Failed to send event: {e}")
        return None

def simulate_classroom_entry(total_students: int = 50):
    print(f"Starting classroom presence simulation for {CLASSROOM_ID}...")
    for i in range(1, total_students + 1):
        roll = f"S{100+i}"
        if i in [4, 7, 12, 19, 27, 33, 41, 48]:
            status = "NOT_DETECTED"
            strength = 0.15
        elif i in [6, 15, 30]:
            status = "WEAK_SIGNAL"
            strength = random.uniform(0.40, 0.58)
        else:
            status = "DETECTED"
            strength = random.uniform(0.75, 0.98)

        send_radar_event(roll, status=status, strength=strength)
        time.sleep(0.05)

    print("Classroom radar presence simulation complete.")

if __name__ == "__main__":
    simulate_classroom_entry()
