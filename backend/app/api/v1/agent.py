from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.orchestrator import run_orchestrator
from app.services.email_service import email_service

router = APIRouter()


class AgentQueryRequest(BaseModel):
    query: str


class AgentQueryResponse(BaseModel):
    query: str
    final_output: str
    logs: List[Dict[str, Any]]
    email_context: List[Dict[str, Any]]
    agent_flow: List[str]


@router.post("/query", response_model=AgentQueryResponse)
def execute_agent_query(request: AgentQueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    
    try:
        result = run_orchestrator(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")


@router.get("/emails")
def list_inbox_emails():
    """Retrieve current mock email inbox data."""
    return {
        "emails": email_service.list_emails(unread_only=False),
        "drafts": email_service.get_drafts()
    }
