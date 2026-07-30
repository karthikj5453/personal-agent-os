import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.email_service import email_service
from app.agents.orchestrator import run_orchestrator

client = TestClient(app)


def test_email_service():
    """Verify mock email service inbox and tools."""
    emails = email_service.list_emails()
    assert len(emails) > 0

    search_res = email_service.search_emails("URGENT")
    assert len(search_res) > 0
    assert "Rate Limit" in search_res[0]["subject"]


def test_orchestrator_email_routing():
    """Verify LangGraph supervisor intent classification and log stream generation."""
    query = "Check my inbox for urgent messages"
    result = run_orchestrator(query)

    assert result["query"] == query
    assert "Found" in result["final_output"]
    assert len(result["logs"]) >= 3

    # Check observable cognition logs
    agents = [log["agent"] for log in result["logs"]]
    assert "Supervisor (Ops)" in agents
    assert "EmailSubagent" in agents


def test_agent_api_endpoint():
    """Verify POST /api/v1/agent/query endpoint."""
    response = client.post(
        "/api/v1/agent/query",
        json={"query": "Draft a reply to Sarah regarding the Redis quota"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Draft created" in data["final_output"]
    assert len(data["logs"]) > 0
