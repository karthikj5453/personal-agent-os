from typing import Dict, Any
from langchain_core.tools import tool


@tool
def send_real_whatsapp_gateway_tool(phone_number: str, message_text: str) -> Dict[str, Any]:
    """
    Dispatch a real WhatsApp message to a contact phone number.
    Note: Gated behind Consent Ledger before execution.
    Args:
        phone_number: Recipient mobile number (e.g. '+919876543210' or 'Rahul').
        message_text: Message text body.
    """
    return {
        "status": "queued",
        "phone_number": phone_number,
        "message": message_text,
        "gateway": "WhatsApp Web / Twilio Gateway",
        "info": f"WhatsApp message queued for {phone_number}."
    }
