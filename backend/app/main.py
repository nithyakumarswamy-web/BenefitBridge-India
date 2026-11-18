import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.data.seed_data import seed_database

# Routers
from app.api.endpoints import (
    auth, citizen_profile, schemes, eligibility,
    chat, voice, documents, action_plans, admin
)

# Create tables
Base.metadata.create_all(bind=engine)

# Seed initial data
with SessionLocal() as db:
    seed_database(db)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Your AI-Powered Guide to Government Benefits in India",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(citizen_profile.router, prefix=f"{api_prefix}/citizens", tags=["Citizen Profile"])
app.include_router(schemes.router, prefix=f"{api_prefix}/schemes", tags=["Schemes"])
app.include_router(eligibility.router, prefix=f"{api_prefix}/eligibility", tags=["Eligibility Engine"])
app.include_router(chat.router, prefix=f"{api_prefix}/chat", tags=["AI Chatbot"])
app.include_router(voice.router, prefix=f"{api_prefix}/voice", tags=["Voice Assistant"])
app.include_router(documents.router, prefix=f"{api_prefix}/documents", tags=["Document Checklist"])
app.include_router(action_plans.router, prefix=f"{api_prefix}/action-plans", tags=["Action Plans"])
app.include_router(admin.router, prefix=f"{api_prefix}/admin", tags=["Admin Portal"])

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_SUBTITLE,
        "version": "1.0.0",
        "docs": "/docs",
        "supported_languages": list(settings.SUPPORTED_LANGUAGES.keys()),
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
