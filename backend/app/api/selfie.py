"""
Selfie Evidence Quality API
Uses OpenCV for blur, brightness, and face presence detection.
NO Deep Learning - purely deterministic computer vision.
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.schemas import SelfieQualityCheck, SelfieCheckResult
from backend.app.services.cv_service import cv_service

router = APIRouter(prefix="/selfie", tags=["selfie"])

@router.post("/validate", response_model=SelfieCheckResult)
def validate_selfie(payload: SelfieQualityCheck):
    """
    Analyzes uploaded selfie image data without deep learning:
    - Blur / Sharpness (Laplacian variance)
    - Exposure / Brightness (Mean grayscale intensity)
    - Face presence detection (OpenCV Haar Cascade)
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Image base64 data required.")

    result = cv_service.validate_selfie_base64(payload.image_base64)
    return result
