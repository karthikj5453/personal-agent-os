import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from app.services.sarvam_service import sarvam_service

router = APIRouter()


class SynthesizeRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    speaker: str = "meera"


class TranslateRequest(BaseModel):
    text: str
    source_language_code: str = "hi-IN"


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language_code: str = "hi-IN"
):
    """
    Sarvam Saarika v2: Transcribe uploaded audio file to Indic text.
    Supports: hi-IN, te-IN, ta-IN, kn-IN, bn-IN, gu-IN, en-IN
    """
    try:
        audio_bytes = await audio.read()
        result = await sarvam_service.transcribe(
            audio_bytes=audio_bytes,
            language_code=language_code,
            audio_format=audio.content_type or "audio/wav"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


@router.post("/translate")
async def translate_text(request: TranslateRequest):
    """
    Sarvam Translate: Translate Indic language text to English for agent routing.
    """
    try:
        detected_lang = sarvam_service.detect_language(request.text)
        source_lang = request.source_language_code or detected_lang

        result = await sarvam_service.translate_to_english(
            text=request.text,
            source_language_code=source_lang
        )
        result["detected_language"] = detected_lang
        result["language_name"] = sarvam_service.SUPPORTED_LANGUAGES.get(detected_lang, "Unknown")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """
    Sarvam Bulbul v2: Convert text to natural Indic voice audio.
    Returns audio/wav binary response.
    Speakers: meera (F), arjun (M), sonal (F), ravi (M)
    """
    try:
        audio_bytes = await sarvam_service.synthesize_speech(
            text=request.text,
            target_language_code=request.language_code,
            speaker=request.speaker
        )
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=response.wav"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis error: {str(e)}")


@router.get("/languages")
def get_supported_languages():
    """List all Sarvam-supported Indic languages."""
    return {
        "languages": sarvam_service.SUPPORTED_LANGUAGES,
        "mode": "mock" if sarvam_service.is_mock else "live",
        "tts_speakers": ["meera", "arjun", "sonal", "ravi"]
    }
