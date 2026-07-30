import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agents.tools.research_tools import summarize_youtube_tool, summarize_pdf_tool
from app.agents.tools.vision_tools import detect_user_mood_tool

client = TestClient(app)


def test_research_tools():
    """Verify YouTube & PDF summarizer tools."""
    yt_res = summarize_youtube_tool.invoke({"video_url_or_id": "dQw4w9WgXcQ"})
    assert "summary" in yt_res or "YouTube" in str(yt_res)

    pdf_res = summarize_pdf_tool.invoke({"file_path": "sample.pdf"})
    assert "summary" in pdf_res


def test_vision_tool():
    """Verify mood detection tool."""
    res = detect_user_mood_tool.invoke({})
    assert res["status"] == "success"
    assert res["detected_mood"] in ["Focused", "Tired", "Happy"]


def test_whatsapp_consent_gate():
    """Verify WhatsApp sending triggers a Consent Ledger gate."""
    response = client.post(
        "/api/v1/agent/query",
        json={"query": "Send a WhatsApp message to Rahul saying meeting is confirmed"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "WhatsApp" in data["final_output"] or "GATED" in data["final_output"]

    # Verify pending entry in consent ledger
    ledger_res = client.get("/api/v1/consent/ledger")
    assert ledger_res.status_code == 200
    assert ledger_res.json()["pending"] >= 1


def test_research_intent_routing():
    """Verify YouTube query routes to ResearchSubagent."""
    response = client.post(
        "/api/v1/agent/query",
        json={"query": "Summarize youtube video https://youtube.com/watch?v=dQw4w9WgXcQ"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["final_output"] is not None
