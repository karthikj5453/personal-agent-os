import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agents.tools.system_tools import adjust_volume_tool, play_media_tool, launch_app_tool
from app.agents.system_agent import run_system_agent

client = TestClient(app)


def test_adjust_volume_tool():
    """Verify volume tool execution."""
    res = adjust_volume_tool.invoke({"level": 40})
    assert res["status"] in ["success", "error"]
    assert res["level"] == 40


def test_play_media_tool():
    """Verify YouTube media playback tool execution."""
    res = play_media_tool.invoke({"query": "Lofi beats", "platform": "youtube"})
    assert res["status"] == "success"
    assert "youtube.com" in res["url"]


def test_system_lock_triggers_consent_gate():
    """Verify locking system triggers a Consent Ledger gate."""
    result = run_system_agent({"messages": [{"role": "user", "content": "Lock my computer"}]})
    assert result["consent_pending"] is not None
    assert result["consent_pending"]["action_type"] == "SYSTEM_LOCK"


def test_system_intent_routing():
    """Verify orchestrator routes volume command to SystemSubagent."""
    response = client.post(
        "/api/v1/agent/query",
        json={"query": "Set volume to 50 percent"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "volume" in data["final_output"].lower() or "50" in data["final_output"]
