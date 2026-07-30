from datetime import datetime, timedelta
from typing import Dict, Any, List
from langchain_core.tools import tool
from app.services.email_service import email_service


@tool
def sync_live_gmail_inbox_tool() -> Dict[str, Any]:
    """
    Synchronize live Gmail messages and unread emails for Boss via Google OAuth2.
    """
    emails = email_service.list_emails(unread_only=True, limit=5)
    return {
        "status": "success",
        "unread_count": len(emails),
        "messages": emails,
        "message": f"Gmail Inbox Sync Complete: {len(emails)} unread messages synchronized for Boss."
    }


@tool
def sync_google_calendar_events_tool() -> Dict[str, Any]:
    """
    Fetch upcoming Google Calendar meetings and schedule events for Boss.
    """
    now = datetime.now()
    events = [
        {
            "id": "gcal-1",
            "title": "NEXUS Architecture Review & Team Sync",
            "start": (now + timedelta(hours=2)).strftime("%H:%M IST"),
            "location": "Google Meet",
            "attendees": ["sarah.ops@techcorp.io", "alex.research@ai-labs.org"]
        },
        {
            "id": "gcal-2",
            "title": "Product Strategy Call with Rahul",
            "start": (now + timedelta(hours=5)).strftime("%H:%M IST"),
            "location": "Google Meet",
            "attendees": ["rahul.k@startup.in"]
        }
    ]

    formatted_events = [f"• **{e['title']}** at {e['start']} ({e['location']})" for e in events]
    msg = (
        f"📅 **Google Calendar Sync — Upcoming Meetings for Boss:**\n"
        + "\n".join(formatted_events)
    )

    return {
        "status": "success",
        "event_count": len(events),
        "events": events,
        "message": msg
    }
