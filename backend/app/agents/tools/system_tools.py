import os
import subprocess
import webbrowser
import psutil
from typing import Dict, Any
from langchain_core.tools import tool


@tool
def get_system_metrics_tool() -> Dict[str, Any]:
    """
    Read live desktop hardware metrics: CPU load %, RAM usage %, Disk usage %, and Battery.
    """
    try:
        cpu = psutil.cpu_percent(interval=0.2)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        battery = psutil.sensors_battery()

        battery_pct = battery.percent if battery else 100
        is_plugged = battery.power_plugged if battery else True

        message = (
            f"💻 **Desktop System Hardware Metrics:**\n"
            f"• CPU Load: **{cpu}%**\n"
            f"• RAM Usage: **{mem.percent}%** ({round(mem.used / (1024**3), 1)}GB / {round(mem.total / (1024**3), 1)}GB)\n"
            f"• Disk Usage: **{disk.percent}%** ({round(disk.free / (1024**3), 1)}GB Free)\n"
            f"• Battery: **{battery_pct}%** ({'Plugged In' if is_plugged else 'On Battery'})"
        )
        return {
            "status": "success",
            "cpu_pct": cpu,
            "ram_pct": mem.percent,
            "disk_pct": disk.percent,
            "battery_pct": battery_pct,
            "message": message
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to read system metrics: {str(e)}"}


@tool
def adjust_volume_tool(level: int) -> Dict[str, Any]:
    """
    Set system master audio volume percentage (0 - 100).
    Args:
        level: Target volume percentage between 0 and 100.
    """
    level = max(0, min(100, level))
    try:
        ps_cmd = (
            f"$obj = New-Object -ComObject WScript.Shell; "
            f"1..50 | ForEach-Object {{ $obj.SendKeys([char]174) }}; "
            f"1..{int(level / 2)} | ForEach-Object {{ $obj.SendKeys([char]175) }}"
        )
        subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, timeout=5)
        return {"status": "success", "message": f"System volume set to {level}%", "level": level}
    except Exception as e:
        return {"status": "error", "message": f"Failed to set volume: {str(e)}", "level": level}


@tool
def adjust_brightness_tool(level: int) -> Dict[str, Any]:
    """
    Set primary monitor screen brightness percentage (0 - 100).
    Args:
        level: Target brightness level between 0 and 100.
    """
    level = max(0, min(100, level))
    try:
        ps_cmd = f"(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {level})"
        subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, timeout=5)
        return {"status": "success", "message": f"Screen brightness set to {level}%", "level": level}
    except Exception as e:
        return {"status": "error", "message": f"Failed to adjust brightness: {str(e)}", "level": level}


@tool
def launch_app_tool(app_name: str) -> Dict[str, Any]:
    """
    Launch a local desktop application.
    Args:
        app_name: Application identifier (e.g. 'vscode', 'spotify', 'chrome', 'terminal', 'notepad', 'calculator').
    """
    app_clean = app_name.lower().strip()
    apps_map = {
        "vscode": "code",
        "code": "code",
        "chrome": "start chrome",
        "browser": "start chrome",
        "spotify": "start spotify",
        "terminal": "start wt",
        "cmd": "start cmd",
        "notepad": "notepad",
        "calculator": "calc",
        "calc": "calc"
    }

    cmd = apps_map.get(app_clean, app_clean)
    try:
        subprocess.Popen(cmd, shell=True)
        return {"status": "success", "message": f"Launched application '{app_name}'", "command": cmd}
    except Exception as e:
        return {"status": "error", "message": f"Failed to launch '{app_name}': {str(e)}"}


@tool
def play_media_tool(query: str, platform: str = "youtube") -> Dict[str, Any]:
    """
    Search and play media (music, video, song) on YouTube or Spotify.
    Args:
        query: Song or video search query (e.g. 'Lo-fi beats', 'A.R. Rahman hits').
        platform: Target media platform ('youtube' or 'spotify').
    """
    query_clean = query.strip()
    if platform.lower() == "spotify":
        url = f"https://open.spotify.com/search/{query_clean.replace(' ', '%20')}"
    else:
        url = f"https://www.youtube.com/results?search_query={query_clean.replace(' ', '+')}"

    try:
        webbrowser.open(url)
        return {
            "status": "success",
            "message": f"Opened {platform.capitalize()} search for '{query_clean}'",
            "url": url,
            "platform": platform
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to play media: {str(e)}"}


@tool
def lock_system_tool() -> Dict[str, Any]:
    """
    Lock the Windows workstation desktop.
    """
    try:
        subprocess.run("rundll32.exe user32.dll,LockWorkStation", shell=True)
        return {"status": "success", "message": "System workstation locked successfully."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to lock system: {str(e)}"}
