from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    profile_picture: Optional[str] = None
    stylist_picture: Optional[str] = None
    clothes_owned: Optional[List[dict]] = None
    fashion_inspo_board: Optional[List[dict]] = None
    best_outfits: Optional[List[dict]] = None
    saved_generated_outfits: Optional[List[dict]] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    body_shape: Optional[str] = None
    skin_tone: Optional[str] = None
    color_palette: Optional[str] = None
    sun_reaction: Optional[str] = None
    hair_color: Optional[str] = None
    style_advice: Optional[dict] = None

class UserLogin(BaseModel):
    login_id: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    full_name: Optional[str] = None
    age: Optional[int] = None
    profile_picture: Optional[str] = None
    clothes_owned: List[dict] = []
    fashion_inspo_board: List[dict] = []
    best_outfits: List[dict] = []
    saved_generated_outfits: List[dict] = []
    height: Optional[int] = None
    weight: Optional[int] = None
    body_shape: Optional[str] = None
    skin_tone: Optional[str] = None
    color_palette: Optional[str] = None
    sun_reaction: Optional[str] = None
    hair_color: Optional[str] = None
    style_advice: Optional[dict] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
