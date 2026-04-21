from typing import Generator, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from core.config import settings
from database.session import get_db
from models.user import User
from schemas.user import TokenData

# Assuming OAuth2PasswordBearer is used for swagger UI support
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Union[str, None] = payload.get("sub")
        if email is None:
            print(f"[AUTH] Token payload missing 'sub': {payload}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(email=email)
    except (JWTError, ValidationError) as e:
        print(f"[AUTH] Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == token_data.email).first()
    if not user:
        print(f"[AUTH] User not found for email: {token_data.email}")
        raise HTTPException(status_code=404, detail="User not found")
    return user