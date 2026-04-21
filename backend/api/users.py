from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
import random

from api.deps import get_current_user
from database.session import get_db
from models.user import User
from schemas.user import UserUpdate
from services.ai_classifier import classify_clothing, analyze_user_appearance
from services.chatbot_service import get_chatbot_response
from services.hf_service import calculate_similarity, get_image_embedding, get_text_embedding
from sqlalchemy.orm.attributes import flag_modified

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/stylist-chat")
def stylist_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        profile = {
            "username": current_user.full_name or current_user.username,
            "body_shape": current_user.body_shape,
            "color_palette": current_user.color_palette,
            "skin_tone": current_user.skin_tone,
            "sun_reaction": current_user.sun_reaction,
            "hair_color": current_user.hair_color,
            "style_advice": current_user.style_advice,
            "wardrobe_summary": f"User has {len(current_user.clothes)} items in their wardrobe."
        }
        
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in req.history]
        response_text = get_chatbot_response(req.message, history_dicts, profile)
        
        # Check for automated updates [UPDATE: field=value]
        if "[UPDATE:" in response_text:
            try:
                import re
                match = re.search(r"\[UPDATE:\s*(\w+)=([^\]]+)\]", response_text)
                if match:
                    field = match.group(1).strip()
                    value = match.group(2).strip()
                    if hasattr(current_user, field):
                        setattr(current_user, field, value)
                        db.commit()
                        print(f"[CHAT UPDATE] {field} set to {value}")
                # Clean tag from response
                response_text = re.sub(r"\[UPDATE:[^\]]+\]", "", response_text).strip()
            except Exception as update_err:
                print(f"[CHAT UPDATE ERROR] {update_err}")

        return {"status": "success", "data": {"response": response_text}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AppearanceAnalysisRequest(BaseModel):
    image_base64: str
    height: Optional[int] = None
    weight: Optional[int] = None

@router.post("/analyze-appearance")
def analyze_appearance(
    req: AppearanceAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"[API] Starting appearance analysis for user: {current_user.username}")
    try:
        existing_profile = {
            "sun_reaction": current_user.sun_reaction,
            "hair_color": current_user.hair_color,
            "body_shape": current_user.body_shape,
            "color_palette": current_user.color_palette
        }
        analysis = analyze_user_appearance(req.image_base64, req.height, req.weight, existing_profile)
        
        # Update user profile with analysis results
        if analysis and analysis.get("body_shape"):
            try:
                current_user.body_shape = analysis.get("body_shape")
                current_user.color_palette = analysis.get("sub_season") or analysis.get("color_palette")
                current_user.style_advice = analysis
                current_user.height = req.height
                current_user.weight = req.weight
                
                # Save this as the STYLIST picture
                current_user.stylist_picture = req.image_base64
                
                db.commit()
                db.refresh(current_user)
            except Exception as db_err:
                print(f"[DB ERROR] Analysis save failed: {db_err}")
                db.rollback()
                # If DB save fails (e.g. image too large), we still return the analysis so UI shows it
        
        return {"status": "success", "data": analysis}
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        return {"status": "error", "message": str(e)}

class OutfitCreate(BaseModel):
    title: str = ""
    topId: Optional[str] = None
    bottomId: Optional[str] = None
    shoesId: Optional[str] = None
    dressId: Optional[str] = None
    outerTopId: Optional[str] = None

def get_user_response(user: User):
    return {
        "status": "success",
        "data": {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.full_name,
                "age": user.age,
                "profilePicture": user.profile_picture,
                "stylistPicture": user.stylist_picture,
                "clothesOwned": [
                    {
                        "id": c.id,
                        "_id": str(c.id),
                        "imageUrl": c.image_base64 if c.image_base64.startswith('data:') else f"data:image/png;base64,{c.image_base64}",
                        "category": c.category,
                        "subCategory": c.sub_category,
                        "color": c.color,
                        "isFavorite": c.is_favorite,
                        "addedAt": c.created_at.isoformat() if c.created_at else None,
                        "tags": c.tags or [],
                        "occasion": c.occasion or [],
                        "style_aesthetic": c.style_aesthetic or [],
                        "mood": c.mood or [],
                        "time": c.time or [],
                        "location": c.location or [],
                        "weather": c.weather or [],
                        "specific_colors": c.specific_colors or [],
                        "color_palette": c.color_palette or []
                    } for c in user.clothes
                ],
                "fashionInspoBoard": user.fashion_inspo_board or [],
                "wishlist": user.wishlist or [],
                "bestOutfits": user.best_outfits or [],
                "savedGeneratedOutfits": user.saved_generated_outfits or [],
                "personalizedMannequin": user.personalized_mannequin,
                "height": user.height,
                "weight": user.weight,
                "bodyShape": user.body_shape,
                "skinTone": user.skin_tone,
                "colorPalette": user.color_palette,
                "sunReaction": user.sun_reaction,
                "hairColor": user.hair_color,
                "styleAdvice": user.style_advice,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
        }
    }

@router.get("/me")
def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    return get_user_response(current_user)

@router.patch("/updateMe")
def update_user_me(*, db: Session = Depends(get_db), user_in: UserUpdate, current_user: User = Depends(get_current_user)) -> Any:
    update_data = user_in.model_dump(exclude_unset=True)
    if "name" in update_data: current_user.full_name = update_data["name"]
    if "age" in update_data: current_user.age = update_data["age"]
    if "profile_picture" in update_data: current_user.profile_picture = update_data["profile_picture"]
    if "clothes_owned" in update_data: current_user.clothes_owned = update_data["clothes_owned"]
    if "fashion_inspo_board" in update_data: current_user.fashion_inspo_board = update_data["fashion_inspo_board"]
    if "best_outfits" in update_data: current_user.best_outfits = update_data["best_outfits"]
    if "saved_generated_outfits" in update_data: current_user.saved_generated_outfits = update_data["saved_generated_outfits"]
    if "sun_reaction" in update_data: current_user.sun_reaction = update_data["sun_reaction"]
    if "hair_color" in update_data: current_user.hair_color = update_data["hair_color"]
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return get_user_response(current_user)

@router.get("/wardrobe")
def get_wardrobe(current_user: User = Depends(get_current_user)):
    resp = get_user_response(current_user)
    return {"status": "success", "data": {"clothes": resp["data"]["user"]["clothesOwned"]}}

class InspoItemCreate(BaseModel):
    imageUrl: str

@router.post("/inspo")
def add_inspo_item(item: InspoItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inspo_board = list(current_user.fashion_inspo_board or [])
        new_item = item.model_dump()
        new_item["_id"] = str(uuid.uuid4())
        inspo_board.append(new_item)
        current_user.fashion_inspo_board = inspo_board
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"inspoBoard": current_user.fashion_inspo_board}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/inspo/{item_id}")
def delete_inspo_item(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        inspo_board = [i for i in (current_user.fashion_inspo_board or []) if i.get("_id") != item_id]
        current_user.fashion_inspo_board = inspo_board
        flag_modified(current_user, "fashion_inspo_board")
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"inspoBoard": current_user.fashion_inspo_board}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class WishlistItemCreate(BaseModel):
    imageUrl: str
    title: Optional[str] = None
    category: Optional[str] = None
    link: Optional[str] = None
    source: Optional[str] = None

@router.post("/wishlist")
def add_wishlist_item(item: WishlistItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):    
    try:
        wishlist = list(current_user.wishlist or [])
        new_item = item.model_dump()
        new_item["_id"] = str(uuid.uuid4())
        wishlist.append(new_item)
        current_user.wishlist = wishlist
        flag_modified(current_user, "wishlist")
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"wishlist": current_user.wishlist}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/wishlist/{item_id}")
def delete_wishlist_item(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        wishlist = [i for i in (current_user.wishlist or []) if i.get("_id") != item_id]
        current_user.wishlist = wishlist
        flag_modified(current_user, "wishlist")
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"wishlist": current_user.wishlist}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class GenerateOutfitRequest(BaseModel):
    occasion: List[str] = ["none"]
    aesthetic: List[str] = ["none"]
    mood: List[str] = ["none"]
    time: List[str] = ["none"]
    location: List[str] = ["none"]
    weather: List[str] = ["none"]
    specificColor: List[str] = ["none"]
    color: List[str] = ["none"]
    refImageUrl: str = ""
    excludeHistory: List[str] = []

