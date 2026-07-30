"""
NEXUS Orchestrator — LangGraph Supervisor with Real GPT-4o-mini Intent Classification

Routing categories:
  - EMAIL_TASK   → EmailSubagent (list, search, read, draft, send)
  - SYSTEM_TASK  → SystemSubagent (volume, brightness, launch app, play music, lock system)
  - GENERAL_QUERY → Direct LLM response from Supervisor
"""

import json
from datetime import datetime
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.agents.state import AgentState, AgentLogEntry
from app.agents.email_agent import run_email_agent
from app.agents.system_agent import run_system_agent
from app.core.config import settings

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

Given the user's natural language command (in English, Hindi, Telugu, Tamil, Kannada, or code-switched Hinglish), classify the intent and extract a structured routing decision.

Respond ONLY with valid JSON in this exact schema:
{
  "intent": "EMAIL_TASK" | "SYSTEM_TASK" | "CALENDAR_TASK" | "RESEARCH_TASK" | "GENERAL_QUERY",
  "action": "list_unread" | "search" | "draft" | "send" | "volume" | "brightness" | "launch_app" | "play_media" | "lock_system" | "none",
  "reasoning": "<1-2 sentence explanation>",
  "extracted_params": {
    "target": "<target app, song query, email recipient, or volume level>",
    "numeric_value": <number if volume or brightness, else null>
  }
}

Rules:
- Email/inbox/mail/message/draft/send/Sarah/reply → EMAIL_TASK
- Volume/sound/brightness/light/open app/launch/play song/youtube/spotify/lock screen → SYSTEM_TASK
- Anything else → GENERAL_QUERY
- Support Indic commands (e.g. "volume 50 percent kar do", "A.R. Rahman play karo", "inbox check karo")
"""


def _classify_intent_llm(query: str) -> Dict[str, Any]:
    messages = [
        SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
        HumanMessage(content=f"User command: {query}")
    ]
    response = llm.invoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw.strip())


def _classify_intent_fallback(query: str) -> Dict[str, Any]:
    q = query.lower()
    email_keywords = ["email", "inbox", "mail", "msg", "draft", "sarah", "reply", "unread", "send"]
    system_keywords = ["volume", "sound", "brightness", "light", "open", "launch", "play", "youtube", "spotify", "lock", "kholo", "खोलो"]

    if any(k in q for k in system_keywords):
        return {
            "intent": "SYSTEM_TASK",
            "action": "system_control",
            "reasoning": "Keyword-based system task classification.",
            "extracted_params": {}
        }
    if any(k in q for k in email_keywords):
        return {
            "intent": "EMAIL_TASK",
            "action": "email_control",
            "reasoning": "Keyword-based email task classification.",
            "extracted_params": {}
        }
    return {
        "intent": "GENERAL_QUERY",
        "action": "none",
        "reasoning": "No matching subagent keywords found.",
        "extracted_params": {}
    }


def supervisor_node(state: AgentState) -> Dict[str, Any]:
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

    if intent == "EMAIL_TASK":
        next_step = "EmailSubagent"
    elif intent == "SYSTEM_TASK":
        next_step = "SystemSubagent"
    else:
        direct_response = None
        if _llm_available and llm is not None:
            try:
                resp = llm.invoke([
                    SystemMessage(content="You are NEXUS, a helpful Personal Agent OS. Answer concisely."),
                    HumanMessage(content=user_query)
                ])
                direct_response = resp.content
            except Exception:
                pass
        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": "FINISH",
            "logs": logs,
            "final_output": direct_response or f"Intent recognized as {intent}."
        }

    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": next_step,
        "logs": logs
    }


def response_merger_node(state: AgentState) -> Dict[str, Any]:
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
    next_step = state.get("next_step", "FINISH")
    if next_step == "EmailSubagent":
        return "email_subagent"
    if next_step == "SystemSubagent":
        return "system_subagent"
    return "response_merger"


# LangGraph StateGraph Assembly
builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("email_subagent", run_email_agent)
builder.add_node("system_subagent", run_system_agent)
builder.add_node("response_merger", response_merger_node)

builder.set_entry_point("supervisor")

builder.add_conditional_edges(
    "supervisor",
    route_next_step,
    {
        "email_subagent": "email_subagent",
        "system_subagent": "system_subagent",
        "response_merger": "response_merger"
    }
)

builder.add_edge("email_subagent", "response_merger")
builder.add_edge("system_subagent", "response_merger")
builder.add_edge("response_merger", END)

orchestrator_graph = builder.compile()


def run_orchestrator(query: str) -> Dict[str, Any]:
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
        "agent_flow": ["Supervisor (Ops)", final_state.get("current_agent", "Subagent"), "Supervisor (Ops)"]
    }
