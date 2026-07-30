from typing import Dict, Any
from langchain_core.tools import tool


@tool
def send_whatsapp_message_tool(contact: str, message: str) -> Dict[str, Any]:
    """
    Send a WhatsApp message to a contact or phone number.
    Note: Gated behind Consent Ledger (Pillar 3) before actual dispatch.
    Args:
        contact: Target contact name or phone number.
        message: Body of WhatsApp message.
    """
    return {
        "status": "queued",
        "contact": contact,
        "message": message,
        "platform": "WhatsApp Web"
    }