@router.post("/generate-outfit")
def generate_outfit(
    req: GenerateOutfitRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate an outfit using Visual-Semantic matching (Hugging Face CLIP).
    Prioritizes items that visually match the 'Inspo' or the 'Vibe' of selected filters.
    """
    try:
        clothes = current_user.clothes
        if not clothes:
            return {"status": "success", "data": {"noMatches": True}}

        # 1. GET TARGET EMBEDDING (The "Vibe" we want)
        target_embedding = None
        
        # Priority A: Reference Image (Visual Inspo)
        if req.refImageUrl and req.refImageUrl.startswith("data:image"):
            print("[API] Generating target embedding from reference image...")
            target_embedding = get_image_embedding(req.refImageUrl)
            
        # Priority B: Text Prompt (Filter-based vibe)
        if not target_embedding:
            # Construct a descriptive prompt from active filters
            active_filters = []
            if "none" not in req.occasion: active_filters.extend(req.occasion)
            if "none" not in req.aesthetic: active_filters.extend(req.aesthetic)
            if "none" not in req.mood: active_filters.extend(req.mood)
            
            if active_filters:
                prompt = f"A professional high-end fashion outfit that is {' and '.join(active_filters)}."
                print(f"[API] Generating target embedding from text prompt: {prompt}")
                target_embedding = get_text_embedding(prompt)

        # 2. SCORE INDIVIDUAL ITEMS
        tops, bottoms, shoes, dresses = [], [], [], []
        
        for c in clothes:
            # Base score from CLIP similarity
            similarity_score = 0.0
            if target_embedding and c.visual_embedding:
                similarity_score = calculate_similarity(target_embedding, c.visual_embedding)
            
            # Bonus for exact tag matches (The Hybrid approach)
            tag_bonus = 0.0
            total_filters = 0
            matches = 0
            
            for filter_key, req_vals in {
                "occasion": req.occasion,
                "aesthetic": req.aesthetic,
                "mood": req.mood
            }.items():
                if "none" not in req_vals and len(req_vals) > 0:
                    total_filters += 1
                    item_vals = getattr(c, filter_key, []) or []
                    if not isinstance(item_vals, list):
                        item_vals = [item_vals]
                    
                    item_vals_lower = [str(iv).lower() for iv in item_vals]
                    req_vals_lower = [str(rv).lower() for rv in req_vals]
                    
                    if any(iv in req_vals_lower for iv in item_vals_lower):
                        matches += 1
            
            if total_filters > 0:
                tag_bonus = matches / total_filters
            
            # Final Hybrid Score (80% Logic Tags, 20% Visual Vibe)
            # If item has no visual DNA, rely 100% on tags
            if c.visual_embedding and target_embedding:
                final_score = (tag_bonus * 0.8) + (similarity_score * 0.2)
            else:
                final_score = tag_bonus
            
            # Categorize and store with score
            cat = (c.category or "").lower()
            item_tuple = (str(c.id), final_score)
            
            if "dress" in cat: dresses.append(item_tuple)
            if "top" in cat or "dress" in cat or "other" in cat or "accessory" in cat: tops.append(item_tuple)
            if "bottom" in cat or "pant" in cat or "skirt" in cat or "jean" in cat: bottoms.append(item_tuple)
            if "shoe" in cat or "footwear" in cat or "boot" in cat or "sneaker" in cat: shoes.append(item_tuple)

        # 3. BUILD AND SORT COMBINATIONS
        all_combos = []
        
        # 2-Piece (Dress + Shoes)
        for d, d_score in dresses:
            for s, s_score in shoes:
                combo_key = f"null-null-{s}-{d}"
                all_combos.append({
                    "topId": None, "bottomId": None, "shoesId": s, "dressId": d, 
                    "score": d_score + s_score, "combo_key": combo_key
                })
        
        # 3-Piece (Top + Bottom + Shoes)
        for t, t_score in tops:
            for b, b_score in bottoms:
                for s, s_score in shoes:
                    combo_key = f"{t}-{b}-{s}-null"
                    all_combos.append({
                        "topId": t, "bottomId": b, "shoesId": s, "dressId": None, 
                        "score": t_score + b_score + s_score, "combo_key": combo_key
                    })

        if not all_combos:
            return {"status": "success", "data": {"noMatches": True}}

        # Add a bit of randomness to top results for variety
        random.shuffle(all_combos)
        all_combos.sort(key=lambda x: x["score"], reverse=True)
        
        # Pick highest scoring unseen outfit
        selected_combo = next((c for c in all_combos if c["combo_key"] not in req.excludeHistory), all_combos[0])

        return {
            "status": "success", 
            "data": {
                "outfit": {
                    "topId": selected_combo["topId"], 
                    "bottomId": selected_combo["bottomId"], 
                    "shoesId": selected_combo["shoesId"], 
                    "dressId": selected_combo["dressId"]
                }
            }
        }
    except Exception as e:
        print(f"[API ERROR] Generate outfit failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/best-outfits")
def add_best_outfit(outfit: OutfitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        outfits = list(current_user.best_outfits or [])
        new_outfit = outfit.model_dump()
        new_outfit["_id"] = str(uuid.uuid4())
        outfits.append(new_outfit)
        current_user.best_outfits = outfits
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"bestOutfits": current_user.best_outfits}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/best-outfits/{outfit_id}")
def delete_best_outfit(outfit_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        outfits = list(current_user.best_outfits or [])
        outfits = [o for o in outfits if o.get("_id") != outfit_id]
        current_user.best_outfits = outfits
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"bestOutfits": current_user.best_outfits}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/saved-generated-outfits")
def save_generated_outfit(outfit: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        outfits = list(current_user.saved_generated_outfits or [])
        new_outfit = outfit.copy()
        new_outfit["_id"] = str(uuid.uuid4())
        outfits.append(new_outfit)
        current_user.saved_generated_outfits = outfits
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"savedGeneratedOutfits": current_user.saved_generated_outfits}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/saved-generated-outfits/{outfit_id}")
def delete_saved_generated_outfit(outfit_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        outfits = list(current_user.saved_generated_outfits or [])
        outfits = [o for o in outfits if o.get("_id") != outfit_id]
        current_user.saved_generated_outfits = outfits
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "data": {"savedGeneratedOutfits": current_user.saved_generated_outfits}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class SearchQuery(BaseModel):
    q: str = ""
    filters: dict = {}
    refImageUrl: str = ""
    maxPrice: Optional[int] = None
    gender: Optional[str] = "All"

@router.post("/search-products")
def search_products(query: SearchQuery):
    import requests
    import json
    import re
    
    SERPAPI_KEY = settings.SERPAPI_KEY or "5e53b42d55aa7e3fa16137ea25087a79aa00499d78906672da696e38aa186598"
    search_term = query.q
    refined_queries = []
    
    if query.refImageUrl and query.refImageUrl.startswith("data:image"):
        try:
            from services.ai_classifier import classify_clothing
            classification = classify_clothing(query.refImageUrl)
            cat = classification.get("category", "")
            subcat = classification.get("sub_category", "")
            color = classification.get("color", "")
            style = classification.get("style", "")
            extracted_term = f"{color} {style} {subcat}".strip()
            if not search_term: search_term = extracted_term
            refined_queries.append(extracted_term)
            if cat and subcat:
                refined_queries.append(f"{color} {cat}")
                refined_queries.append(f"{style} {subcat}")
        except Exception as e:
            print(f"[API] Error: {e}")
    
    if search_term and len(search_term.split()) > 7:
        search_term = " ".join(search_term.split()[:5])

    if query.gender and query.gender != "All":
        gender_prefix = "men's " if query.gender == "Men" else "women's "
        if gender_prefix.lower() not in search_term.lower():
            search_term = f"{gender_prefix}{search_term}"

    filter_string = ""
    if query.filters:
        for key, values in query.filters.items():
            if isinstance(values, list) and values:
                filter_string += " " + " ".join(values)
    if search_term: search_term += filter_string
    elif filter_string: search_term = filter_string.strip()
            
    if not search_term or len(search_term.strip()) < 2:
        search_term = "latest fashion trends"
    
    generic_fashion_terms = ["clothes", "clothing", "wear", "apparel", "style", "outfit", "fashion"]
    is_generic = len(search_term.split()) < 2 or search_term.lower() in generic_fashion_terms
    if is_generic and not any(kw in search_term.lower() for kw in ["jeans", "kurta", "top", "shirt", "pant", "dress", "shoe", "bag", "accessory"]):
        search_term += " fashion clothing"
        
    print(f"[API] Searching SerpApi: '{search_term}' (Gender: {query.gender})")
    
    products = []
    try:
        params = {"engine": "google_shopping", "q": search_term, "api_key": SERPAPI_KEY, "hl": "en", "gl": "in", "num": 100}
        if query.maxPrice: params["tbs"] = f"mr:1,price:1,ppr_max:{query.maxPrice}"
        
        response = requests.get("https://serpapi.com/search.json", params=params, timeout=15)
        if response.status_code == 200:
            shopping_results = response.json().get("shopping_results", [])
            irrelevant_keywords = ["vitamin", "supplement", "ebook", "manga", "novel", "tablet", "medicine"]
            
            # Strict gender filtering keywords
            exclude_men = ["men", "male", "boy", "guy", "gentleman"]
            exclude_women = ["women", "woman", "lady", "ladies", "girl", "female", "kurti", "saree", "dress", "gown"]
            
            for idx, item in enumerate(shopping_results):
                title = item.get("title", "").lower()
                if any(ikw in title for ikw in irrelevant_keywords): continue
                
                # STRICT GENDER FILTERING
                if query.gender == "Men":
                    # If looking for Men, exclude anything that explicitly mentions women keywords
                    # Using regex word boundary to avoid "men" matching "women"
                    if any(re.search(rf"\b{word}\b", title) for word in exclude_women):
                        continue
                elif query.gender == "Women":
                    # If looking for Women, exclude anything that explicitly mentions men keywords
                    # But be CAREFUL not to exclude "women" because it contains "men"
                    if any(re.search(rf"\b{word}\b", title) for word in exclude_men):
                        continue
                
                link = item.get("link", "")
                if not link or link == "#": link = item.get("product_link", "#")
                if link != "#" and not link.startswith("http"): link = "https://" + link
                
                price_str = item.get("price", "0")
                price_val = 0.0
                try:
                    temp_price = price_str.replace(",", "")
                    match = re.search(r'(\d+(\.\d+)?)', temp_price)
                    if match: price_val = float(match.group(1))
                except: pass
                
                if query.maxPrice and price_val > query.maxPrice: continue

                products.append({
                    "id": item.get("product_id", str(uuid.uuid4())),
                    "title": item.get("title", "Unknown Product"),
                    "price": price_val,
                    "imageUrl": item.get("thumbnail", ""),
                    "source": item.get("source", "Unknown Store"),
                    "link": link,
                    "category": query.q,
                    "tags": [search_term]
                })
        else: print(f"[API] Error: {response.status_code}")
    except Exception as e: print(f"[API] Error: {e}")
        
    refined_queries = list(dict.fromkeys([q for q in refined_queries if q]))
    return {"status": "success", "data": {"products": products, "refinedQueries": refined_queries, "engine": "SerpApi Google Shopping"}}
