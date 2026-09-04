"""
Database connection and session management.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

Base = declarative_base()

DATABASE_URL = settings.DATABASE_URL or "sqlite:///./creditin.db"
# Use check_same_thread=False for SQLite; fast fail timeout for PostgreSQL
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {"connect_timeout": 3}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def scoped_query(session: Session, model, user_id: str):
    """
    CRITICAL SECURITY HELPER:
    There is no row-level security in this project, so this helper is the ONLY
    sanctioned way to read user data. All database queries must be scoped to user_id.
    """
    if hasattr(model, "user_id"):
        return session.query(model).filter(model.user_id == user_id)
    elif hasattr(model, "id"):
        return session.query(model).filter(model.id == user_id)
    return session.query(model)
