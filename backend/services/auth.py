from sqlalchemy import func
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate
from core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == func.lower(email)).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(func.lower(User.username) == func.lower(username)).first()

def create_user(db: Session, user_in: UserCreate):
    hashed_password = get_password_hash(user_in.password)
    db_obj = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def authenticate(db: Session, login_id: str, password: str):
    # Try by email first
    user = get_user_by_email(db, login_id)
    if not user:
        # Try by username
        user = get_user_by_username(db, login_id)

    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user