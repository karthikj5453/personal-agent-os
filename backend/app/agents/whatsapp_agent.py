from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.services.consent_ledger import consent_ledger


def run_whatsapp_agent(state: AgentState) -> Dict[str, Any]:
    """
    WhatsApp Subagent Node:
    Gates message dispatch through Consent Ledger (Pillar 3) before external send.
    """
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = [AgentLogEntry(
        agent="WhatsAppSubagent",
        action="activated",
        details=f"Processing WhatsApp message request: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    )]

    # Create pending entry in Consent Ledger
    pending_entry = consent_ledger.create_pending_entry(
        agent="WhatsAppSubagent",
        action_type="SEND_WHATSAPP",
        target="Contact: Rahul (WhatsApp Web)",
        details={
            "recipient": "Rahul",
            "message": "Meeting scheduled for tomorrow at 5 PM works for me."
        },
        reasoning=(
            "User requested sending a WhatsApp message. "
            "This is an external messaging action and requires explicit user consent before dispatch."
        )
    )

    logs.append(AgentLogEntry(
        agent="WhatsAppSubagent",
        action="consent_gate:SEND_WHATSAPP",
        details=f"Action gated — PENDING_APPROVAL (ID: {pending_entry.id})",
        timestamp=timestamp,
        requires_consent=True
    ))

    output_summary = (
        f"⚠ ACTION GATED — Consent Required\n"
        f"Sending WhatsApp message to Rahul requires your approval.\n"
        f"Consent ID: {pending_entry.id}"
    )

    return {
        "current_agent": "WhatsAppSubagent",
        "next_step": "Supervisor",
        "logs": logs,
        "consent_pending": pending_entry.model_dump(),
        "final_output": output_summary
    }
