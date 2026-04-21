from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.config import settings
from core.security import create_access_token
from database.session import get_db
from schemas.user import UserCreate, UserResponse, Token
from services import auth as auth_service

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Create new user.
    """
    print(f"[AUTH] Signup attempt for email: {user_in.email}, username: {user_in.username}")
    try:
        user = auth_service.get_user_by_email(db, email=user_in.email)
        if user:
            print(f"[AUTH] Email already exists: {user_in.email}")
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )
        user = auth_service.get_user_by_username(db, username=user_in.username)
        if user:
            print(f"[AUTH] Username already taken: {user_in.username}")
            raise HTTPException(
                status_code=400,
                detail="The username is already taken.",
            )
        user = auth_service.create_user(db, user_in=user_in)
        print(f"[AUTH] User created successfully: {user.username}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Unexpected signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)) -> Any:
    user = auth_service.get_user_by_email(db, email=email)
    return {"available": user is None}

@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)) -> Any:
    user = auth_service.get_user_by_username(db, username=username)
    return {"available": user is None}

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    print(f"[AUTH] Login attempt for: {form_data.username}")
    try:
        user = auth_service.authenticate(db, login_id=form_data.username, password=form_data.password)
        if not user:
            print(f"[AUTH] Authentication failed for: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        elif not user.is_active:
            print(f"[AUTH] Inactive user login attempt: {form_data.username}")
            raise HTTPException(status_code=400, detail="Inactive user")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            user.email, expires_delta=access_token_expires
        )
        print(f"[AUTH] Login successful for: {user.username}")
        return {
            "access_token": token,
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Unexpected login error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
