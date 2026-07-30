import re
from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.desktop_action_tools import (
    take_desktop_screenshot_tool,
    click_screen_position_tool,
    type_keyboard_text_tool,
    move_mouse_cursor_tool,
)
from app.services.consent_ledger import consent_ledger


def run_desktop_agent(state: AgentState) -> Dict[str, Any]:
    """
    Desktop Action & Screen Vision Subagent Node:
    Handles desktop screenshots, mouse movement, typing, and screen clicks.
    Screen clicks and UI actions are gated behind Consent Ledger (Pillar 3).
    """
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = [AgentLogEntry(
        agent="DesktopAgent",
        action="activated",
        details=f"Processing desktop action request for Boss: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    )]

    consent_pending = None

    # --- CLICK SCREEN POSITION → Consent Gate ---
    if "click" in query_lower:
        match = re.findall(r'\b(\d{1,4})\b', query_lower)
        x = int(match[0]) if len(match) > 0 else 500
        y = int(match[1]) if len(match) > 1 else 500

        pending_entry = consent_ledger.create_pending_entry(
            agent="DesktopAgent",
            action_type="DESKTOP_CLICK",
            target=f"Screen Coordinates ({x}, {y})",
            details={"x": x, "y": y},
            reasoning="User requested clicking mouse cursor at screen position."
        )
        consent_pending = pending_entry.model_dump()
        logs.append(AgentLogEntry(
            agent="DesktopAgent",
            action="consent_gate:DESKTOP_CLICK",
            details=f"Action gated — PENDING_APPROVAL (ID: {pending_entry.id})",
            timestamp=timestamp,
            requires_consent=True
        ))
        output_summary = (
            f"⚠ ACTION GATED — Consent Required\n"
            f"Boss, clicking screen position ({x}, {y}) requires your approval.\n"
            f"Consent ID: {pending_entry.id}"
        )

    # --- SCREENSHOT ---
    elif "screenshot" in query_lower or "screen" in query_lower:
        res = take_desktop_screenshot_tool.invoke({})
        logs.append(AgentLogEntry(
            agent="DesktopAgent",
            action="tool_call:take_desktop_screenshot",
            details="Captured desktop screen image",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🖥 {res.get('message', 'Desktop screenshot captured.')}"

    # --- MOVE MOUSE ---
    elif "move mouse" in query_lower or "mouse" in query_lower:
        match = re.findall(r'\b(\d{1,4})\b', query_lower)
        x = int(match[0]) if len(match) > 0 else 400
        y = int(match[1]) if len(match) > 1 else 400
        res = move_mouse_cursor_tool.invoke({"x": x, "y": y})

        logs.append(AgentLogEntry(
            agent="DesktopAgent",
            action="tool_call:move_mouse_cursor",
            details=f"Moved mouse to ({x}, {y})",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"🖱 {res.get('message', 'Mouse cursor moved.')}"

    # --- TYPE KEYBOARD TEXT ---
    elif "type" in query_lower:
        text_to_type = query_lower.replace("type", "").strip() or "Hello Boss"
        res = type_keyboard_text_tool.invoke({"text": text_to_type})

        logs.append(AgentLogEntry(
            agent="DesktopAgent",
            action="tool_call:type_keyboard_text",
            details=f"Typed text: '{text_to_type}'",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"⌨ {res.get('message', 'Text typed into desktop window.')}"

    else:
        res = take_desktop_screenshot_tool.invoke({})
        output_summary = f"Desktop Subagent executed: {res.get('message', 'Screen analyzed.')}"

    return {
        "current_agent": "DesktopAgent",
        "next_step": "Supervisor",
        "logs": logs,
        "consent_pending": consent_pending,
        "final_output": output_summary
    }
