"""
Sarvam AI Service — Pillar 2: Code-Switched Indic Voice Pipeline

Integrates Sarvam AI APIs:
  - Saarika v2: Indic ASR (speech-to-text) — Hindi, Telugu, Tamil, Kannada, Bengali, Gujarati
  - Translate: Indic language → English task decomposition (for agent routing)
  - Bulbul v2: Indic TTS (text-to-speech) — natural Indian-accent voice responses

When SARVAM_API_KEY is not set, service operates in mock mode for local development.
"""

import httpx
from app.core.config import settings

# Supported Indic languages and their BCP-47 codes
SUPPORTED_LANGUAGES = {
    "hi-IN": "Hindi",
    "te-IN": "Telugu",
    "ta-IN": "Tamil",
    "kn-IN": "Kannada",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "en-IN": "Indian English",
}

# Mock transcripts for development (when no API key is set)
MOCK_TRANSCRIPTS = {
    "default": "Check my inbox for urgent messages and draft a reply to Sarah",
    "hindi": "मेरा inbox check karo aur Sarah ko reply karo",
}


class SarvamService:
    SUPPORTED_LANGUAGES = {
        "hi-IN": "Hindi",
        "te-IN": "Telugu",
        "ta-IN": "Tamil",
        "kn-IN": "Kannada",
        "bn-IN": "Bengali",
        "gu-IN": "Gujarati",
        "en-IN": "Indian English",
    }

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.base_url = settings.SARVAM_BASE_URL
        self.is_mock = not self.api_key or self.api_key == "your_sarvam_api_key_here"

    def get_headers(self) -> dict:
        return {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str = "hi-IN",
        audio_format: str = "wav"
    ) -> dict:
        """
        Saarika v2: Transcribe audio bytes to text in the given Indic language.
        Falls back to mock if API key not configured.
        """
        if self.is_mock:
            return {
                "transcript": MOCK_TRANSCRIPTS.get("default"),
                "language_code": language_code,
                "confidence": 0.97,
                "mode": "mock"
            }

        import base64
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "model": "saarika:v2",
            "audio": audio_b64,
            "language_code": language_code,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/speech-to-text",
                headers=self.get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return {
            "transcript": data.get("transcript", ""),
            "language_code": language_code,
            "confidence": data.get("confidence", 0),
            "mode": "live"
        }

    async def translate_to_english(
        self,
        text: str,
        source_language_code: str = "hi-IN"
    ) -> dict:
        """
        Sarvam Translate: Translate Indic language text to English for agent routing.
        Falls back to passthrough if API key not configured.
        """
        if self.is_mock:
            return {
                "translated_text": text,
                "source_language_code": source_language_code,
                "mode": "mock"
            }

        payload = {
            "input": text,
            "source_language_code": source_language_code,
            "target_language_code": "en-IN",
            "speaker_gender": "Male",
            "mode": "formal",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.base_url}/translate",
                headers=self.get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return {
            "translated_text": data.get("translated_text", text),
            "source_language_code": source_language_code,
            "mode": "live"
        }

    async def synthesize_speech(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "meera"
    ) -> bytes:
        """
        Bulbul v2: Convert text to speech in Indic language with natural Indian accent.
        Falls back to mock silent audio if API key not configured.
        Speakers: meera (female), arjun (male), sonal (female), ravi (male)
        """
        if self.is_mock:
            # Return silent WAV header for mock mode
            silent_wav = bytes([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
                0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
                0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
                0x40, 0x1F, 0x00, 0x00, 0x80, 0x3E, 0x00, 0x00,
                0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
                0x00, 0x00, 0x00, 0x00
            ])
            return silent_wav

        payload = {
            "inputs": [text],
            "target_language_code": target_language_code,
            "speaker": speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.0,
            "model": "bulbul:v2",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/text-to-speech",
                headers=self.get_headers(),
                json=payload,
            )
            response.raise_for_status()
            return response.content

    def detect_language(self, text: str) -> str:
        """
        Simple heuristic language detector for code-switched text.
        Returns BCP-47 language code.
        """
        # Telugu characters
        if any('\u0C00' <= c <= '\u0C7F' for c in text):
            return "te-IN"
        # Tamil characters
        if any('\u0B80' <= c <= '\u0BFF' for c in text):
            return "ta-IN"
        # Kannada characters
        if any('\u0C80' <= c <= '\u0CFF' for c in text):
            return "kn-IN"
        # Bengali characters
        if any('\u0980' <= c <= '\u09FF' for c in text):
            return "bn-IN"
        # Devanagari (Hindi/Marathi)
        if any('\u0900' <= c <= '\u097F' for c in text):
            return "hi-IN"
        return "en-IN"


# Singleton service instance
sarvam_service = SarvamService()
