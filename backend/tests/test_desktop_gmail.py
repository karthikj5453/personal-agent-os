import pytest
from app.agents.tools.system_tools import get_system_metrics_tool


def test_get_system_metrics_tool():
    """Verify live desktop hardware metrics tool (CPU, RAM, Disk, Battery)."""
    res = get_system_metrics_tool.invoke({})
    assert res["status"] == "success"
    assert "cpu_pct" in res
    assert "ram_pct" in res
    assert "disk_pct" in res
    assert "Desktop System Hardware Metrics" in res["message"]
