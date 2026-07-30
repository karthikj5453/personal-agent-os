import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EmailMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender: str
    recipient: str
    subject: str
    body: str
    timestamp: str = Field(default_factory=lambda: (datetime.now() - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M"))
    is_read: bool = False
    priority: str = "medium"  # high, medium, low
    category: str = "work"    # work, personal, system
    is_draft: bool = False


class EmailService:
    def __init__(self):
        self._inbox: List[EmailMessage] = [
            EmailMessage(
                id="msg-101",
                sender="sarah.ops@techcorp.io",
                recipient="me@personalagent.os",
                subject="URGENT: Production API Rate Limit Spike in AP-South",
                body="Hey, we are seeing a 400% spike in 429 rate limit errors from the AP-South region. Need your sign-off on doubling the Redis quota before 5 PM.",
                timestamp=(datetime.now() - timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M"),
                is_read=False,
                priority="high",
                category="work"
            ),
            EmailMessage(
                id="msg-102",
                sender="alex.research@ai-labs.org",
                recipient="me@personalagent.os",
                subject="VaakEval Benchmark Results — Hindi Code-Switching ASR",
                body="Attached are the latest WER figures for Whisper Large v3 vs IndicASR on the 10-hour code-switched conversational corpus. Whisper got 24% WER while IndicASR hit 14% WER.",
                timestamp=(datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
                is_read=False,
                priority="medium",
                category="work"
            ),
            EmailMessage(
                id="msg-103",
                sender="newsletter@techcrunch.com",
                recipient="me@personalagent.os",
                subject="Daily Tech Digest: Agentic OS Architectures in 2026",
                body="Today's top stories: Autonomous agent frameworks move from single-prompt scripts to multi-agent supervisor loops with strict consent ledgers.",
                timestamp=(datetime.now() - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M"),
                is_read=True,
                priority="low",
                category="system"
            ),
            EmailMessage(
                id="msg-104",
                sender="rahul.k@startup.in",
                recipient="me@personalagent.os",
                subject="Rescheduling tomorrow's sync to 5 PM?",
                body="Kal ka meeting reschedule kar do to 5 baje. Let me know if that time works for you.",
                timestamp=(datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
                is_read=False,
                priority="high",
                category="personal"
            ),
        ]
        self._drafts: List[EmailMessage] = []

    def list_emails(self, unread_only: bool = False, limit: int = 10) -> List[Dict[str, Any]]:
        emails = [e for e in self._inbox if not unread_only or not e.is_read]
        return [e.model_dump() for e in emails[:limit]]

    def search_emails(self, query: str) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = [
            e for e in self._inbox
            if query_lower in e.subject.lower()
            or query_lower in e.body.lower()
            or query_lower in e.sender.lower()
        ]
        return [e.model_dump() for e in results]

    def get_email_by_id(self, email_id: str) -> Optional[Dict[str, Any]]:
        for e in self._inbox:
            if e.id == email_id:
                e.is_read = True
                return e.model_dump()
        return None

    def create_draft(self, recipient: str, subject: str, body: str) -> Dict[str, Any]:
        draft = EmailMessage(
            sender="me@personalagent.os",
            recipient=recipient,
            subject=subject,
            body=body,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            is_read=True,
            is_draft=True
        )
        self._drafts.append(draft)
        return draft.model_dump()

    def send_email(self, recipient: str, subject: str, body: str) -> Dict[str, Any]:
        sent_msg = EmailMessage(
            sender="me@personalagent.os",
            recipient=recipient,
            subject=subject,
            body=body,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            is_read=True,
            is_draft=False
        )
        self._inbox.insert(0, sent_msg)
        return {
            "status": "sent",
            "message_id": sent_msg.id,
            "recipient": recipient,
            "subject": subject,
            "timestamp": sent_msg.timestamp
        }

    def get_drafts(self) -> List[Dict[str, Any]]:
        return [d.model_dump() for d in self._drafts]


# Singleton instance for mock service
email_service = EmailService()
