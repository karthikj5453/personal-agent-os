from fastapi import APIRouter
from app.api.v1 import health, agent, consent, voice, vision, ws
from app.agents.briefing_agent import generate_morning_brief

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(consent.router, prefix="/consent", tags=["consent"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(vision.router, prefix="/vision", tags=["vision"])


@api_router.get("/brief", tags=["brief"])
def morning_brief(language_code: str = "en-IN"):
    """Generate a Morning Intelligence Brief for the user."""
    return generate_morning_brief(language_code=language_code)
