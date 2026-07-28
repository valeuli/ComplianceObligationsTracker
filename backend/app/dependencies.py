from __future__ import annotations

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.repositories import ObligationRepository
from app.services import ObligationService


def get_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


SessionDep = Annotated[Session, Depends(get_session)]


def get_repository(session: SessionDep) -> ObligationRepository:
    return ObligationRepository(session)


RepositoryDep = Annotated[ObligationRepository, Depends(get_repository)]


def get_service(session: SessionDep, repository: RepositoryDep) -> ObligationService:
    return ObligationService(session, repository)


ServiceDep = Annotated[ObligationService, Depends(get_service)]
