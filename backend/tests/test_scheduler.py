import pytest
from app.core.scheduler import scheduled_morning_brief_job, get_latest_cached_brief


def test_scheduled_morning_brief_job():
    """Verify scheduled morning brief job execution."""
    scheduled_morning_brief_job()
    brief = get_latest_cached_brief()
    assert brief is not None
    assert "brief_text" in brief
    assert "NEXUS" in brief["brief_text"]
