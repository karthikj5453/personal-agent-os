# Personal Agent OS — NEXUS

A production-grade Personal Agent Operating System built with LangGraph, FastAPI, Next.js, PostgreSQL, Redis, Docker, and Sarvam AI.

## Status

🚧 Under Active Development — v2.0

## Architecture

```
Browser (NEXUS Mission Control UI)
    │
    ├── WebSocket /ws/agent-stream  (Live Node Graph)
    ├── POST /api/v1/agent/query    (Execute Agent)
    ├── GET/POST /api/v1/consent/   (Consent Ledger)
    └── POST /api/v1/voice/         (Sarvam Indic Voice)
         │
    FastAPI Backend
         │
    LangGraph Supervisor ── EmailSubagent ── CalendarSubagent (coming)
         │
    PostgreSQL + Redis
```

## Four Pillars

1. **Observable Cognition** — Real-time WebSocket node graph showing every LangGraph step
2. **Sarvam Indic Voice** — Hindi / Telugu / Tamil / Kannada voice commands via Sarvam Saarika ASR + Bulbul TTS
3. **Accountable Autonomy** — Consent Ledger gates all irreversible actions (send email, delete event)
4. **Morning Intelligence Brief** — Daily digest of urgent emails + pending consent gates

## Tech Stack

- Next.js 14 (App Router)
- FastAPI + LangGraph
- Sarvam AI (Indic voice)
- PostgreSQL 16
- Redis 7
- Docker Compose

## Quick Start

```bash
cp .env.example .env
# Add your SARVAM_API_KEY to .env

docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws/agent-stream

## License

MIT
