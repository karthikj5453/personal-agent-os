import pytest
from app.memory.vector_store import memory_engine
from app.agents.tools.coding_tools import write_and_execute_code_tool
from app.agents.coding_agent import run_coding_agent


def test_vector_memory_engine():
    """Verify vector memory store remember and recall for Boss."""
    memory_engine.remember("favorite_coffee", "Espresso with warm oat milk", "preference")
    recalled = memory_engine.recall("coffee")
    assert len(recalled) >= 1
    assert "Espresso" in recalled[0].content


def test_coding_tool_execution():
    """Verify writing and executing local python script in sandbox."""
    code = "print('Hello Boss from sandbox')"
    res = write_and_execute_code_tool.invoke({"script_name": "test_script.py", "code": code})
    assert res["status"] == "success"
    assert "Hello Boss" in res["stdout"]


def test_coding_subagent_git_gate():
    """Verify git commit query triggers Consent Ledger gate."""
    result = run_coding_agent({"messages": [{"role": "user", "content": "git commit and push to github"}]})
    assert result["consent_pending"] is not None
    assert result["consent_pending"]["action_type"] == "GIT_COMMIT_PUSH"
