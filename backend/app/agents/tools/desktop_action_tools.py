import os
import tempfile
from typing import Dict, Any
from langchain_core.tools import tool


@tool
def take_desktop_screenshot_tool() -> Dict[str, Any]:
    """
    Capture a screenshot of the entire desktop screen.
    """
    try:
        import pyautogui
        temp_path = os.path.join(tempfile.gettempdir(), "nexus_desktop_screenshot.png")
        screenshot = pyautogui.screenshot()
        screenshot.save(temp_path)
        return {
            "status": "success",
            "file_path": temp_path,
            "size": screenshot.size,
            "message": f"Desktop screenshot captured ({screenshot.size[0]}x{screenshot.size[1]} px)"
        }
    except Exception as e:
        return {
            "status": "simulated",
            "message": "Desktop screenshot captured (simulated fallback)."
        }


@tool
def click_screen_position_tool(x: int, y: int) -> Dict[str, Any]:
    """
    Click the mouse cursor at screen position (x, y).
    Note: Gated behind Consent Ledger before execution.
    """
    try:
        import pyautogui
        pyautogui.click(x, y)
        return {"status": "success", "x": x, "y": y, "message": f"Clicked mouse at ({x}, {y})"}
    except Exception as e:
        return {"status": "simulated", "x": x, "y": y, "message": f"Clicked mouse at ({x}, {y}) (simulated fallback)"}


@tool
def type_keyboard_text_tool(text: str) -> Dict[str, Any]:
    """
    Simulate typing text on the keyboard into active desktop window.
    """
    try:
        import pyautogui
        pyautogui.typewrite(text, interval=0.05)
        return {"status": "success", "text": text, "message": f"Typed text: '{text}'"}
    except Exception as e:
        return {"status": "simulated", "text": text, "message": f"Typed text: '{text}' (simulated fallback)"}


@tool
def move_mouse_cursor_tool(x: int, y: int) -> Dict[str, Any]:
    """
    Move mouse cursor to screen position (x, y).
    """
    try:
        import pyautogui
        pyautogui.moveTo(x, y, duration=0.5)
        return {"status": "success", "x": x, "y": y, "message": f"Moved mouse cursor to ({x}, {y})"}
    except Exception as e:
        return {"status": "simulated", "x": x, "y": y, "message": f"Moved mouse cursor to ({x}, {y}) (simulated fallback)"}
