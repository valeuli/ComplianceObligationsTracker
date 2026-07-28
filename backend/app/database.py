from __future__ import annotations

import os

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/compliance_obligations_tracker"


class Base(DeclarativeBase):
    pass


def get_database_url(database_url: str | None = None) -> str:
    if database_url:
        return database_url
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def create_engine_from_url(database_url: str | None = None) -> Engine:
    return create_engine(get_database_url(database_url), pool_pre_ping=True)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


engine = create_engine_from_url()
SessionLocal = create_session_factory(engine)
