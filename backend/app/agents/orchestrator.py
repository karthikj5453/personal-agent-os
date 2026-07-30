"""
HEY Nexus Orchestrator — LangGraph Supervisor with "Boss" Persona, Memory, Coding, & Desktop Swarm

Routing Categories:
  - WAKE_WORD     → Direct "Hey Boss." response
  - EMAIL_TASK    → EmailSubagent (Gmail Inbox, Drafts, Gated Sending)
  - CALENDAR_TASK → Google Calendar Event Sync
  - SYSTEM_TASK   → SystemSubagent (Volume, Brightness, Apps, Hardware Specs)
  - DESKTOP_TASK  → DesktopAgent (Screenshots, Mouse Move, Screen Clicks)
  - RESEARCH_TASK → ResearchSubagent (YouTube, PDF, Web Search)
  - WHATSAPP_TASK → WhatsAppSubagent (Gated WhatsApp Gateway)
  - VISION_TASK   → VisionSubagent (Mood & Emotion Detection)
  - CODING_TASK   → CodingSubagent (Python Sandbox Execution, Git Auto-Commit)
  - MEMORY_TASK   → Memory Engine (Remember / Recall for Boss)
  - GENERAL_QUERY → Direct LLM Response ("Boss" persona)
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
from app.agents.research_agent import run_research_agent
from app.agents.whatsapp_agent import run_whatsapp_agent
from app.agents.vision_agent import run_vision_agent
from app.agents.coding_agent import run_coding_agent
from app.agents.desktop_agent import run_desktop_agent
from app.agents.tools.memory_tools import remember_info_tool, recall_memory_tool
from app.agents.tools.gmail_gcal_tools import sync_google_calendar_events_tool
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
You are HEY Nexus — a futuristic, JARVIS-like Personal AI Operating System.

MANDATORY PERSONA RULES:
- ALWAYS address the user as "Boss".
- When the user says "HEY Nexus", "Nexus", or "Hey Boss", respond immediately with "Hey Boss."
- Tone must be calm, confident, concise, and executive.

Classify the user's natural language command into one of these exact intent categories:
{
  "intent": "WAKE_WORD" | "EMAIL_TASK" | "CALENDAR_TASK" | "SYSTEM_TASK" | "DESKTOP_TASK" | "RESEARCH_TASK" | "WHATSAPP_TASK" | "VISION_TASK" | "CODING_TASK" | "MEMORY_TASK" | "GENERAL_QUERY",
  "reasoning": "<1-2 sentence explanation>"
}

Routing Rules:
- "HEY Nexus", "Nexus", "Hey Boss", "wake up" → WAKE_WORD
- Email/inbox/mail/msg/draft/send email/Sarah/reply → EMAIL_TASK
- Calendar/meeting/schedule/gcal/event/agenda → CALENDAR_TASK
- Volume/sound/brightness/open app/launch/play song/youtube play/spotify/lock screen/hardware/cpu/ram → SYSTEM_TASK
- Screenshot/click position/move mouse/desktop click/type text → DESKTOP_TASK
- Summarize youtube/youtube transcript/summarize pdf/pdf document/search web/find research → RESEARCH_TASK
- Whatsapp/send whatsapp/message rahul/chat whatsapp → WHATSAPP_TASK
- Mood/emotion/check mood/how do I look/webcam emotion → VISION_TASK
- Write code/run python/script/execute code/git commit/push github → CODING_TASK
- Remember/recall/my favorite/what is my/store memory → MEMORY_TASK
- Anything else → GENERAL_QUERY

Support Indic and Hinglish commands.
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
    q = query.lower().strip()
    if q in ["hey nexus", "nexus", "hey boss", "hi nexus"]:
        return {"intent": "WAKE_WORD", "reasoning": "Wake word detected."}
    if any(k in q for k in ["whatsapp", "wa msg"]):
        return {"intent": "WHATSAPP_TASK", "reasoning": "WhatsApp keyword fallback."}
    if any(k in q for k in ["screenshot", "click", "mouse"]):
        return {"intent": "DESKTOP_TASK", "reasoning": "Desktop action fallback."}
    if any(k in q for k in ["calendar", "meeting", "gcal", "agenda"]):
        return {"intent": "CALENDAR_TASK", "reasoning": "Calendar keyword fallback."}
    if any(k in q for k in ["remember", "recall", "favorite"]):
        return {"intent": "MEMORY_TASK", "reasoning": "Memory keyword fallback."}
    if any(k in q for k in ["code", "python", "script", "git commit"]):
        return {"intent": "CODING_TASK", "reasoning": "Coding keyword fallback."}
    if any(k in q for k in ["whatsapp", "wa msg"]):
        return {"intent": "WHATSAPP_TASK", "reasoning": "WhatsApp keyword fallback."}
    if any(k in q for k in ["mood", "emotion", "webcam"]):
        return {"intent": "VISION_TASK", "reasoning": "Vision keyword fallback."}
    if any(k in q for k in ["youtube", "summary", "pdf", "research", "search web"]):
        return {"intent": "RESEARCH_TASK", "reasoning": "Research keyword fallback."}
    if any(k in q for k in ["volume", "brightness", "open", "launch", "play", "lock", "cpu", "ram"]):
        return {"intent": "SYSTEM_TASK", "reasoning": "System keyword fallback."}
    if any(k in q for k in ["email", "inbox", "mail", "draft", "send"]):
        return {"intent": "EMAIL_TASK", "reasoning": "Email keyword fallback."}
    return {"intent": "GENERAL_QUERY", "reasoning": "General query fallback."}


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
        method = f"fallback (LLM error: {str(e)[:60]})"

    intent = classification.get("intent", "GENERAL_QUERY")
    reasoning = classification.get("reasoning", "")

    logs.append(AgentLogEntry(
        agent="Supervisor (Ops)",
        action=f"intent_classified [{method}]",
        details=f"Intent={intent} | Reason: {reasoning}",
        timestamp=timestamp,
        requires_consent=False
    ))

    # Wake Word response
    if intent == "WAKE_WORD":
        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": "FINISH",
            "logs": logs,
            "final_output": "Hey Boss. Systems are online and ready for your command."
        }

    # Calendar handling
    if intent == "CALENDAR_TASK":
        res = sync_google_calendar_events_tool.invoke({})
        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": "FINISH",
            "logs": logs,
            "final_output": f"Boss, {res.get('message', 'Google Calendar synchronized.')}"
        }

    # Memory handling node
    if intent == "MEMORY_TASK":
        if "remember" in user_query.lower():
            res = remember_info_tool.invoke({"key": "user_note", "content": user_query})
            out = f"Boss, {res.get('message', 'Memory stored successfully.')}"
        else:
            res = recall_memory_tool.invoke({"query": user_query})
            out = f"Boss, {res.get('message', 'Memory recall complete.')}"

        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": "FINISH",
            "logs": logs,
            "final_output": out
        }

    intent_map = {
        "EMAIL_TASK": "EmailSubagent",
        "SYSTEM_TASK": "SystemSubagent",
        "RESEARCH_TASK": "ResearchSubagent",
        "WHATSAPP_TASK": "WhatsAppSubagent",
        "VISION_TASK": "VisionSubagent",
        "CODING_TASK": "CodingSubagent",
        "DESKTOP_TASK": "DesktopAgent",
    }

    if intent in intent_map:
        next_step = intent_map[intent]
    else:
        direct_response = None
        if _llm_available and llm is not None:
            try:
                resp = llm.invoke([
                    SystemMessage(content="You are HEY Nexus — an AI Operating System. Always address the user as 'Boss'. Answer concisely and confidently."),
                    HumanMessage(content=user_query)
                ])
                direct_response = resp.content
            except Exception:
                pass
        return {
            "current_agent": "Supervisor (Ops)",
            "next_step": "FINISH",
            "logs": logs,
            "final_output": direct_response or f"Hey Boss, intent recognized as {intent}. All systems standing by."
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
        details="Subagent execution complete. Consolidating final response for Boss.",
        timestamp=timestamp,
        requires_consent=False
    )]
    raw_output = state.get("final_output") or "Task processed successfully."
    if "Boss" not in raw_output:
        raw_output = f"Boss, {raw_output}"
    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": "END",
        "logs": logs,
        "final_output": raw_output
    }


def route_next_step(state: AgentState) -> str:
    next_step = state.get("next_step", "FINISH")
    routing = {
        "EmailSubagent": "email_subagent",
        "SystemSubagent": "system_subagent",
        "ResearchSubagent": "research_subagent",
        "WhatsAppSubagent": "whatsapp_subagent",
        "VisionSubagent": "vision_subagent",
        "CodingSubagent": "coding_subagent",
        "DesktopAgent": "desktop_agent",
    }
    return routing.get(next_step, "response_merger")


# StateGraph Assembly
builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("email_subagent", run_email_agent)
builder.add_node("system_subagent", run_system_agent)
builder.add_node("research_subagent", run_research_agent)
builder.add_node("whatsapp_subagent", run_whatsapp_agent)
builder.add_node("vision_subagent", run_vision_agent)
builder.add_node("coding_subagent", run_coding_agent)
builder.add_node("desktop_agent", run_desktop_agent)
builder.add_node("response_merger", response_merger_node)

builder.set_entry_point("supervisor")

builder.add_conditional_edges(
    "supervisor",
    route_next_step,
    {
        "email_subagent": "email_subagent",
        "system_subagent": "system_subagent",
        "research_subagent": "research_subagent",
        "whatsapp_subagent": "whatsapp_subagent",
        "vision_subagent": "vision_subagent",
        "coding_subagent": "coding_subagent",
        "desktop_agent": "desktop_agent",
        "response_merger": "response_merger"
    }
)

for node in ["email_subagent", "system_subagent", "research_subagent", "whatsapp_subagent", "vision_subagent", "coding_subagent", "desktop_agent"]:
    builder.add_edge(node, "response_merger")

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
