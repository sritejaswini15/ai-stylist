from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from models.base import Base

class Clothing(Base):
    __tablename__ = "clothing"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Image stored as base64 (processed)
    image_base64 = Column(Text, nullable=False)
    
    # Metadata
    category = Column(String, nullable=True)
    sub_category = Column(String, nullable=True)
    color = Column(String, nullable=True)
    style = Column(String, nullable=True)
    
    # Tag arrays
    occasion = Column(JSON, default=list)
    style_aesthetic = Column(JSON, default=list)
    mood = Column(JSON, default=list)
    time = Column(JSON, default=list)
    location = Column(JSON, default=list)
    weather = Column(JSON, default=list)
    specific_colors = Column(JSON, default=list)
    color_palette = Column(JSON, default=list)
    
    # General expressive tags
    tags = Column(JSON, default=list)
    
    # Visual DNA (Hugging Face CLIP embedding)
    visual_embedding = Column(JSON, nullable=True)
    
    is_favorite = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="clothes")
