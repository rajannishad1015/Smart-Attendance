"""
Authentication API Endpoints
Supports login via Email or Roll Number, role validation, and token inspection.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.entities import User
from backend.app.schemas.schemas import LoginRequest, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Support logging in with email or roll number (e.g. S101)
    identifier = payload.email.strip()
    user = db.query(User).filter(
        or_(
            User.email == identifier,
            User.roll_number == identifier
        )
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/roll number or password. Please verify your credentials."
        )

    access_token = create_access_token(data={
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
        "name": user.name
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "roll_number": user.roll_number,
            "department": user.department
        }
    }

@router.get("/me")
def get_me(email: str = None, user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if user_id:
        user = query.filter(User.id == user_id).first()
    elif email:
        user = query.filter(User.email == email).first()
    else:
        user = query.first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "roll_number": user.roll_number,
        "department": user.department
    }
