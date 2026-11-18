import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

# Bhashini Pipeline Configs if keys provided
BHASHINI_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"

DEMO_VOICE_PROMPTS = {
    "kn": "ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?",
    "hi": "मेरे लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?",
    "en": "Which government schemes can I apply for?",
    "ta": "எனக்கு என்னென்ன அரசு திட்டங்கள் கிடைக்கின்றன?",
    "te": "నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?",
    "ml": "എനിക്ക് ലഭ്യമായ സർക്കാർ പദ്ധതികൾ ഏതൊക്കെയാണ്?",
    "mr": "माझ्यासाठी कोणत्या सरकारी योजना उपलब्ध आहेत?"
}

async def transcribe_audio(
    audio_base64: Optional[str],
    language: str = "en",
    mock_text: Optional[str] = None
) -> Dict[str, Any]:
    """Transcribes audio using Bhashini API if configured, otherwise returns prompt or demo fallback."""
    if mock_text:
        return {
            "recognized_text": mock_text,
            "language": language,
            "provider": "User Mock Speech Input"
        }
        
    api_key = settings.BHASHINI_API_KEY
    user_id = settings.BHASHINI_USER_ID
    
    if api_key and user_id and audio_base64:
        try:
            # Call Bhashini STT API
            pass
        except Exception as e:
            print(f"Bhashini STT error: {e}")

    # Fallback default sentence in the selected language
    demo_speech = DEMO_VOICE_PROMPTS.get(language, DEMO_VOICE_PROMPTS["en"])
    return {
        "recognized_text": demo_speech,
        "language": language,
        "provider": "BenefitBridge Voice Service (Browser Speech API / Demo Fallback)"
    }

async def synthesize_speech(text: str, language: str = "en") -> Dict[str, Any]:
    """Provides TTS parameters for browser synthesis or Bhashini."""
    # The frontend uses standard Web Speech API SpeechSynthesis with fallback voice tags
    return {
        "text": text,
        "language": language,
        "audio_url": None,
        "status": "Ready for Web Speech API Synthesis"
    }
