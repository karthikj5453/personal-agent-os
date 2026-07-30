import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.consent_ledger import ConsentLedgerService

client = TestClient(app)


def test_consent_ledger_create_pending():
    """Verify that a pending consent entry is created correctly."""
    service = ConsentLedgerService()
    entry = service.create_pending_entry(
        agent="EmailSubagent",
        action_type="SEND_EMAIL",
        target="test@example.com",
        details={"recipient": "test@example.com", "subject": "Test", "body": "Hello"},
        reasoning="Test reasoning"
    )
    assert entry.status == "PENDING_APPROVAL"
    assert entry.agent == "EmailSubagent"
    assert entry.action_type == "SEND_EMAIL"


def test_consent_ledger_approve():
    """Verify approval executes the action and updates status."""
    service = ConsentLedgerService()
    entry = service.create_pending_entry(
        agent="EmailSubagent",
        action_type="SEND_EMAIL",
        target="sarah.ops@techcorp.io",
        details={
            "recipient": "sarah.ops@techcorp.io",
            "subject": "Re: Test",
            "body": "Approved."
        },
        reasoning="Test approval"
    )
    result = service.approve(entry.id)
    assert result["status"] == "APPROVED"
    assert "execution_result" in result

    updated = service.get_by_id(entry.id)
    assert updated.status == "APPROVED"


def test_consent_ledger_reject():
    """Verify rejection updates status without executing action."""
    service = ConsentLedgerService()
    entry = service.create_pending_entry(
        agent="EmailSubagent",
        action_type="SEND_EMAIL",
        target="spam@example.com",
        details={"recipient": "spam@example.com", "subject": "Spam", "body": "No"},
        reasoning="Test rejection"
    )
    result = service.reject(entry.id)
    assert result["status"] == "REJECTED"

    updated = service.get_by_id(entry.id)
    assert updated.status == "REJECTED"


def test_consent_api_ledger_endpoint():
    """Verify GET /api/v1/consent/ledger is accessible."""
    response = client.get("/api/v1/consent/ledger")
    assert response.status_code == 200
    data = response.json()
    assert "entries" in data
    assert "pending" in data


def test_send_email_triggers_consent_gate():
    """Verify that a send email query creates a PENDING_APPROVAL consent entry."""
    response = client.post(
        "/api/v1/agent/query",
        json={"query": "Send an email to Sarah approving the Redis quota"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "GATED" in data["final_output"] or "Consent" in data["final_output"]

    # Check consent ledger has pending entry
    ledger_res = client.get("/api/v1/consent/ledger")
    ledger_data = ledger_res.json()
    assert ledger_data["pending"] >= 1


def test_voice_languages_endpoint():
    """Verify GET /api/v1/voice/languages returns supported Indic languages."""
    response = client.get("/api/v1/voice/languages")
    assert response.status_code == 200
    data = response.json()
    assert "hi-IN" in data["languages"]
    assert "te-IN" in data["languages"]
    assert "ta-IN" in data["languages"]
