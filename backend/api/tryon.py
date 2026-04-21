from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from api.deps import get_current_user
from models.user import User
from services.tryon_service import run_ai_tryon

router = APIRouter()

class TryOnRequest(BaseModel):
    person_image: str # Base64
    garment_image: str # Base64
    garment_description: Optional[str] = "clothing item"

@router.post("/")
async def create_tryon(
    request: TryOnRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Perform a virtual AI try-on.
    """
    try:
        import asyncio
        print(f"[API] Virtual Try-On requested by user {current_user.id}")
        result_url = await asyncio.to_thread(
            run_ai_tryon,
            request.person_image, 
            request.garment_image, 
            request.garment_description
        )
        return {"status": "success", "image_url": result_url}
    except Exception as e:
        print(f"[API] Try-on failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Virtual try-on failed: {str(e)}"
        )
