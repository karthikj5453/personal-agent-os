from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.services.consent_ledger import consent_ledger

router = APIRouter()


@router.get("/ledger")
def get_ledger():
    """Fetch all consent ledger entries (append-only, newest first)."""
    entries = consent_ledger.get_all()
    return {
        "total": len(entries),
        "pending": sum(1 for e in entries if e.status == "PENDING_APPROVAL"),
        "entries": [e.model_dump() for e in entries]
    }


@router.post("/approve/{entry_id}")
def approve_consent(entry_id: str):
    """Approve a pending consent entry and execute the gated action."""
    result = consent_ledger.approve(entry_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/reject/{entry_id}")
def reject_consent(entry_id: str):
    """Reject a pending consent entry. No action is executed."""
    result = consent_ledger.reject(entry_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
