import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, List, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Official Sarvam BCP-47 / language codes for 8 supported languages
SARVAM_LANG_MAP: Dict[str, str] = {
    "en": "en-IN",
    "kn": "kn-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
}

# Voice speakers supported by bulbul:v3
# Available: aditya, ritu, ashutosh, priya, etc.
DEFAULT_SPEAKER = "ritu"

# Language detection heuristic for Indian scripts
SCRIPT_LANG_RANGES = [
    (0x0C80, 0x0CFF, "kn"),  # Kannada
    (0x0900, 0x097F, "hi"),  # Devanagari (Hindi/Marathi)
    (0x0B80, 0x0BFF, "ta"),  # Tamil
    (0x0C00, 0x0C7F, "te"),  # Telugu
    (0x0D00, 0x0D7F, "ml"),  # Malayalam
    (0x0980, 0x09FF, "bn"),  # Bengali
]

MARATHI_INDICATORS = [
    "आहे", "आहेत", "नाही", "कागदपत्रे", "मिळेल", "शेतकरी",
    "शासकीय", "कशी", "करावी"
]

def detect_language_from_text(text: str, default: str = "en") -> str:
    """Accurately identifies language from Unicode script and lexical markers."""
    if not text:
        return default
        
    counts: Dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        for start, end, lang in SCRIPT_LANG_RANGES:
            if start <= cp <= end:
                counts[lang] = counts.get(lang, 0) + 1
                break
                
    if not counts:
        return default
        
    top_lang = max(counts, key=counts.get)
    # Disambiguate Hindi vs Marathi in Devanagari
    if top_lang == "hi":
        lower_text = text.lower()
        if any(w in lower_text for w in MARATHI_INDICATORS):
            return "mr"
            
    return top_lang

