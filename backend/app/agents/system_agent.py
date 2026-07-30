import re
from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.system_tools import (
    adjust_volume_tool,
    adjust_brightness_tool,
    launch_app_tool,
    play_media_tool,
    lock_system_tool,
    get_system_metrics_tool,
)
from app.services.consent_ledger import consent_ledger


def run_system_agent(state: AgentState) -> Dict[str, Any]:
    """
    System Control & Media Subagent Node:
    Handles OS volume, screen brightness, app launching, media playback, and lock actions.
    Irreversible actions (like locking system or sleeping) are gated via Consent Ledger (Pillar 3).
    """
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = []
    consent_pending = None

    logs.append(AgentLogEntry(
        agent="SystemSubagent",
        action="activated",
        details=f"Processing system control request: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    ))

    output_summary = ""

    # --- LOCK SYSTEM → Consent Gate ---
    if any(k in query_lower for k in ["lock", "lock computer", "lock screen", "lock desktop"]):
        pending_entry = consent_ledger.create_pending_entry(
            agent="SystemSubagent",
            action_type="SYSTEM_LOCK",
            target="Workstation Desktop",
            details={"command": "rundll32.exe user32.dll,LockWorkStation"},
            reasoning=(
                "User requested locking the workstation screen. "
                "This action interrupts current desktop interaction and is gated behind user consent."
            )
        )
        consent_pending = pending_entry.model_dump()
        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action="consent_gate:SYSTEM_LOCK",
            details=f"Action gated — PENDING_APPROVAL (ID: {pending_entry.id})",
            timestamp=timestamp,
            requires_consent=True
        ))
        output_summary = (
            f"⚠ ACTION GATED — Consent Required\n"
            f"Locking workstation desktop requires your approval.\n"
            f"Consent ID: {pending_entry.id}"
        )

    # --- SYSTEM METRICS (CPU / RAM / BATTERY) ---
    elif any(k in query_lower for k in ["metrics", "cpu", "ram", "battery", "hardware", "specs", "system info"]):
        res = get_system_metrics_tool.invoke({})
        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action="tool_call:get_system_metrics",
            details="Read live CPU, RAM, Disk, and Battery metrics",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = res.get("message", "System metrics retrieved.")

    # --- VOLUME ADJUSTMENT ---
    elif "volume" in query_lower or "sound" in query_lower or " आवाज" in query_lower or "звук" in query_lower:
        match = re.search(r'\b(\d{1,3})\b', query_lower)
        target_level = int(match.group(1)) if match else 50
        res = adjust_volume_tool.invoke({"level": target_level})

        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action="tool_call:adjust_volume",
            details=f"Set system volume to {target_level}%",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🔊 {res.get('message', f'System volume set to {target_level}%')}"

    # --- BRIGHTNESS ADJUSTMENT ---
    elif "brightness" in query_lower or "light" in query_lower:
        match = re.search(r'\b(\d{1,3})\b', query_lower)
        target_level = int(match.group(1)) if match else 75
        res = adjust_brightness_tool.invoke({"level": target_level})

        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action="tool_call:adjust_brightness",
            details=f"Set screen brightness to {target_level}%",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🔅 {res.get('message', f'Screen brightness set to {target_level}%')}"

    # --- PLAY MEDIA (YouTube / Spotify) ---
    elif any(k in query_lower for k in ["play", "youtube", "spotify", "song", "music", "gaana"]):
        platform = "spotify" if "spotify" in query_lower else "youtube"
        # Extract song/media search term
        term = (
            query_lower.replace("play", "")
            .replace("on youtube", "")
            .replace("on spotify", "")
            .replace("youtube", "")
            .replace("spotify", "")
            .replace("song", "")
            .replace("music", "")
            .strip()
        ) or "Lo-fi beats"

        res = play_media_tool.invoke({"query": term, "platform": platform})
        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action=f"tool_call:play_media [{platform}]",
            details=f"Opened {platform.capitalize()} search for '{term}'",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🎶 Playing '{term}' on {platform.capitalize()}.\nURL: {res.get('url', '')}"

    # --- LAUNCH APPLICATION ---
    elif any(k in query_lower for k in ["open", "launch", "start", "kholo", "खोलो"]):
        app_name = (
            query_lower.replace("open", "")
            .replace("launch", "")
            .replace("start", "")
            .replace("kholo", "")
            .replace("app", "")
            .strip()
        ) or "vscode"

        res = launch_app_tool.invoke({"app_name": app_name})
        logs.append(AgentLogEntry(
            agent="SystemSubagent",
            action="tool_call:launch_app",
            details=f"Launched '{app_name}'",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🚀 {res.get('message', f'Launched {app_name}')}"

    # Fallback
    else:
        res = adjust_volume_tool.invoke({"level": 50})
        output_summary = f"System Control executed: {res.get('message', 'Volume calibrated.')}"

    return {
        "current_agent": "SystemSubagent",
        "next_step": "Supervisor",
        "logs": logs,
        "consent_pending": consent_pending,
        "final_output": output_summary
    }
