from datetime import datetime
from typing import Dict, Any
from app.agents.state import AgentState, AgentLogEntry
from app.agents.tools.coding_tools import write_and_execute_code_tool, git_auto_commit_tool
from app.services.consent_ledger import consent_ledger


def run_coding_agent(state: AgentState) -> Dict[str, Any]:
    """Coding Subagent Node: Executes autonomous script generation, execution, and Git commits."""
    messages = state.get("messages", [])
    user_query = messages[-1]["content"] if messages else ""
    query_lower = user_query.lower()
    timestamp = datetime.now().strftime("%H:%M:%S")

    logs = [AgentLogEntry(
        agent="CodingSubagent",
        action="activated",
        details=f"Processing coding request for Boss: '{user_query}'",
        timestamp=timestamp,
        requires_consent=False
    )]

    consent_pending = None

    if any(k in query_lower for k in ["git commit", "push to github", "git push"]):
        # Gate Git commit/push behind Consent Ledger
        pending_entry = consent_ledger.create_pending_entry(
            agent="CodingSubagent",
            action_type="GIT_COMMIT_PUSH",
            target="Git Repository (main)",
            details={"commit_message": f"feat: automated update requested by Boss"},
            reasoning="User requested git commit and push to remote GitHub repository."
        )
        consent_pending = pending_entry.model_dump()
        logs.append(AgentLogEntry(
            agent="CodingSubagent",
            action="consent_gate:GIT_COMMIT_PUSH",
            details=f"Action gated — PENDING_APPROVAL (ID: {pending_entry.id})",
            timestamp=timestamp,
            requires_consent=True
        ))
        output_summary = (
            f"⚠ ACTION GATED — Consent Required\n"
            f"Boss, staging and pushing git commit requires your approval.\n"
            f"Consent ID: {pending_entry.id}"
        )
    else:
        # Generate & execute sample code script
        script_name = "fibonacci_calc.py" if "fibonacci" in query_lower else "nexus_script.py"
        sample_code = (
            "def fib(n):\n"
            "    a, b = 0, 1\n"
            "    for _ in range(n):\n"
            "        a, b = b, a + b\n"
            "    return a\n\n"
            "print('Boss, Fibonacci calculation result:', [fib(i) for i in range(10)])\n"
        )
        res = write_and_execute_code_tool.invoke({"script_name": script_name, "code": sample_code})
        logs.append(AgentLogEntry(
            agent="CodingSubagent",
            action="tool_call:write_and_execute_code",
            details=f"Executed script {script_name} with exit code {res.get('exit_code', 0)}",
            timestamp=timestamp,
            requires_consent=False
        ))
        output_summary = f"Boss, {res.get('message', 'Code execution completed.')}"

    return {
        "current_agent": "CodingSubagent",
        "next_step": "Supervisor",
        "logs": logs,
        "consent_pending": consent_pending,
        "final_output": output_summary
    }
