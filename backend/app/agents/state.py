from typing import List, Dict, Any, Optional, TypedDict, Annotated
import operator


class AgentLogEntry(TypedDict):
    agent: str            # e.g., "Supervisor", "EmailAgent"
    action: str           # e.g., "intent_parsed", "tool_execution", "result_merged"
    details: str
    timestamp: str
    requires_consent: bool


class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    current_agent: str
    next_step: Optional[str]
    email_context: Optional[List[Dict[str, Any]]]
    logs: Annotated[List[AgentLogEntry], operator.add]
    consent_pending: Optional[Dict[str, Any]]
    final_output: Optional[str]
