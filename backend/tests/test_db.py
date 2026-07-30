import pytest
from app.db.init_db import init_db
from app.services.email_service import email_service
from app.services.consent_ledger import consent_ledger


def test_database_initialization():
    """Verify database initialization and table seeding."""
    init_db()
    emails = email_service.list_emails()
    assert len(emails) >= 3


def test_database_email_crud():
    """Verify database email create draft and send persistence."""
    draft = email_service.create_draft("test.db@example.com", "DB Subject", "DB Body")
    assert draft["is_draft"] is True
    assert draft["recipient"] == "test.db@example.com"

    drafts = email_service.get_drafts()
    assert len(drafts) >= 1

    sent = email_service.send_email("test.send@example.com", "Sent Subject", "Sent Body")
    assert sent["status"] == "sent"


def test_database_consent_ledger_persistence():
    """Verify consent ledger DB persistence."""
    entry = consent_ledger.create_pending_entry(
        agent="TestAgent",
        action_type="DB_ACTION",
        target="TargetDB",
        details={"key": "val"},
        reasoning="Testing DB persistence"
    )
    assert entry.status == "PENDING_APPROVAL"

    all_entries = consent_ledger.get_all()
    assert any(e.id == entry.id for e in all_entries)

    app_res = consent_ledger.approve(entry.id)
    assert app_res["status"] == "APPROVED"
