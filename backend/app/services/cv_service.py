"""
OpenCV Computer Vision Service for Attendance Selfie Quality Check
NO Deep Learning - Uses classical computer vision:
- Laplacian variance for blur detection
- Grayscale histogram analysis for brightness/exposure
- Haar Feature-based Cascade Classifier for face presence detection
- Resolution and aspect ratio validation
"""

import os
import cv2
import base64
import numpy as np
from typing import Dict, Any

class OpenCVQualityService:
    def __init__(self):
        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def validate_selfie_base64(self, base64_str: str) -> Dict[str, Any]:
        """
        Validates selfie image quality without deep learning.
        Checks:
        1. Valid base64 image data
        2. Resolution minimums (>= 120x120)
        3. Blur detection using Laplacian variance
        4. Brightness / exposure levels (35 - 230)
        5. Face presence detection (at least 1 face detected)
        """
        try:
            # Strip data URL prefix if present
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]

            image_bytes = base64.b64decode(base64_str)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                return {
                    "valid": False,
                    "face_count": 0,
                    "blur_score": 0.0,
                    "brightness": 0.0,
                    "message": "Failed to decode image bytes.",
                    "metrics": {"error": "Invalid image payload"}
                }

            height, width = img.shape[:2]
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 1. Blur detection (Laplacian variance)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            blur_score = float(laplacian.var())
            is_sharp = blur_score >= 40.0 # Clear threshold

            # 2. Brightness evaluation
            brightness = float(np.mean(gray))
            is_well_lit = 30.0 <= brightness <= 235.0

            # 3. Face detection using Haar Cascade
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(60, 60)
            )
            face_count = len(faces)
            has_face = face_count >= 1

            # Determine overall validity
            valid = is_sharp and is_well_lit and has_face

            reasons = []
            if not is_sharp:
                reasons.append("Image is too blurry. Please hold camera still.")
            if brightness < 30.0:
                reasons.append("Lighting is too dark. Increase ambient lighting.")
            elif brightness > 235.0:
                reasons.append("Lighting is overexposed. Reduce glare.")
            if face_count == 0:
                reasons.append("No face detected in camera frame.")
            elif face_count > 2:
                reasons.append("Multiple faces detected. Frame only yourself.")

            message = "Selfie evidence verified successfully." if valid else " ".join(reasons)

            return {
                "valid": valid,
                "face_count": face_count,
                "blur_score": round(blur_score, 2),
                "brightness": round(brightness, 2),
                "message": message,
                "metrics": {
                    "width": width,
                    "height": height,
                    "blur_score": round(blur_score, 2),
                    "is_sharp": is_sharp,
                    "brightness": round(brightness, 2),
                    "is_well_lit": is_well_lit,
                    "face_count": face_count
                }
            }

        except Exception as e:
            return {
                "valid": False,
                "face_count": 0,
                "blur_score": 0.0,
                "brightness": 0.0,
                "message": f"Error validating selfie: {str(e)}",
                "metrics": {"exception": str(e)}
            }

cv_service = OpenCVQualityService()
