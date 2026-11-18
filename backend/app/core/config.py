import os

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
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    
    # Supported Languages
    SUPPORTED_LANGUAGES = {
        "en": "English",
        "kn": "ಕನ್ನಡ (Kannada)",
        "hi": "हिन्दी (Hindi)",
        "ta": "தமிழ் (Tamil)",
        "te": "తెలుగు (Telugu)",
        "ml": "മലയാളം (Malayalam)",
        "mr": "मराठी (Marathi)"
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
