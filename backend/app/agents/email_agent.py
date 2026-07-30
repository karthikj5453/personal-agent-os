from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.email_tools import (
    list_unread_emails_tool,
    search_emails_tool,
    read_email_details_tool,
    create_email_draft_tool,
    send_email_tool
)


def run_email_agent(state: AgentState) -> Dict[str, Any]:
    """Email Subagent Node: Executes domain-specific email operations."""
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()

    logs = []
    timestamp = datetime.now().strftime("%H:%M:%S")

    # 1. Log entry into Email Subagent (Observable Cognition)
    logs.append(AgentLogEntry(
        agent="EmailSubagent",
        action="activated",
        details=f"Processing email query: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    ))

    email_results = []

    # Check if query requests listing unread or urgent emails
    if any(k in query_lower for k in ["unread", "inbox", "check", "mail", "email"]):
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

        output_summary = f"Found {len(emails)} unread emails ({urgent_count} high priority):\n"
        for idx, email in enumerate(emails, 1):
            output_summary += f"{idx}. [{email['priority'].upper()}] From: {email['sender']} | Subject: {email['subject']}\n"

    # Check if query requests drafting a reply
    elif "draft" in query_lower or "reply" in query_lower:
        draft = create_email_draft_tool.invoke({
            "recipient": "sarah.ops@techcorp.io",
            "subject": "Re: URGENT: Production API Rate Limit Spike in AP-South",
            "body": "Hi Sarah,\n\nI have reviewed the rate limit spike in AP-South. Quota increase to Redis cluster approved. Proceed with scaling."
        })
        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="tool_call:create_email_draft",
            details=f"Created draft to {draft.get('recipient')}",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"Draft created for {draft.get('recipient')}:\nSubject: {draft.get('subject')}\nBody: {draft.get('body')}"

    # Search fallback
    else:
        term = query_lower.replace("search", "").replace("find", "").strip()
        emails = search_emails_tool.invoke({"query": term or "urgent"})
        email_results = emails
        logs.append(AgentLogEntry(
            agent="EmailSubagent",
            action="tool_call:search_emails",
            details=f"Searched inbox for '{term}', found {len(emails)} matches",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"Search results for '{term}':\n"
        for email in emails:
            output_summary += f"- [{email['id']}] From {email['sender']}: {email['subject']}\n"

    return {
        "current_agent": "EmailSubagent",
        "next_step": "Supervisor",
        "email_context": email_results,
        "logs": logs,
        "final_output": output_summary
    }
