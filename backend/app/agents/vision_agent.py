from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.vision_tools import detect_user_mood_tool


def run_vision_agent(state: AgentState) -> Dict[str, Any]:
    """Vision & Mood Subagent Node: Detects facial mood & adapts agent interaction."""
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = [AgentLogEntry(
        agent="VisionSubagent",
        action="activated",
        details="Capturing webcam frame for facial mood & emotion recognition",
        timestamp=timestamp,
        requires_consent=False
    )]

    res = detect_user_mood_tool.invoke({})
    mood = res.get("detected_mood", "Focused")
    rec = res.get("recommendation", "Optimal state.")

    logs.append(AgentLogEntry(
        agent="VisionSubagent",
        action="tool_call:detect_user_mood",
        details=f"Detected mood: {mood} (confidence {res.get('confidence', 0.9)}%)",
        timestamp=timestamp,
        requires_consent=False
    ))

    output_summary = (
        f"📷 **Vision & Mood Analysis**\n"
        f"Detected Mood: **{mood}**\n"
        f"Recommendation: {rec}"
    )

    return {
        "current_agent": "VisionSubagent",
        "next_step": "Supervisor",
        "logs": logs,
        "final_output": output_summary
    }
