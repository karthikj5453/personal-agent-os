"""
Morning Intelligence Brief Agent — Pillar 4: Proactive Situational Awareness

Scheduled at 08:00 IST daily:
1. Reads high-priority unread emails.
2. Checks pending consent gates.
3. Generates a structured morning briefing.
4. (With Sarvam API key): synthesizes audio via Bulbul TTS in user's language.
"""

from datetime import datetime
from typing import Dict, Any, List
from app.services.email_service import email_service
from app.services.consent_ledger import consent_ledger


def generate_morning_brief(language_code: str = "en-IN") -> Dict[str, Any]:
    """Generate a daily intelligence brief from all agent data sources."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 1. High-priority unread emails
    all_emails = email_service.list_emails(unread_only=True)
    urgent_emails = [e for e in all_emails if e.get("priority") == "high"]

    # 2. Pending consent gates
    pending_gates = consent_ledger.get_pending()

    # 3. Build brief text
    sections = []

    sections.append(f"Good morning! Here is your NEXUS Intelligence Brief for {timestamp}.")

    if urgent_emails:
        sections.append(
            f"\n📨 EMAIL ALERTS: You have {len(urgent_emails)} high-priority unread "
            f"messages:\n"
        )
        for email in urgent_emails[:3]:
            sections.append(f"  • From {email['sender']}: {email['subject']}")
    else:
        sections.append("\n✅ No urgent emails. Your inbox is clear.")

    if pending_gates:
        sections.append(
            f"\n⚠ CONSENT REQUIRED: {len(pending_gates)} agent action(s) are "
            f"awaiting your approval in the Consent Ledger."
        )
        for gate in pending_gates[:2]:
            sections.append(f"  • {gate.action_type} → {gate.target}")
    else:
        sections.append("\n✅ No pending consent gates.")

    sections.append(
        "\nNEXUS is ready and monitoring all channels. Have a productive day."
    )

    brief_text = "\n".join(sections)

    return {
        "timestamp": timestamp,
        "language_code": language_code,
        "brief_text": brief_text,
        "urgent_email_count": len(urgent_emails),
        "pending_consent_count": len(pending_gates),
        "urgent_emails": urgent_emails[:3],
        "pending_gates": [g.model_dump() for g in pending_gates[:3]],
    }
