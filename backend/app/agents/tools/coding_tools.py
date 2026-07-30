import os
import subprocess
import tempfile
from typing import Dict, Any
from langchain_core.tools import tool


@tool
def write_and_execute_code_tool(script_name: str, code: str) -> Dict[str, Any]:
    """
    Write a local Python script and execute it in a sandbox process.
    Args:
        script_name: Name of python file (e.g. 'clean_temp.py' or 'fibonacci.py').
        code: Complete Python source code to write and execute.
    """
    try:
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, script_name)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)

        # Execute script in sandbox process with timeout
        proc = subprocess.run(
            ["python", file_path],
            capture_output=True,
            text=True,
            timeout=10
        )

        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()

        message = (
            f"🛠 **Autonomous Code Execution Summary:**\n"
            f"• Script File: `{script_name}`\n"
            f"• Exit Code: **{proc.returncode}**\n\n"
            f"**Output (stdout):**\n"
            f"```text\n{stdout or '(no stdout)'}\n```"
        )
        if stderr:
            message += f"\n\n**Stderr Warnings/Errors:**\n```text\n{stderr[:300]}\n```"

        return {
            "status": "success" if proc.returncode == 0 else "failed",
            "file_path": file_path,
            "exit_code": proc.returncode,
            "stdout": stdout,
            "stderr": stderr,
            "message": message
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to execute code: {str(e)}"}


@tool
def git_auto_commit_tool(message: str) -> Dict[str, Any]:
    """
    Stage, commit, and push repository changes to GitHub.
    Gated behind Consent Ledger before execution.
    Args:
        message: Git commit message.
    """
    return {
        "status": "staged",
        "commit_message": message,
        "action": "git_commit_push"
    }
