# 🧠 NEXUS — Production-Grade Personal Agent Operating System

[![CI/CD Pipeline](https://github.com/karthikj5453/personal-agent-os/actions/workflows/ci.yml/badge.svg)](https://github.com/karthikj5453/personal-agent-os/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-emerald.svg)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.0.26-violet.svg)](https://langchain.com)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Indic_Voice-orange.svg)](https://sarvam.ai)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **NEXUS** is an open-source, production-grade Personal Agent Operating System built with a **5-agent LangGraph supervisor swarm**, **Sarvam AI Indic voice pipeline**, **accountable autonomy consent ledger**, **PostgreSQL persistence**, and **HTML5 live webcam vision AI**.

---

## 🏛️ 5-Agent Swarm Topology

```
                       ┌───────────────────────────────┐
                       │     Supervisor (Ops) Node     │
                       │     GPT-4o-mini Classifier    │
                       └───────────────┬───────────────┘
                                       │
     ┌────────────┬────────────┬───────┴───────┬────────────┐
     ▼            ▼            ▼               ▼            ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐
│   Email   │ │  System   │ │ Research  │ │  WhatsApp  │ │  Vision   │
│ Subagent  │ │ Subagent  │ │ Subagent  │ │  Subagent  │ │ Subagent  │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬──────┘ └─────┬─────┘
      │             │             │             │              │
┌─────┴─────────────┴─────────────┴─────────────┴──────────────┴─────┐
│                  Consent Ledger Gate (Pillar 3)                    │
└─────────────────────────────────┬──────────────────────────────────┘
                                  ▼
                     Mission Control Dashboard
```

---

## 🔥 Four Core Pillars

### 1. Observable Cognition (Live Swarm Visualizer)
Watch the AI think in real time via **WebSocket streaming** (`/ws/agent-stream`). The Mission Control UI renders an SVG swarm topology lighting up active nodes as tasks execute.

### 2. Sarvam AI Indic Voice Pipeline (Multilingual, Code-Switched)
Supports **Hindi, Telugu, Tamil, Kannada, and Indian English** using:
- **Sarvam Saarika v2 ASR**: Real-time speech-to-text transcription.
- **Sarvam Bulbul v2 TTS**: Natural Indian-accent voice responses.
- **Push-to-Talk Mic UI**: Live audio capture directly from the browser header.

### 3. Accountable Autonomy (Consent Ledger)
All irreversible or write actions (send email, lock desktop, WhatsApp message) are staged into a **PostgreSQL append-only audit ledger** as `PENDING_APPROVAL`. Nothing runs without your explicit approval.

### 4. Morning Intelligence Brief (APScheduler Cron)
Background cron job running daily at **08:00 IST** aggregating unread emails, calendar alerts, and pending consent gates into a structured morning briefing.

---

## 📦 Swarm Capabilities Overview

- 📧 **Email Subagent**: Read inbox, search emails, draft replies, gated sending.
- 🔊 **System Control Subagent**: Master volume (`0-100%`), monitor brightness, app launcher (`vscode`, `spotify`, `chrome`), YouTube playback, lock desktop gate.
- 📄 **Research Subagent**: YouTube video transcript summarizer, PDF document analyzer (`pypdf`), web search.
- 💬 **WhatsApp Subagent**: Gated messaging dispatch through Consent Ledger.
- 📷 **Vision & Mood AI Subagent**: HTML5 live webcam stream (`WebcamFeed.tsx`) with real-time emotion HUD overlay (`FOCUSED`, `HAPPY`, `TIRED`).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Lucide Icons, WebSockets
- **Backend**: FastAPI, LangGraph, LangChain, Pydantic, APScheduler
- **AI & Voice**: OpenAI GPT-4o-mini, Sarvam AI (Saarika ASR & Bulbul TTS)
- **Database & Cache**: PostgreSQL 16, SQLModel, Redis 7, SQLite Fallback
- **DevOps**: Docker Compose, GitHub Actions CI/CD

---

## ⚡ Quick Start

### 1. Clone & Configure Environment

```bash
git clone https.github.com/karthikj5453/personal-agent-os.git
cd personal-agent-os
cp .env.example .env
```

Add your API keys in `.env`:
```env
SARVAM_API_KEY=your_sarvam_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Run via Docker Compose

```bash
docker compose up -d --build
```

Access services:
- **Mission Control UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 3. Run Locally (Development)

#### Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend:
```bash
cd apps/web
npm install
npm run dev
```

---

## 🧪 Test Suite

Run the full pytest suite (`23 test cases` passing):

```bash
cd backend
python -m pytest tests/ -v
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
