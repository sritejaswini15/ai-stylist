import google.generativeai as genai
import base64
import json
import io
import os
import datetime
import csv
import numpy as np
from core.config import settings
from PIL import Image
from services.image_processing import compress_image

# Cache for datasets
DATASETS = {
    "body": [],
    "color": []
}

def load_datasets():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if not DATASETS["body"]:
        body_path = os.path.join(base_path, "body_analysis_dataset.csv")
        if os.path.exists(body_path):
            try:
                with open(body_path, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    DATASETS["body"] = list(reader)
            except Exception as e:
                print(f"Error loading body dataset: {e}")

    if not DATASETS["color"]:
        color_path = os.path.join(base_path, "color_analysis_dataset.csv")
        if os.path.exists(color_path):
            try:
                with open(color_path, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    DATASETS["color"] = list(reader)
            except Exception as e:
                print(f"Error loading color dataset: {e}")

def find_nearest_body_match(height_cm, shoulder, bust, waist, hip):
    load_datasets()
    if not DATASETS["body"]: return None
    user_vec = np.array([float(height_cm), float(shoulder), float(bust), float(waist), float(hip)])
    best_match = None
    min_dist = float('inf')
    for row in DATASETS["body"]:
        try:
            dataset_vec = np.array([float(row["height_cm"]), float(row["shoulder_width"]), float(row["bust"]), float(row["waist"]), float(row["hip"])])
            dist = np.linalg.norm(user_vec - dataset_vec)
            if dist < min_dist:
                min_dist = dist
                best_match = row
        except: continue
    return best_match

def find_nearest_color_match(skin_rgb, hair_rgb, eye_rgb):
    load_datasets()
    if not DATASETS["color"]: return None
    user_vec = np.array(skin_rgb + hair_rgb + eye_rgb)
    best_match = None
    min_dist = float('inf')
    for row in DATASETS["color"]:
        try:
            dataset_vec = np.array([
                float(row["skin_r_forehead"]), float(row["skin_g_forehead"]), float(row["skin_b_forehead"]),
                float(row["hair_r"]), float(row["hair_g"]), float(row["hair_b"]),
                float(row["eye_r"]), float(row["eye_g"]), float(row["eye_b"])
            ])
            dist = np.linalg.norm(user_vec - dataset_vec)
            if dist < min_dist:
                min_dist = dist
                best_match = row
        except: continue
    return best_match

def get_recommendations(body_shape: str, sub_season: str):
    if not body_shape or not sub_season:
        return {"body_data": None, "color_data": None}
    load_datasets()
    body_data = next((row for row in DATASETS["body"] if row["body_shape"].strip().lower() == body_shape.strip().lower()), None)
    color_data = next((row for row in DATASETS["color"] if row["subseason"].strip().lower() == sub_season.strip().lower()), None)
    return {"body_data": body_data, "color_data": color_data}

def log_ai(message: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_path = os.path.join(base_dir, "ai_pipeline.log")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception as e:
        print(f"Logging failed: {e}")

async def classify_clothing(image_base64: str) -> dict:
    import asyncio
    available_keys = [settings.GEMINI_API_KEY, settings.GEMINI_API_KEY_ALT]
    available_keys = [k for k in available_keys if k]
    if not available_keys: return get_mock_classification()
    # Execute in a thread to avoid blocking the event loop
    return await asyncio.to_thread(_classify_clothing_sync, image_base64, available_keys)

def _classify_clothing_sync(image_base64: str, available_keys: list) -> dict:
    for api_key in available_keys:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-flash-latest')
            clean_base64 = image_base64.split(",")[1] if "," in image_base64 else image_base64
            img = Image.open(io.BytesIO(base64.b64decode(clean_base64)))
            
            prompt = """
            Identify the clothing item in the image with high precision.
            Return a JSON object with:
            - category: Must be one of [Tops, Bottoms, Shoes, Dresses, Accessories, Other]
            - subcategory: A detailed, specific description (e.g., 'Wide Leg Jeans', 'High-Neck Crop Top', 'Oversized Graphic Hoodie', 'Midi Floral Sun Dress', 'Chelsea Boots')
            - main_color: The dominant color name
            - color_palette: List of 3-5 complementary colors seen
            - occasion: List of appropriate occasions
            - aesthetic: Style aesthetics (e.g., Streetwear, Minimalist, Y2K, Old Money)
            - mood: Moods the item evokes
            - season: Suitable seasons
            - weather: Suitable weather conditions
            - location: Suitable locations
            - style: General style category
            - extra_tags: Additional descriptive tags
            """
            
            response = model.generate_content([prompt, img])
            text = response.text
            start, end = text.find('{'), text.rfind('}')
            raw = json.loads(text[start:end+1])

            raw_cat = raw.get("category", "Other").title()
            if "Top" in raw_cat: category = "Tops"
            elif "Bottom" in raw_cat: category = "Bottoms"
            elif "Shoe" in raw_cat: category = "Shoes"
            elif "Dress" in raw_cat: category = "Dresses"
            elif "Accessory" in raw_cat or "Bag" in raw_cat: category = "Accessories"
            else: category = "Other"

            # Use the detailed subcategory from AI
            sub_cat = raw.get("subcategory", "Item").title()
            # Basic cleanup
            if sub_cat == "T-Shirts": sub_cat = "T-Shirt"
            if sub_cat == "Shirts": sub_cat = "Shirt"

            def standardize(items, constants):
                if not items: return []
                result = []
                for item in items:
                    if not isinstance(item, str): continue
                    item_low = item.lower()
                    for const in constants:
                        if const.lower() in item_low or item_low in const.lower():
                            if const not in result: result.append(const)
                return result

            from constants import OCCASIONS, STYLE_AESTHETICS, MOODS, TIMES, LOCATIONS, WEATHERS, SPECIFIC_COLORS, COLOR_PALETTES
            return {
                "category": category, 
                "sub_category": sub_cat, 
                "color": raw.get("main_color", "Neutral").title(), 
                "style": raw.get("style", "Casual").title(),
                "occasion": standardize(raw.get("occasion", []), OCCASIONS),
                "style_aesthetic": standardize(raw.get("aesthetic", []), STYLE_AESTHETICS),
                "mood": standardize(raw.get("mood", []), MOODS), 
                "weather": standardize(raw.get("weather", []), WEATHERS),
                "location": standardize(raw.get("location", []), LOCATIONS), 
                "color_palette": standardize(raw.get("color_palette", []), COLOR_PALETTES),
                "specific_colors": standardize([raw.get("main_color", "Neutral")], SPECIFIC_COLORS), 
                "tags": raw.get("extra_tags", []), 
                "time": standardize(raw.get("time", ["Anytime"]), TIMES)
            }
        except Exception as e:
            print(f"[AI CLASSIFIER ERROR] Key {api_key[:8]}... failed: {e}")
            continue
    return get_mock_classification()

def analyze_user_appearance(image_base_64: str, height: int = None, weight: int = None, existing_profile: dict = None) -> dict:
    available_keys = [settings.GEMINI_API_KEY, settings.GEMINI_API_KEY_ALT]
    available_keys = [k for k in available_keys if k]
    if not available_keys: return get_mock_appearance_analysis()
    
    compressed_img_b64 = compress_image(image_base_64, max_size=1280)
    img_pil = Image.open(io.BytesIO(base64.b64decode(compressed_img_b64)))

    log_ai(f"Starting optimized analysis: {height}cm, {weight}kg")

    for api_key in available_keys:
        for model_name in ['gemini-flash-latest', 'gemini-1.5-flash']:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)
                
                # Combined Prompt for efficiency
                prompt = f"""
                Analyze this photo of a person. User Stats: {height}cm, {weight}kg.
                
                TASK:
                1. Extract physical measurements (as percentages/ratios relative to height): shoulder_width, bust, waist, hip.
                2. Extract RGB colors for skin, hair, and eyes.
                3. Determine body shape (e.g., Hourglass, Rectangle, Inverted Triangle, Pear, Apple).
                4. Determine seasonal color archetype (e.g., Deep Winter, Soft Summer).
                5. Provide a surgical, luxurious style analysis.
                
                Return ONLY a JSON object:
                {{
                  "body_shape": "...",
                  "sub_season": "...",
                  "extracted_features": {{
                    "shoulder_width": 0.0, "bust": 0.0, "waist": 0.0, "hip": 0.0,
                    "skin_rgb": [r,g,b], "hair_rgb": [r,g,b], "eye_rgb": [r,g,b]
                  }},
                  "color_analysis": {{
                    "undertone": "Cool/Warm/Neutral",
                    "contrast_level": "High/Medium/Low",
                    "best_colors": {{
                      "power_colors": [{{ "name": "...", "hex": "...", "reason": "..." }}],
                      "neutrals": [{{ "name": "...", "hex": "...", "reason": "..." }}],
                      "accents": [{{ "name": "...", "hex": "...", "reason": "..." }}]
                    }},
                    "avoid_colors": [{{ "name": "...", "hex": "...", "reason": "..." }}]
                  }},
                  "clothing_analysis": {{
                    "styles_to_embrace": [{{ "item": "...", "reason": "..." }}],
                    "styles_to_avoid": [{{ "item": "...", "reason": "..." }}]
                  }},
                  "fashion_advice": {{
                    "tops": "...", "bottoms": "...", "dresses": "...", "general": "..."
                  }}
                }}
                """
                
                response = model.generate_content([prompt, img_pil])
                text = response.text
                start, end = text.find('{'), text.rfind('}')
                if start == -1 or end == -1: continue
                
                result = json.loads(text[start:end+1])
                log_ai("Optimized Detailed Analysis Success.")
                return result
            except Exception as e:
                print(f"[AI ANALYSIS ERROR] {e}")
                continue
            
    return get_mock_appearance_analysis()

def get_mock_appearance_analysis() -> dict:
    return {
        "sub_season": "Deep Winter", "body_shape": "Hourglass", "needs_info": [],
        "color_analysis": {
            "undertone": "Cool", "contrast_level": "High",
            "best_colors": {
                "power_colors": [{"name": "Emerald Green", "hex": "#008A45", "reason": "Rich jewel tone that emphasizes your natural contrast."}],
                "neutrals": [{"name": "Midnight Navy", "hex": "#000080", "reason": "A powerful base for your high-contrast palette."}],
                "accents": [{"name": "Icy Silver", "hex": "#C0C0C0", "reason": "Perfect metallic to enhance your cool undertones."}]
            },
            "avoid_colors": [{"name": "Mustard Yellow", "hex": "#FFDB58", "reason": "Clashes with your cool clarity."}]
        },
        "clothing_analysis": {
            "styles_to_embrace": [{"item": "Wrap Dress", "reason": "Highlights your balanced silhouette."}],
            "styles_to_avoid": [{"item": "Boxy Crop Tops", "reason": "Hides your natural waist definition."}]
        },
        "fashion_advice": { "tops": "Look for structure...", "bottoms": "High-waisted cuts...", "dresses": "Fit and flare...", "general": "Your style is built on contrast..." }
    }

def get_mock_classification() -> dict:
    return {"category": "Tops", "sub_category": "Item", "color": "Black", "style": "Casual", "occasion": ["Casual"], "style_aesthetic": ["Minimalist"], "mood": ["Chill"], "weather": ["Any"], "location": ["Any"], "color_palette": ["Dark"], "specific_colors": ["Black"], "tags": [], "time": ["Any"]}

async def classify_clothing_async(image_base_64: str) -> dict:
    return classify_clothing(image_base_64)
