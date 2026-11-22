import base64
import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.sarvam_service import sarvam_ai, detect_language_from_text

logger = logging.getLogger(__name__)

DEMO_VOICE_PROMPTS = {
    "kn": "ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?",
    "hi": "मेरे लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?",
    "en": "Which government schemes can I apply for?",
    "ta": "எனக்கு என்னென்ன அரசு திட்டங்கள் கிடைக்கின்றன?",
    "te": "నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?",
    "ml": "എനിക്ക് ലഭ്യമായ സർക്കാർ പദ്ധതികൾ ഏതൊക്കെയാണ്?",
    "mr": "माझ्यासाठी कोणत्या सरकारी योजना उपलब्ध आहेत?",
    "bn": "আমার জন্য কোন কোন সরকারি প্রকল্প উপলব্ধ আছে?"
}

async def transcribe_audio(
    audio_base64: Optional[str],
    language: str = "en",
    mock_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transcribes audio using Sarvam ASR (saaras:v3) as the primary provider,
    with graceful fallback to text input or native prompts.
    """
    if mock_text:
        detected = detect_language_from_text(mock_text, default=language)
        return {
            "recognized_text": mock_text,
            "language": detected,
            "provider": "Mock / Direct Input"
        }

    # If audio is provided, attempt Sarvam AI ASR
    if audio_base64 and sarvam_ai.is_configured:
        try:
            # Handle potential data URL scheme
            clean_b64 = audio_base64
            if "," in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]
            audio_bytes = base64.b64decode(clean_b64)
            
            transcript, detected_lang, err = await sarvam_ai.speech_to_text(
                audio_bytes=audio_bytes,
                language=language
            )
            if transcript:
                return {
                    "recognized_text": transcript,
                    "language": detected_lang or language,
                    "provider": "Sarvam AI ASR (saaras:v3)"
                }
            logger.info(f"Sarvam ASR note: {err}")
        except Exception as e:
            logger.error(f"Error processing audio for Sarvam ASR: {e}")

    # Fallback prompt in requested language
    demo_speech = DEMO_VOICE_PROMPTS.get(language, DEMO_VOICE_PROMPTS["en"])
    return {
        "recognized_text": demo_speech,
        "language": language,
        "provider": "BenefitBridge Voice Assistant (Browser Speech API / Fallback)"
    }

async def synthesize_speech(text: str, language: str = "en") -> Dict[str, Any]:
    """
    Synthesizes speech using Sarvam AI TTS (bulbul:v3) as the primary provider.
    Returns audio_base64 (data:audio/wav;base64,...) if generated,
    or signals browser Web Speech API fallback.
    """
    # Detect language from text if generic
    detected_lang = detect_language_from_text(text, default=language)
    
    if sarvam_ai.is_configured and text:
        audio_b64, err = await sarvam_ai.text_to_speech(text=text, language=detected_lang)
        if audio_b64:
            return {
                "text": text,
                "language": detected_lang,
                "audio_url": f"data:audio/wav;base64,{audio_b64}",
                "status": "Sarvam AI Voice Audio (bulbul:v3)"
            }
        logger.info(f"Sarvam TTS note: {err}")

    # Browser Web Speech API fallback
    return {
        "text": text,
        "language": detected_lang,
        "audio_url": None,
        "status": "Ready for Web Speech API Synthesis"
    }
