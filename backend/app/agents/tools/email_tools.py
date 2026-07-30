from typing import Dict, Any, List
from langchain_core.tools import tool
from app.services.email_service import email_service


@tool
def list_unread_emails_tool() -> List[Dict[str, Any]]:
    """List all unread emails in the user's inbox."""
    return email_service.list_emails(unread_only=True)


@tool
def search_emails_tool(query: str) -> List[Dict[str, Any]]:
    """Search emails by keyword, sender name, or topic.
    Args:
        query: Search term (e.g. 'rate limit', 'VaakEval', 'reschedule')
    """
    return email_service.search_emails(query)


@tool
def read_email_details_tool(email_id: str) -> Dict[str, Any]:
    """Retrieve full content of a specific email by ID and mark as read.
    Args:
        email_id: ID of the message (e.g. 'msg-101')
    """
    result = email_service.get_email_by_id(email_id)
    if not result:
        return {"error": f"Email with ID {email_id} not found."}
    return result


@tool
def create_email_draft_tool(recipient: str, subject: str, body: str) -> Dict[str, Any]:
    """Create a draft email response.
    Args:
        recipient: Email address of receiver
        subject: Subject line
        body: Main text content of draft
    """
    return email_service.create_draft(recipient=recipient, subject=subject, body=body)


@tool
def send_email_tool(recipient: str, subject: str, body: str) -> Dict[str, Any]:
    """Send an outbound email (requires consent ledger approval for external action).
    Args:
        recipient: Email address of receiver
        subject: Subject line
        body: Main text content
    """
    return email_service.send_email(recipient=recipient, subject=subject, body=body)
