"""
NEXUS Orchestrator — LangGraph Supervisor with Real GPT-4 Intent Classification

Instead of if/elif keyword matching, the Supervisor now uses GPT-4o-mini to:
  1. Classify the user's intent into a routing category.
  2. Extract structured parameters (recipient, subject, etc.).
  3. Log the model's reasoning as part of the observable cognition trace.

Routing categories:
  - EMAIL_TASK   → EmailSubagent (list, search, read, draft, send)
  - GENERAL_QUERY → Direct LLM response from Supervisor
  (Future: CALENDAR_TASK, RESEARCH_TASK, FILE_TASK)
"""

import json
from datetime import datetime
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.agents.state import AgentState, AgentLogEntry
from app.agents.email_agent import run_email_agent
from app.core.config import settings

# ── LLM Setup ────────────────────────────────────────────────────────────────
_llm_available = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_openai_api_key_here")

if _llm_available:
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0
    )
else:
    llm = None

SUPERVISOR_SYSTEM_PROMPT = """
You are NEXUS Supervisor (Ops) — an intelligent routing agent for a Personal Agent OS.

Given the user's natural language command (which may be in English, Hindi, Telugu, Tamil, Kannada, or code-switched Hinglish), classify the intent and extract a structured routing decision.

Respond ONLY with valid JSON in this exact schema:
{
  "intent": "EMAIL_TASK" | "CALENDAR_TASK" | "RESEARCH_TASK" | "GENERAL_QUERY",
  "action": "list_unread" | "search" | "draft" | "send" | "read" | "none",
  "reasoning": "<1-2 sentence explanation>",
  "extracted_params": {
    "recipient": "<email if mentioned, else null>",
    "subject": "<subject if mentioned, else null>",
    "search_query": "<search term if mentioned, else null>"
  }
}

Rules:
- Email/inbox/mail/message/draft/send/Sarah/reply → EMAIL_TASK
- Calendar/meeting/schedule/event/reschedule → CALENDAR_TASK (route as GENERAL_QUERY for now)
- Research/search web/find info/news → RESEARCH_TASK (route as GENERAL_QUERY for now)
- Anything else → GENERAL_QUERY
- If in Hindi/Hinglish, still classify correctly (e.g., "inbox check karo" → EMAIL_TASK/list_unread)
"""


def _classify_intent_llm(query: str) -> Dict[str, Any]:
    """Use GPT-4o-mini to classify intent. Returns parsed JSON."""
    messages = [
        SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
        HumanMessage(content=f"User command: {query}")
    ]
    response = llm.invoke(messages)
    raw = response.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw.strip())


def _classify_intent_fallback(query: str) -> Dict[str, Any]:
    """Keyword fallback if no OpenAI API key is configured."""
    q = query.lower()
    email_keywords = ["email", "inbox", "mail", "msg", "draft", "sarah", "reply",
                      "unread", "send", "bhejo", "भेजो", "dekho", "देखो", "likho", "लिखो"]
    if any(k in q for k in email_keywords):
        action = "send" if any(k in q for k in ["send", "bhejo", "भेजो"]) else \
                 "draft" if any(k in q for k in ["draft", "reply", "likho", "लिखो"]) else "list_unread"
        return {
            "intent": "EMAIL_TASK",
            "action": action,
            "reasoning": "Keyword-based classification (no OpenAI key configured).",
            "extracted_params": {"recipient": None, "subject": None, "search_query": None}
        }
    return {
        "intent": "GENERAL_QUERY",
        "action": "none",
        "reasoning": "No matching email keywords found.",
        "extracted_params": {}
    }


