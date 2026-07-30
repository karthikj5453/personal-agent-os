"""
Consent Ledger Service — Pillar 3: Accountable Autonomy

Implements an append-only audit store for all irreversible agent actions.
Every write/destructive operation must be:
  1. Staged as PENDING_APPROVAL with full AI reasoning exposed to user.
  2. Explicitly approved or rejected by the user.
  3. Permanently logged — records cannot be deleted.

Status lifecycle: PENDING_APPROVAL → APPROVED | REJECTED
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.services.email_service import email_service


class ConsentEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    agent: str
    action_type: str          # SEND_EMAIL, CALENDAR_DELETE, FILE_WRITE, etc.
    target: str               # Recipient, file path, event ID, etc.
    details: Dict[str, Any]   # Full action payload
    reasoning: str            # AI reasoning for why this action is needed
    status: str = "PENDING_APPROVAL"   # PENDING_APPROVAL | APPROVED | REJECTED
    resolved_at: Optional[str] = None
    resolved_by: str = "USER"


class ConsentLedgerService:
    def __init__(self):
        # In-memory store (will be replaced by PostgreSQL in production)
        self._entries: List[ConsentEntry] = []

    def create_pending_entry(
        self,
        agent: str,
        action_type: str,
        target: str,
        details: Dict[str, Any],
        reasoning: str
    ) -> ConsentEntry:
        """Stage an irreversible action for user consent."""
        entry = ConsentEntry(
            agent=agent,
            action_type=action_type,
            target=target,
            details=details,
            reasoning=reasoning,
            status="PENDING_APPROVAL"
        )
        self._entries.append(entry)
        return entry

    def get_all(self) -> List[ConsentEntry]:
        """Return all ledger entries (append-only — never deleted)."""
        return list(reversed(self._entries))  # newest first

    def get_pending(self) -> List[ConsentEntry]:
        """Return only pending entries awaiting approval."""
        return [e for e in self._entries if e.status == "PENDING_APPROVAL"]

    def get_by_id(self, entry_id: str) -> Optional[ConsentEntry]:
        for entry in self._entries:
            if entry.id == entry_id:
                return entry
        return None

    def approve(self, entry_id: str) -> Dict[str, Any]:
        """
        Approve a pending consent entry and execute the gated action.
        Returns the execution result.
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return {"error": f"Consent entry {entry_id} not found"}
        if entry.status != "PENDING_APPROVAL":
            return {"error": f"Entry {entry_id} is already {entry.status}"}

        # Execute the gated action
        result = self._execute_action(entry)

        # Update ledger (never delete — mark as resolved)
        entry.status = "APPROVED"
        entry.resolved_at = datetime.now().isoformat()

        return {
            "consent_id": entry_id,
            "status": "APPROVED",
            "execution_result": result,
            "resolved_at": entry.resolved_at
        }

    def reject(self, entry_id: str) -> Dict[str, Any]:
        """Reject a pending consent entry. Action is not executed."""
        entry = self.get_by_id(entry_id)
        if not entry:
            return {"error": f"Consent entry {entry_id} not found"}
        if entry.status != "PENDING_APPROVAL":
            return {"error": f"Entry {entry_id} is already {entry.status}"}

        entry.status = "REJECTED"
        entry.resolved_at = datetime.now().isoformat()

        return {
            "consent_id": entry_id,
            "status": "REJECTED",
            "resolved_at": entry.resolved_at
        }

    def _execute_action(self, entry: ConsentEntry) -> Dict[str, Any]:
        """
        Dispatch to the appropriate service based on action_type.
        Extend this as more agent capabilities are added.
        """
        if entry.action_type == "SEND_EMAIL":
            details = entry.details
            return email_service.send_email(
                recipient=details.get("recipient", ""),
                subject=details.get("subject", ""),
                body=details.get("body", "")
            )

        return {"status": "executed", "action": entry.action_type}


# Singleton instance
consent_ledger = ConsentLedgerService()
