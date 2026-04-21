from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from api.deps import get_current_user
from database.session import get_db
from models.user import User
from services.chatbot_service import get_chatbot_response

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/")
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Create a summary of the wardrobe for context
        wardrobe_items = []
        for c in current_user.clothes:
            wardrobe_items.append(f"{c.color or 'Unknown'} {c.sub_category or c.category or 'Item'}")
        
        wardrobe_summary = ", ".join(wardrobe_items[:20]) # Limit to 20 items for context efficiency
        if len(wardrobe_items) > 20:
            wardrobe_summary += f", and {len(wardrobe_items) - 20} more items."

        user_profile = {
            "username": current_user.full_name or current_user.username,
            "body_shape": current_user.body_shape,
            "color_palette": current_user.color_palette,
            "skin_tone": current_user.skin_tone,
            "sun_reaction": current_user.sun_reaction,
            "hair_color": current_user.hair_color,
            "style_advice": current_user.style_advice,
            "wardrobe_summary": wardrobe_summary
        }
        
        # Convert Pydantic history objects to dicts for the service
        # Frontend uses 'assistant'/'user', service handles 'model'/'assistant'/'user'
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in req.history]
        
        response_text = get_chatbot_response(req.message, history_dicts, user_profile)
        
        profile_updated = False
        # Check for automated updates [UPDATE: field=value]
        if "[UPDATE:" in response_text:
            try:
                import re
                # Improved regex to handle multiple updates
                updates = re.findall(r"\[UPDATE:\s*(\w+)=([^\]]+)\]", response_text)
                for field, value in updates:
                    field = field.strip()
                    value = value.strip()
                    if hasattr(current_user, field):
                        setattr(current_user, field, value)
                        print(f"[CHAT UPDATE] {field} set to {value}")
                        profile_updated = True
                
                db.commit()
                # Clean tag from response
                response_text = re.sub(r"\[UPDATE:[^\]]+\]", "", response_text).strip()
            except Exception as update_err:
                db.rollback()
                print(f"[CHAT UPDATE ERROR] {update_err}")

        return {"status": "success", "data": {"response": response_text, "profile_updated": profile_updated}}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
