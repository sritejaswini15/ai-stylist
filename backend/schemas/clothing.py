from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ClothingBase(BaseModel):
    category: Optional[str] = None
    sub_category: Optional[str] = None
    color: Optional[str] = None
    style: Optional[str] = None
    
    occasion: List[str] = []
    style_aesthetic: List[str] = []
    mood: List[str] = []
    time: List[str] = []
    location: List[str] = []
    weather: List[str] = []
    specific_colors: List[str] = []
    color_palette: List[str] = []
    tags: List[str] = []
    is_favorite: bool = False

class ClothingCreate(ClothingBase):
    image_base64: str

class ClothingUpdate(ClothingBase):
    pass

class Clothing(ClothingBase):
    id: int
    user_id: int
    image_base64: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
