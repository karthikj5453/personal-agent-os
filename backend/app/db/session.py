import logging
from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

logger = logging.getLogger("nexus.db")

# Primary PostgreSQL URL or SQLite local fallback
postgres_url = settings.DATABASE_URL
sqlite_fallback_url = "sqlite:///./nexus_fallback.db"

try:
    engine = create_engine(
        postgres_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3} if "postgresql" in postgres_url else {}
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Connected to primary PostgreSQL database.")
except Exception as e:
    logger.warning(f"PostgreSQL unreachable ({e}). Using SQLite fallback.")
    engine = create_engine(sqlite_fallback_url, echo=False, connect_args={"check_same_thread": False})


def get_session() -> Generator[Session, None, None]:
    """Provide a database session context."""
    with Session(engine) as session:
        yield session
