from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.email_tools import (
    list_unread_emails_tool,
    search_emails_tool,
    create_email_draft_tool,
)
from app.services.consent_ledger import consent_ledger


def run_email_agent(state: AgentState) -> Dict[str, Any]:
    """
    Email Subagent Node: Executes domain-specific email operations.

    Design:
    - READ operations (list, search, read) → execute immediately.
    - WRITE operations (send_email) → gate via Consent Ledger (Pillar 3).
      The email is NOT sent automatically — a PENDING_APPROVAL entry is created
      and the user must approve via the Mission Control UI or voice command.
    """
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = []
    email_results = []
    consent_pending = None

    # Log activation
    logs.append(AgentLogEntry(
        agent="EmailSubagent",
        action="activated",
        details=f"Processing: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    ))

    # --- SEND ACTION → Consent Gate (Pillar 3) ---
    if any(k in query_lower for k in ["send", "send email", "bhejo", "भेजो"]):
        pending_entry = consent_ledger.create_pending_entry(
            agent="EmailSubagent",
            action_type="SEND_EMAIL",
            target="sarah.ops@techcorp.io",
            details={
                "recipient": "sarah.ops@techcorp.io",
                "subject": "Re: URGENT: Production API Rate Limit Spike in AP-South",
                "body": (
                    "Hi Sarah,\n\nApproved. Please proceed with doubling the Redis "
                    "quota for AP-South. I'll monitor the dashboards and will ping "
                    "if we see further anomalies.\n\nRegards"
                )
            },
            reasoning=(
                "User requested sending a reply to Sarah regarding the Redis rate limit spike. "
                "This is an irreversible external communication and requires explicit user approval "
                "before being dispatched per the NEXUS Accountable Autonomy policy (Pillar 3)."
            )
        )
        consent_pending = pending_entry.model_dump()

        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="consent_gate:SEND_EMAIL",
            details=(
                f"Action gated — PENDING_APPROVAL (ID: {pending_entry.id}). "
                "Approve in Consent Ledger to dispatch email to sarah.ops@techcorp.io."
            ),
            timestamp=timestamp,
            requires_consent=True
        ))

        output_summary = (
            f"⚠ ACTION GATED — Consent Required\n"
            f"Sending email to sarah.ops@techcorp.io requires your approval.\n"
            f"Consent ID: {pending_entry.id}\n"
            f"→ Approve or Reject in the Consent Ledger panel."
        )

    # --- LIST / CHECK UNREAD ---
    elif any(k in query_lower for k in ["unread", "inbox", "check", "mail", "email", "dekho", "देखो"]):
        emails = list_unread_emails_tool.invoke({})
        email_results = emails
        urgent_count = sum(1 for e in emails if e.get("priority") == "high")

        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="tool_call:list_unread_emails",
            details=f"Retrieved {len(emails)} unread messages ({urgent_count} high priority)",
            timestamp=timestamp,
            requires_consent=False
        ))

        output_summary = f"📬 Found {len(emails)} unread emails ({urgent_count} high priority):\n\n"
        for idx, email in enumerate(emails, 1):
            output_summary += (
                f"{idx}. [{email['priority'].upper()}] "
                f"From: {email['sender']}\n"
                f"   Subject: {email['subject']}\n"
            )

    # --- DRAFT EMAIL ---
    elif any(k in query_lower for k in ["draft", "reply", "likho", "लिखो"]):
        draft = create_email_draft_tool.invoke({
            "recipient": "sarah.ops@techcorp.io",
            "subject": "Re: URGENT: Production API Rate Limit Spike in AP-South",
            "body": (
                "Hi Sarah,\n\nI have reviewed the rate limit spike in AP-South. "
                "Redis quota increase is approved. Please proceed with scaling."
            )
        })
        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="tool_call:create_email_draft",
            details=f"Draft created for {draft.get('recipient')}",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = (
            f"✏ Draft Created\n"
            f"To: {draft.get('recipient')}\n"
            f"Subject: {draft.get('subject')}\n\n"
            f"{draft.get('body')}"
        )

    # --- SEARCH FALLBACK ---
    else:
        term = query_lower.strip()
        emails = search_emails_tool.invoke({"query": term or "urgent"})
        email_results = emails
        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="tool_call:search_emails",
            details=f"Searched inbox for '{term}', found {len(emails)} matches",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🔍 Search results for '{term}':\n"
        for email in emails:
            output_summary += f"- [{email['id']}] {email['sender']}: {email['subject']}\n"

    return {
        "current_agent": "EmailSubagent",
        "next_step": "Supervisor",
        "email_context": email_results,
        "logs": logs,
        "consent_pending": consent_pending,
        "final_output": output_summary
    }