def supervisor_node(state: AgentState) -> Dict[str, Any]:
    """
    Supervisor (Ops): Classifies user intent via GPT-4o-mini and routes to the
    appropriate subagent. All decisions are logged for observable cognition.
    """
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    timestamp = datetime.now().strftime("%H:%M:%S")
    logs = []

    logs.append(AgentLogEntry(
        agent="Supervisor (Ops)",
        action="received_input",
        details=f"Processing: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    ))

    # Classify intent via real LLM or fallback
    try:
        if _llm_available and llm is not None:
            classification = _classify_intent_llm(user_query)
            method = "GPT-4o-mini"
        else:
            classification = _classify_intent_fallback(user_query)
            method = "keyword-fallback"
    except Exception as e:
        classification = _classify_intent_fallback(user_query)
        method = f"fallback (LLM error: {str(e)[:80]})"

    intent = classification.get("intent", "GENERAL_QUERY")
    action = classification.get("action", "none")
    reasoning = classification.get("reasoning", "")

    logs.append(AgentLogEntry(
        agent="Supervisor (Ops)",
        action=f"intent_classified [{method}]",
        details=f"Intent={intent} | Action={action} | Reason: {reasoning}",
        timestamp=timestamp,
        requires_consent=False
    ))

    # Routing decision
    if intent == "EMAIL_TASK":
        logs.append(AgentLogEntry(
            agent="Supervisor (Ops)",
            action="subagent_routing",
            details=f"Dispatching to EmailSubagent (action={action})",
            timestamp=timestamp,
            requires_consent=False
        ))
        next_step = "EmailSubagent"
    else:
        # Direct LLM response for general queries
        direct_response = None
        if _llm_available and llm is not None:
            try:
                resp = llm.invoke([
                    SystemMessage(content="You are NEXUS, a helpful Personal Agent OS. Answer the user's question concisely."),
                    HumanMessage(content=user_query)
                ])
                direct_response = resp.content
            except Exception:
                pass
        logs.append(AgentLogEntry(
            agent="Supervisor (Ops)",
            action="direct_response",
            details=f"Intent={intent} → Responding directly (no subagent needed)",
            timestamp=timestamp,
            requires_consent=False
        ))
        next_step = "FINISH"
        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": next_step,
            "logs": logs,
            "final_output": direct_response or f"Intent recognized as {intent}. No specialized subagent available yet."
        }

    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": next_step,
        "logs": logs
    }


def response_merger_node(state: AgentState) -> Dict[str, Any]:
    """Merges subagent outputs and finalizes the response."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    logs = [AgentLogEntry(
        agent="Supervisor (Ops)",
        action="result_merge",
        details="Subagent execution complete. Consolidating final response.",
        timestamp=timestamp,
        requires_consent=False
    )]
    final_output = state.get("final_output") or "Task processed successfully."
    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": "END",
        "logs": logs,
        "final_output": final_output
    }


def route_next_step(state: AgentState) -> str:
    """Conditional routing edge based on Supervisor classification."""
    next_step = state.get("next_step", "FINISH")
    if next_step == "EmailSubagent":
        return "email_subagent"
    return "response_merger"


# ── LangGraph StateGraph Assembly ────────────────────────────────────────────
builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("email_subagent", run_email_agent)
builder.add_node("response_merger", response_merger_node)

builder.set_entry_point("supervisor")
builder.add_conditional_edges(
    "supervisor",
    route_next_step,
    {
        "email_subagent": "email_subagent",
        "response_merger": "response_merger"
    }
)
builder.add_edge("email_subagent", "response_merger")
builder.add_edge("response_merger", END)

orchestrator_graph = builder.compile()


def run_orchestrator(query: str) -> Dict[str, Any]:
    """Public execution interface for the NEXUS LangGraph Orchestrator."""
    initial_state: AgentState = {
        "messages": [{"role": "user", "content": query}],
        "current_agent": "Supervisor (Ops)",
        "next_step": "supervisor",
        "email_context": [],
        "logs": [],
        "consent_pending": None,
        "final_output": None
    }

    final_state = orchestrator_graph.invoke(initial_state)

    return {
        "query": query,
        "final_output": final_state.get("final_output", ""),
        "logs": final_state.get("logs", []),
        "email_context": final_state.get("email_context", []),
        "consent_pending": final_state.get("consent_pending"),
        "agent_flow": ["Supervisor (Ops)", "EmailSubagent", "Supervisor (Ops)"]
    }
