import httpx
import base64
import io
from PIL import Image
from core.config import settings

async def remove_background(image_base64: str) -> str:
    """
    Removes background using remove.bg API (Async).
    Local AI removal was removed to reduce dependencies.
    """
    if not settings.REMOVE_BG_API_KEY:
        print("[ImageProcessing] No API key, returning original.")
        return image_base64

    try:
        # Clean base64
        clean_base64 = image_base64
        if "," in image_base64:
            clean_base64 = image_base64.split(",")[1]
        image_data = base64.b64decode(clean_base64)
        
        async with httpx.AsyncClient() as client:
            files = {'image_file': ('image.png', image_data)}
            data = {'size': 'auto'}
            headers = {'X-Api-Key': settings.REMOVE_BG_API_KEY}
            
            response = await client.post(
                'https://api.remove.bg/v1.0/removebg',
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                print("[ImageProcessing] API background removal successful.")
                return base64.b64encode(response.content).decode('utf-8')
            else:
                print(f"[ImageProcessing] API failed: {response.status_code} {response.text}")
                return image_base64
    except Exception as e:
        print(f"[ImageProcessing] Removal failed: {e}")
        return image_base64

def compress_image(image_base64: str, max_size: int = 1024) -> str:
    """
    Compresses image to ensure it's not too large for APIs and saves as PNG to preserve transparency.
    """
    try:
        if not image_base64:
            return ""

        # Handle header
        clean_base64 = image_base64
        if "," in image_base64:
            clean_base64 = image_base64.split(",")[1]

        image_data = base64.b64decode(clean_base64)
        img = Image.open(io.BytesIO(image_data))
        
        # Ensure image is in a mode that supports transparency if we eventually get it
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")
            
        # Resize if too large
        if max(img.size) > max_size:
            print(f"[ImageProcessing] Resizing image from {img.size} to max {max_size}")
            img.thumbnail((max_size, max_size), Image.LANCZOS)
        
        output = io.BytesIO()
        # Save as PNG
        img.save(output, format="PNG", optimize=True)
        return base64.b64encode(output.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"[ImageProcessing] Exception during image compression: {e}")
        return image_base64
