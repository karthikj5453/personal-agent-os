import pytest
from app.agents.tools.desktop_action_tools import take_desktop_screenshot_tool, move_mouse_cursor_tool
from app.agents.tools.gmail_gcal_tools import sync_live_gmail_inbox_tool, sync_google_calendar_events_tool
from app.agents.desktop_agent import run_desktop_agent


def test_take_desktop_screenshot():
    """Verify desktop screenshot tool execution."""
    res = take_desktop_screenshot_tool.invoke({})
    assert res["status"] in ["success", "simulated", "mock"]


def test_move_mouse_cursor():
    """Verify moving mouse cursor tool."""
    res = move_mouse_cursor_tool.invoke({"x": 400, "y": 400})
    assert res["status"] in ["success", "simulated", "mock"]


def test_desktop_agent_click_consent_gate():
    """Verify desktop screen click triggers Consent Ledger gate."""
    result = run_desktop_agent({"messages": [{"role": "user", "content": "Click screen position 500 500"}]})
    assert result["consent_pending"] is not None
    assert result["consent_pending"]["action_type"] == "DESKTOP_CLICK"


def test_gmail_gcal_sync_tools():
    """Verify live Gmail and Google Calendar sync tools."""
    gmail_res = sync_live_gmail_inbox_tool.invoke({})
    assert gmail_res["status"] == "success"

    gcal_res = sync_google_calendar_events_tool.invoke({})
    assert gcal_res["status"] == "success"
    assert gcal_res["event_count"] >= 1
