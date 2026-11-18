from fastapi import APIRouter
from app.schemas.schemas import (
    VoiceTranscribeRequest, VoiceTranscribeResponse,
    VoiceSynthesizeRequest, VoiceSynthesizeResponse
)
from app.services.voice_service import transcribe_audio, synthesize_speech

router = APIRouter()

@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe(payload: VoiceTranscribeRequest):
    result = await transcribe_audio(
        audio_base64=payload.audio_base64,
        language=payload.language,
        mock_text=payload.mock_text
    )
    return VoiceTranscribeResponse(**result)

@router.post("/synthesize", response_model=VoiceSynthesizeResponse)
async def synthesize(payload: VoiceSynthesizeRequest):
    result = await synthesize_speech(
        text=payload.text,
        language=payload.language
    )
    return VoiceSynthesizeResponse(**result)
