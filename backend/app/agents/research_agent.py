from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.research_tools import summarize_youtube_tool, summarize_pdf_tool, web_search_tool


def run_research_agent(state: AgentState) -> Dict[str, Any]:
    """Research Subagent Node: Handles YouTube video summaries, PDF analysis, and web search."""
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = [AgentLogEntry(
        agent="ResearchSubagent",
        action="activated",
        details=f"Processing research query: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    )]

    if "youtube" in query_lower or "video" in query_lower or "youtu.be" in query_lower:
        res = summarize_youtube_tool.invoke({"video_url_or_id": user_query})
        logs.append(AgentLogEntry(
            agent="ResearchSubagent",
            action="tool_call:summarize_youtube",
            details=f"Summarized YouTube video ID: {res.get('video_id')}",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = res.get("summary", "YouTube video summarized.")

    elif "pdf" in query_lower or "document" in query_lower or "file" in query_lower:
        res = summarize_pdf_tool.invoke({"file_path": "document.pdf"})
        logs.append(AgentLogEntry(
            agent="ResearchSubagent",
            action="tool_call:summarize_pdf",
            details="Analyzed document content",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = res.get("summary", "PDF document summarized.")

    else:
        res = web_search_tool.invoke({"query": user_query})
        logs.append(AgentLogEntry(
            agent="ResearchSubagent",
            action="tool_call:web_search",
            details=f"Searched web for '{user_query}'",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🌐 **Web Research Results for '{user_query}':**\n"
        for r in res.get("results", []):
            output_summary += f"• **{r['title']}**: {r['snippet']}\n"

    return {
        "current_agent": "ResearchSubagent",
        "next_step": "Supervisor",
        "logs": logs,
        "final_output": output_summary
    }
