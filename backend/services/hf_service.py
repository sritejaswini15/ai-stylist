import numpy as np
import requests
import base64
from core.config import settings

def calculate_similarity(vec1: list, vec2: list) -> float:
    """
    Calculate cosine similarity between two vectors.
    Returns a score between -1 and 1 (1 being identical).
    """
    if not vec1 or not vec2:
        return 0.0
        
    try:
        a = np.array(vec1).flatten()
        b = np.array(vec2).flatten()
        
        # Ensure they are the same length
        if a.shape != b.shape:
            return 0.0
            
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        return float(dot_product / (norm_a * norm_b))
    except Exception as e:
        print(f"[HF ERROR] Similarity calculation failed: {e}")
        return 0.0
HF_API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
HEADERS = {"Authorization": f"Bearer {settings.HF_TOKEN}"}

def get_image_embedding(image_base64: str) -> list:
    """
    Get 512-dimensional vector embedding for an image using CLIP.
    """
    try:
        # Remove header if present
        clean_base64 = image_base64.split(",")[1] if "," in image_base64 else image_base64
        image_data = base64.b64decode(clean_base64)
        
        response = requests.post(HF_API_URL, headers=HEADERS, data=image_data)
        
        if response.status_code != 200:
            print(f"[HF ERROR] Image embedding failed ({response.status_code}): {response.text}")
            return None
            
        # CLIP feature extraction usually returns a list of embeddings
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            return result
        return result
    except Exception as e:
        print(f"[HF ERROR] Exception in get_image_embedding: {e}")
        return None

def get_text_embedding(text: str) -> list:
    """
    Get 512-dimensional vector embedding for text using CLIP.
    """
    try:
        payload = {"inputs": text}
        response = requests.post(HF_API_URL, headers=HEADERS, json=payload)
        
        if response.status_code != 200:
            print(f"[HF ERROR] Text embedding failed ({response.status_code}): {response.text}")
            return None
            
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            return result
        return result
    except Exception as e:
        print(f"[HF ERROR] Exception in get_text_embedding: {e}")
        return None
