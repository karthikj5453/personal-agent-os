from datetime import datetime
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState, AgentLogEntry
from app.agents.email_agent import run_email_agent


def supervisor_node(state: AgentState) -> Dict[str, Any]:
    """Supervisor (Ops): Parses user intent and routes task to appropriate subagent."""
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = []
    logs.append(AgentLogEntry(
        agent="Supervisor (Ops)",
        action="intent_parse",
        details=f"Received input: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    ))

    # Route decision: If email/inbox/message related -> EmailSubagent
    if any(keyword in query_lower for keyword in ["email", "inbox", "mail", "msg", "draft", "sarah", "reply", "unread"]):
        logs.append(AgentLogEntry(
            agent="Supervisor (Ops)",
            action="subagent_routing",
            details="Intent classified as [EMAIL_TASK] -> Dispatching to EmailSubagent",
            timestamp=timestamp,
            requires_consent=False
        ))
        next_step = "EmailSubagent"
    else:
        logs.append(AgentLogEntry(
            agent="Supervisor (Ops)",
            action="direct_response",
            details="Intent classified as [GENERAL_QUERY] -> Responding directly",
            timestamp=timestamp,
            requires_consent=False
        ))
        next_step = "FINISH"

    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": next_step,
        "logs": logs
    }


def response_merger_node(state: AgentState) -> Dict[str, Any]:
    """Merges outputs and logs from subagent nodes for supervisor response."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    current_logs = state.get("logs", [])

    logs = [
        AgentLogEntry(
            agent="Supervisor (Ops)",
            action="result_merge",
            details="Subagent execution completed. Consolidating final response.",
            timestamp=timestamp,
            requires_consent=False
        )
    ]

    final_output = state.get("final_output") or "Task processed successfully."

    return {
        "current_agent": "Supervisor (Ops)",
        "next_step": "END",
        "logs": logs,
        "final_output": final_output
    }


def route_next_step(state: AgentState) -> str:
    """Conditional routing edge."""
    next_step = state.get("next_step", "FINISH")
    if next_step == "EmailSubagent":
        return "email_subagent"
    return "response_merger"


# Construct LangGraph State Graph
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
    """Public execution interface for the LangGraph Orchestrator graph."""
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

    # Format trace log stream for observable cognition UI
    logs = final_state.get("logs", [])

    return {
        "query": query,
        "final_output": final_state.get("final_output", ""),
        "logs": logs,
        "email_context": final_state.get("email_context", []),
        "agent_flow": ["Supervisor (Ops)", "EmailSubagent", "Supervisor (Ops)"]
    }
