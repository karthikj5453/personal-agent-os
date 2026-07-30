import logging
from datetime import datetime, timedelta
from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.db.models import EmailTable, ConsentEntryTable

logger = logging.getLogger("nexus.db.init")


def init_db():
    """Create all SQLModel database tables and seed initial data."""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables initialized successfully.")

        # Seed mock emails if empty
        with Session(engine) as session:
            existing = session.exec(select(EmailTable)).first()
            if not existing:
                mock_emails = [
                    EmailTable(
                        id="msg-101",
                        sender="sarah.ops@techcorp.io",
                        recipient="me@personalagent.os",
                        subject="URGENT: Production API Rate Limit Spike in AP-South",
                        body="Hey, we are seeing a 400% spike in 429 rate limit errors from AP-South region. Need your sign-off on doubling Redis quota.",
                        timestamp=(datetime.now() - timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M"),
                        is_read=False,
                        priority="high",
                        category="work"
                    ),
                    EmailTable(
                        id="msg-102",
                        sender="alex.research@ai-labs.org",
                        recipient="me@personalagent.os",
                        subject="VaakEval Benchmark Results — Hindi Code-Switching ASR",
                        body="Attached are latest WER figures for Whisper Large v3 vs IndicASR on the 10-hour code-switched conversational corpus. Whisper 24% vs IndicASR 14% WER.",
                        timestamp=(datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
                        is_read=False,
                        priority="medium",
                        category="work"
                    ),
                    EmailTable(
                        id="msg-104",
                        sender="rahul.k@startup.in",
                        recipient="me@personalagent.os",
                        subject="Rescheduling tomorrow's sync to 5 PM?",
                        body="Kal ka meeting reschedule kar do to 5 baje. Let me know if that time works.",
                        timestamp=(datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
                        is_read=False,
                        priority="high",
                        category="personal"
                    )
                ]
                for email in mock_emails:
                    session.add(email)
                session.commit()
                logger.info("Seeded initial email dataset into database.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
