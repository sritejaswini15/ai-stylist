from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.auth import router as auth_router
from api.users import router as users_router
from api.clothing import router as clothing_router
from api.chatbot import router as chatbot_router
from api.tryon import router as tryon_router
from core.config import settings

app = FastAPI(title="Clueless API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(clothing_router, prefix="/api/clothing", tags=["Clothing"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(tryon_router, prefix="/api/tryon", tags=["Try-On"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Clueless API"}
