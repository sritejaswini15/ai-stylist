import google.generativeai as genai
from core.config import settings

from typing import List, Dict, Any
from services.ai_classifier import get_recommendations

def get_chatbot_response(message: str, history: List[Dict[str, str]], user_profile: Dict[str, Any]) -> str:
    # 1. Try dedicated Chatbot key first, then fall back to general keys
    available_gemini_keys = [
        settings.CHATBOT_GEMINI_API_KEY, 
        settings.GEMINI_API_KEY, 
        settings.GEMINI_API_KEY_ALT
    ]
    available_gemini_keys = [k for k in available_gemini_keys if k]
    
    # Extract profile info
    username = user_profile.get('username', 'Friend')
    body_shape = user_profile.get('body_shape', 'Unknown')
    color_palette = user_profile.get('color_palette', 'Unknown')
    wardrobe_summary = user_profile.get('wardrobe_summary', 'No items in wardrobe yet.')
    
    # Dataset Recommendations
    dataset_info = ""
    if body_shape != "Unknown" or color_palette != "Unknown":
        recs = get_recommendations(body_shape, color_palette)
        if recs["body_data"]:
            bd = recs["body_data"]
            dataset_info += f"\nEXPERT BODY RECOMMENDATIONS (Use these as your bible):\n"
            dataset_info += f"- Recommended Fits: {bd.get('recommended_fits')}\n"
            dataset_info += f"- Avoid: {bd.get('avoid_fits')}\n"
            dataset_info += f"- Best Tops: {bd.get('top_recommendations')}\n"
            dataset_info += f"- Best Bottoms: {bd.get('bottom_recommendations')}\n"
            dataset_info += f"- Necklines: {bd.get('necklines')}\n"
            dataset_info += f"- Fabrics: {bd.get('fabrics')}\n"
        
        if recs["color_data"]:
            cd = recs["color_data"]
            dataset_info += f"\nEXPERT COLOR PALETTE (Strictly follow these colors):\n"
            dataset_info += f"- Primary: {cd.get('primary_colors')}\n"
            dataset_info += f"- Neutrals: {cd.get('neutral_colors')}\n"
            dataset_info += f"- Accents: {cd.get('accent_colors')}\n"
            dataset_info += f"- Avoid: {cd.get('avoid_colors_strict')}\n"

    # Missing info checks
    missing_info_instructions = ""
    if not user_profile.get('sun_reaction'):
        missing_info_instructions += "- Gently ask about their sun reaction (do they tan easily or burn?) to refine their color season.\n"
    if not user_profile.get('hair_color'):
        missing_info_instructions += "- Ask about their natural hair color to further personalize style advice.\n"

    system_instruction = f"""
You are "Clueless AI", a world-class, high-end Celebrity Fashion Architect and Style Consultant. 
You are friendly, chic, extremely knowledgeable, and proactive—just like a personal stylist who is also a best friend.

USER PROFILE:
- Name: {username}
- Body Shape: {body_shape}
- Color Palette: {color_palette}
- Wardrobe Context: {wardrobe_summary}
{dataset_info}

YOUR CORE MISSION:
1. Provide surgical, high-level fashion advice tailored to their specific body shape and color season.
2. Provide general fashion advice, trend updates, and answer any lifestyle questions with a stylish flair.
3. When giving advice, reference their wardrobe if relevant (e.g., "Since you have a black blazer, you could pair it with...").
4. Use Markdown for beautiful formatting. Use **bold**, *italics*, and lists to make your responses easy to read and professional.
5. Be proactive: if they ask a question, answer it thoroughly and then offer a follow-up suggestion or a style tip they didn't think of.
6. If the user talks about anything non-fashion (life, mood, etc.), be supportive and charming, but always try to tie it back to how they can express themselves through style.
7. {missing_info_instructions}
8. CRITICAL: If the user provides info about their sun reaction or hair color, you MUST add a tag at the VERY END of your message like this: [UPDATE: sun_reaction=value] or [UPDATE: hair_color=value]. This is for the system to automatically update their profile.

STYLE GUIDELINES:
- Use sophisticated but warm language ("chic", "fabulous", "proportions", "vibrancy", "silhouette").
- Never be generic. Instead of "wear a dress", say "a tailored wrap dress would beautifully accentuate your hourglass silhouette."
- Keep the tone high-energy and encouraging.
"""

    # Try Gemini
    for api_key in available_gemini_keys:
        try:
            genai.configure(api_key=api_key)
            # Using gemini-flash-latest
            model = genai.GenerativeModel(model_name='gemini-flash-latest')
            
            # For older library versions, we prepend the system instruction as a 'user' message
            # then follow with a 'model' acknowledgement to simulate a system prompt.
            gemini_history = [
                {"role": "user", "parts": [system_instruction]},
                {"role": "model", "parts": ["Understood. I am Clueless AI, your Celebrity Fashion Architect. How can I inspire your look today?"]}
            ]
            
            for msg in history:
                role = "model" if msg["role"] in ["assistant", "model"] else "user"
                gemini_history.append({"role": role, "parts": [msg["content"]]})

            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(message)
            
            return response.text
        except Exception as e:
            print(f"[GEMINI ERROR] with key {api_key[:10]}: {e}")
            continue

    # Final Fallback
    if not available_gemini_keys:
        return "The fashion studio is currently offline (API Keys missing). Please contact support, darling!"

    return "I'm having a bit of trouble connecting to the fashion mainframe right now. Please try again in a moment, darling!"
