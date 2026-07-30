import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class ConsentEntryTable(SQLModel, table=True):
    __tablename__ = "consent_ledger"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    agent: str = Field(index=True)
    action_type: str = Field(index=True)
    target: str
    details_json: str = Field(default="{}")
    reasoning: str
    status: str = Field(default="PENDING_APPROVAL", index=True)
    resolved_at: Optional[str] = None
    resolved_by: str = Field(default="USER")


class EmailTable(SQLModel, table=True):
    __tablename__ = "emails"

    id: str = Field(default_factory=lambda: f"msg-{str(uuid.uuid4())[:8]}", primary_key=True)
    sender: str
    recipient: str
    subject: str
    body: str
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    is_read: bool = Field(default=False)
    priority: str = Field(default="medium")
    category: str = Field(default="work")
    is_draft: bool = Field(default=False)
