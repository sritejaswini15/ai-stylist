import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import base64

from database.session import get_db
from models.user import User
from models.clothing import Clothing
from schemas.clothing import Clothing as ClothingSchema, ClothingCreate, ClothingUpdate
from api.deps import get_current_user
from services.image_processing import remove_background, compress_image
from services.ai_classifier import classify_clothing
from services.hf_service import get_image_embedding

router = APIRouter()

@router.post("/upload", response_model=ClothingSchema)
async def upload_clothing(
    clothing_in: ClothingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a clothing image, process it, and store in wardrobe.
    """
    print(f"[API] Uploading clothing for user {current_user.id}...")
    
    # 1. Compress image to reasonable size for APIs (CPU intensive, synchronous is fine for now)
    compressed_img = compress_image(clothing_in.image_base64)
    
    # 2. Remove background (Async API call)
    processed_img = await remove_background(compressed_img)
    
    # 3. AI Classification & Generate Visual DNA (Concurrent Async Calls)
    # We do these in parallel to save time
    print(f"[API] Starting classification and embedding generation concurrently...")
    classification_task = classify_clothing(processed_img)
    embedding_task = get_image_embedding(processed_img)
    
    classification, visual_embedding = await asyncio.gather(
        classification_task, 
        embedding_task
    )
    
    print(f"[API] Classification received: {classification}")
    if visual_embedding:
        print(f"[API] Visual embedding generated successfully")
    
    # 5. Create database record
    try:
        new_clothing = Clothing(
            user_id=current_user.id,
            image_base64=processed_img,
            category=classification.get("category"),
            sub_category=classification.get("sub_category"),
            color=classification.get("color"),
            style=classification.get("style"),
            occasion=classification.get("occasion", []),
            style_aesthetic=classification.get("style_aesthetic", []),
            mood=classification.get("mood", []),
            time=classification.get("time", []),
            location=classification.get("location", []),
            weather=classification.get("weather", []),
            specific_colors=classification.get("specific_colors", []),
            color_palette=classification.get("color_palette", []),
            tags=classification.get("tags", []),
            visual_embedding=visual_embedding
        )
        
        db.add(new_clothing)
        db.commit()
        db.refresh(new_clothing)
        print(f"[API] Successfully stored clothing item {new_clothing.id}")
        return new_clothing
    except Exception as e:
        print(f"[API] Error saving to database: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save clothing item to database"
        )

@router.get("/", response_model=List[ClothingSchema])
def get_wardrobe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all clothes in the user's wardrobe.
    """
    return db.query(Clothing).filter(Clothing.user_id == current_user.id).all()

@router.patch("/{clothing_id}", response_model=ClothingSchema)
def update_clothing(
    clothing_id: int,
    clothing_update: ClothingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update clothing metadata or tags.
    """
    db_clothing = db.query(Clothing).filter(
        Clothing.id == clothing_id, 
        Clothing.user_id == current_user.id
    ).first()
    
    if not db_clothing:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    update_data = clothing_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_clothing, key, value)
    
    db.commit()
    db.refresh(db_clothing)
    return db_clothing

@router.patch("/{clothing_id}/favorite", response_model=ClothingSchema)
def toggle_favorite(
    clothing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle the favorite status of a clothing item.
    """
    db_clothing = db.query(Clothing).filter(
        Clothing.id == clothing_id, 
        Clothing.user_id == current_user.id
    ).first()
    
    if not db_clothing:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    db_clothing.is_favorite = not db_clothing.is_favorite
    db.commit()
    db.refresh(db_clothing)
    return db_clothing

@router.delete("/{clothing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clothing(
    clothing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a clothing item from the wardrobe.
    """
    db_clothing = db.query(Clothing).filter(
        Clothing.id == clothing_id, 
        Clothing.user_id == current_user.id
    ).first()
    
    if not db_clothing:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    db.delete(db_clothing)
    db.commit()
    return None
