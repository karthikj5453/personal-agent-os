from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.api.v1 import ws
from app.core.config import settings
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: Initialize Database Tables & Seed Data
    init_db()
    yield
    # Shutdown: Cleanup resources if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "NEXUS — Production-Grade Personal Agent OS. "
        "Observable Cognition | Sarvam Indic Voice | Accountable Autonomy"
    ),
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", tags=["root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "2.0.0",
        "pillars": [
            "Observable Cognition (Live Node Graph + WebSocket Streaming)",
            "Sarvam Indic Voice Pipeline (Saarika ASR + Bulbul TTS)",
            "Accountable Autonomy (Consent Ledger)",
            "Morning Intelligence Brief",
            "PostgreSQL Database Persistence"
        ],
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "websocket": "/ws/agent-stream"
    }


# Register REST API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Register WebSocket routes
app.include_router(ws.router, prefix="/ws")
