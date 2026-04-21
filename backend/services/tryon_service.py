import os
import base64
import io
import time
import requests
from PIL import Image
from gradio_client import Client, handle_file
from core.config import settings
from services.image_processing import compress_image

def base64_to_temp_file(base64_str, filename):
    if not base64_str: return None
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    
    img_data = base64.b64decode(base64_str)
    temp_path = os.path.join("temp", filename)
    os.makedirs("temp", exist_ok=True)
    
    with open(temp_path, "wb") as f:
        f.write(img_data)
    return temp_path

def run_ai_tryon(person_img_base64: str, garment_img_base64: str, garment_description: str = "clothing item") -> str:
    """
    Simplified and Stable Virtual Try-On optimized strictly for Tops.
    Uses the high-fidelity IDM-VTON model.
    """
    person_path = None
    garment_path = None
    
    # 1. Pre-process images for best AI results
    person_img_proc = compress_image(person_img_base64, max_size=1024)
    garment_img_proc = compress_image(garment_img_base64, max_size=1024)

    # 2. Reliable Spaces for Upper Body (Tops)
    spaces = [
        "yisol/IDM-VTON",
        "vinesmsuic/IDM-VTON",
        "Nymbo/Virtual-Try-On"
    ]
    
    # 3. Use multiple tokens to bypass quotas
    tokens = [settings.HF_TOKEN, settings.HF_TOKEN_ALT, None]
    unique_tokens = [t for t in tokens if t or t is None]

    last_error = ""

    for space_id in spaces:
        for token in unique_tokens:
            try:
                print(f"[TryOnService] Synthesis Mode: Tops | Space: {space_id}")
                timestamp = int(time.time() * 1000)
                person_path = base64_to_temp_file(person_img_proc, f"p_{timestamp}.png")
                garment_path = base64_to_temp_file(garment_img_proc, f"g_{timestamp}.png")
                
                client = Client(space_id, hf_token=token)
                
                # Standard IDM-VTON Upper-Body Call
                result = client.predict(
                    dict={"background": handle_file(person_path), "layers": [], "composite": None},
                    garm_img=handle_file(garment_path),
                    garment_des=garment_description,
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )
                
                output_path = result[0] if isinstance(result, (list, tuple)) else result
                
                if output_path and os.path.exists(output_path):
                    with open(output_path, "rb") as f:
                        res_b64 = base64.b64encode(f.read()).decode('utf-8')
                    return f"data:image/png;base64,{res_b64}"
                
            except Exception as e:
                last_error = str(e)
                print(f"[TryOnService] Failed {space_id}: {last_error[:50]}...")
                continue
            finally:
                if person_path and os.path.exists(person_path): os.remove(person_path)
                if garment_path and os.path.exists(garment_path): os.remove(garment_path)

    raise Exception(f"Synthesis failed. The AI servers are busy. Please try again in 1-2 minutes.")