class SarvamAIService:
    """
    Official Sarvam AI client for BenefitBridge India.
    Handles:
      1. Conversational Chat Completion (sarvam-105b-conversations)
      2. Speech-to-Text ASR (saaras:v3)
      3. Text-to-Speech TTS (bulbul:v3)
    Gracefully handles API rate limits, timeouts, and quota exhaustion with resilient fallbacks.
    """
    
    def __init__(self):
        self.base_url = "https://api.sarvam.ai"
        
    @property
    def api_key(self) -> str:
        return settings.SARVAM_API_KEY or ""
        
    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.startswith("sk_"))
        
    def _get_headers(self) -> Dict[str, str]:
        return {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 800
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Calls Sarvam AI chat completion API (sarvam-105b-conversations).
        Returns (reply_content, error_or_status_message).
        """
        if not self.is_configured:
            return None, "SARVAM_API_KEY_NOT_CONFIGURED"
            
        use_model = model or settings.SARVAM_CHAT_MODEL
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content"), None
                elif resp.status_code == 402:
                    logger.warning("Sarvam API quota exceeded (HTTP 402).")
                    return None, "QUOTA_EXHAUSTED"
                else:
                    logger.warning(f"Sarvam chat API returned status {resp.status_code}: {resp.text[:150]}")
                    return None, f"HTTP_{resp.status_code}"
        except httpx.TimeoutException:
            logger.error("Sarvam chat API timeout")
            return None, "TIMEOUT"
        except Exception as e:
            logger.error(f"Sarvam chat API exception: {type(e).__name__}")
            return None, "EXCEPTION"
            
        return None, "UNKNOWN_ERROR"

    async def text_to_speech(
        self,
        text: str,
        language: str = "en",
        speaker: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Calls Sarvam AI Text-to-Speech API (bulbul:v3).
        Handles long text by chunking into segments that the API can process,
        then concatenates the resulting audio.
        Returns (base64_audio_data, error_or_status).
        
        IMPORTANT: Does NOT truncate text. Sends the full cleaned text to the API.
        If text exceeds 500 chars, splits into chunks and processes each sequentially.
        """
        if not self.is_configured:
            return None, "SARVAM_API_KEY_NOT_CONFIGURED"
            
        lang_code = SARVAM_LANG_MAP.get(language, "en-IN")
        use_speaker = speaker or DEFAULT_SPEAKER
        url = f"{self.base_url}/text-to-speech"
        
        # Clean text for speech synthesis (strip markdown headers, bold, bullets, links)
        import re
        clean_text = text
        clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)  # keep link text
        clean_text = re.sub(r'^#{1,6}\s+', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', clean_text)
        clean_text = re.sub(r'`{1,3}[^`]*`{1,3}', '', clean_text)
        clean_text = re.sub(r'^>\s*', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'^[-*•]\s+', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'^\d+[.)]\s+', '', clean_text, flags=re.MULTILINE)
        clean_text = clean_text.replace("*", "").replace("#", "").replace("`", "").strip()
        
        if not clean_text:
            return None, "EMPTY_TEXT"
        
        # Split into chunks if text is long (Sarvam API accepts up to ~500 chars per request)
        max_chunk = 480
        chunks = []
        if len(clean_text) <= max_chunk:
            chunks = [clean_text]
        else:
            remaining = clean_text
            while remaining:
                if len(remaining) <= max_chunk:
                    chunks.append(remaining)
                    break
                # Find sentence boundary
                split_at = -1
                search_region = remaining[:max_chunk]
                for i in range(len(search_region) - 1, max(40, len(search_region) // 3), -1):
                    if search_region[i] in '.!?;':
                        split_at = i + 1
                        break
                if split_at == -1:
                    # Try comma
                    for i in range(len(search_region) - 1, 40, -1):
                        if search_region[i] == ',':
                            split_at = i + 1
                            break
                if split_at == -1:
                    # Try space
                    last_space = search_region.rfind(' ')
                    split_at = last_space if last_space > 20 else max_chunk
                chunk = remaining[:split_at].strip()
                if chunk:
                    chunks.append(chunk)
                remaining = remaining[split_at:].strip()
        
        # Process each chunk through the API
        import base64
        all_audio_bytes = b""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for chunk_text in chunks:
                    if not chunk_text.strip():
                        continue
                    payload = {
                        "inputs": [chunk_text],
                        "target_language_code": lang_code,
                        "speaker": use_speaker,
                        "model": settings.SARVAM_TTS_MODEL
                    }
                    resp = await client.post(url, json=payload, headers=self._get_headers())
                    if resp.status_code == 200:
                        data = resp.json()
                        audios = data.get("audios", [])
                        if audios and len(audios) > 0:
                            audio_b64 = audios[0]
                            audio_bytes = base64.b64decode(audio_b64)
                            all_audio_bytes += audio_bytes
                    elif resp.status_code == 402:
                        if all_audio_bytes:
                            # Return what we have so far
                            break
                        return None, "QUOTA_EXHAUSTED"
                    else:
                        logger.warning(f"Sarvam TTS chunk returned {resp.status_code}: {resp.text[:150]}")
                        if all_audio_bytes:
                            break
                        return None, f"HTTP_{resp.status_code}"
        except Exception as e:
            logger.error(f"Sarvam TTS exception: {type(e).__name__}")
            if all_audio_bytes:
                # Return partial audio
                return base64.b64encode(all_audio_bytes).decode(), None
            return None, "EXCEPTION"
        
        if all_audio_bytes:
            return base64.b64encode(all_audio_bytes).decode(), None
            
        return None, "UNKNOWN_ERROR"

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        filename: str = "audio.wav"
    ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Calls Sarvam AI Speech-to-Text ASR API (saaras:v3).
        Returns (transcript, detected_language, error_or_status).
        """
        if not self.is_configured:
            return None, None, "SARVAM_API_KEY_NOT_CONFIGURED"
            
        url = f"{self.base_url}/speech-to-text"
        headers = {
            "api-subscription-key": self.api_key
        }
        
        files = {
            "file": (filename, audio_bytes, "audio/wav")
        }
        data = {
            "model": settings.SARVAM_ASR_MODEL
        }
        if language and language in SARVAM_LANG_MAP:
            data["language_code"] = SARVAM_LANG_MAP[language]
            
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, data=data, files=files, headers=headers)
                if resp.status_code == 200:
                    res_json = resp.json()
                    transcript = res_json.get("transcript", "")
                    detected_lang = res_json.get("language_code", "en-IN")
                    # Map back to short code
                    short_lang = "en"
                    for k, v in SARVAM_LANG_MAP.items():
                        if v.lower() == detected_lang.lower():
                            short_lang = k
                            break
                    return transcript, short_lang, None
                elif resp.status_code == 402:
                    return None, None, "QUOTA_EXHAUSTED"
                else:
                    return None, None, f"HTTP_{resp.status_code}"
        except Exception as e:
            logger.error(f"Sarvam ASR exception: {type(e).__name__}")
            return None, None, "EXCEPTION"

sarvam_ai = SarvamAIService()
