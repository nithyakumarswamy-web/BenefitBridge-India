import os
from pathlib import Path

# Load .env file safely without external dependencies
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    try:
        with open(_env_path, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if not _line or _line.startswith("#") or "=" not in _line:
                    continue
                _key, _val = _line.split("=", 1)
                _key = _key.strip()
                _val = _val.strip().strip("'\"")
                if _key and _key not in os.environ:
                    os.environ[_key] = _val
    except Exception:
        pass

class Settings:
    PROJECT_NAME: str = "BenefitBridge India"
    PROJECT_SUBTITLE: str = "Your AI-Powered Guide to Government Benefits"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "benefitbridge-super-secret-key-hackathon-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./benefitbridge.db")
    
    # External APIs (Optional - fallbacks provided)
    GEMINI_API_KEY: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_CHAT_MODEL: str = os.getenv("SARVAM_CHAT_MODEL", "sarvam-105b-conversations")
    SARVAM_TTS_MODEL: str = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
    SARVAM_ASR_MODEL: str = os.getenv("SARVAM_ASR_MODEL", "saaras:v3")

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback")
    
    # Supported Languages (8 languages including Bengali)
    SUPPORTED_LANGUAGES = {
        "en": "English",
        "kn": "ಕನ್ನಡ (Kannada)",
        "hi": "हिन्दी (Hindi)",
        "ta": "தமிழ் (Tamil)",
        "te": "తెలుగు (Telugu)",
        "ml": "മലയാളം (Malayalam)",
        "mr": "मराठी (Marathi)",
        "bn": "বাংলা (Bengali)"
    }
    
    # Categories
    CATEGORIES = [
        "Agriculture",
        "Education",
        "Healthcare",
        "Housing",
        "Women and Child Welfare",
        "Employment",
        "Business and Entrepreneurship",
        "Pension",
        "Social Welfare"
    ]

settings = Settings()
