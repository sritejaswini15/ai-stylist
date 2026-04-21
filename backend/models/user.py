from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    profile_picture = Column(String, nullable=True) # Global profile pic
    stylist_picture = Column(String, nullable=True) # Picture specific to AI Stylist analysis
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Storing these as JSON for now to keep it scalable as requested, 
    # but ideally these would be separate tables later.
    clothes_owned = Column(JSON, default=list)
    fashion_inspo_board = Column(JSON, default=list)
    wishlist = Column(JSON, default=list)
    best_outfits = Column(JSON, default=list)
    saved_generated_outfits = Column(JSON, default=list)
    personalized_mannequin = Column(String, nullable=True) # Base64 of the stitched mannequin

    # Profile fields for fashion advice
    height = Column(Integer, nullable=True) # in cm
    weight = Column(Integer, nullable=True) # in kg
    body_shape = Column(String, nullable=True) # e.g., "Hourglass", "Pear"
    skin_tone = Column(String, nullable=True) # e.g., "Fair", "Deep"
    color_palette = Column(String, nullable=True) # e.g., "Cool Winter"
    sun_reaction = Column(String, nullable=True) # e.g., "Burns easily", "Tans"
    hair_color = Column(String, nullable=True) # e.g., "Natural Black", "Dyed Blonde"
    style_advice = Column(JSON, nullable=True) # detailed advice from AI

    clothes = relationship("Clothing", back_populates="owner", cascade="all, delete-orphan")