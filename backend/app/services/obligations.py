from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.domain import Obligation, ObligationStatus, ObligationType, StatusChange
from app.repositories import ConcurrencyConflictError, ObligationRepository


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ObligationNotFoundError(Exception):
    """Raised when an obligation does not exist."""


@dataclass(frozen=True)
class CreateObligationData:
    type: ObligationType
    title: str
    description: str
    due_date: date
    owner: str
    requires_document: bool
    document_name: str | None
    company_tax_id: str


class ObligationService:
    def __init__(
        self,
        session: Session,
        repository: ObligationRepository,
        *,
        clock: Callable[[], datetime] = utc_now,
        id_factory: Callable[[], UUID] = uuid4,
    ) -> None:
        self._session = session
        self._repository = repository
        self._clock = clock
        self._id_factory = id_factory

    def create(self, data: CreateObligationData) -> Obligation:
        obligation = Obligation(
            id=self._id_factory(),
            type=data.type,
            title=data.title,
            description=data.description,
            status=ObligationStatus.PENDING,
            due_date=data.due_date,
            owner=data.owner,
            requires_document=data.requires_document,
            document_name=data.document_name,
            company_tax_id=data.company_tax_id,
            version=0,
        )

        try:
            created = self._repository.create(obligation)
            self._session.commit()
            return created
        except Exception:
            self._session.rollback()
            raise

    def get_by_id(self, obligation_id: UUID) -> Obligation:
        obligation = self._repository.get_by_id(obligation_id)
        if obligation is None:
            raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")
        return obligation

    def list_all(self) -> list[Obligation]:
        return self._repository.list_all()

    def update(
        self,
        obligation_id: UUID,
        *,
        expected_version: int,
        fields: Mapping[str, object],
    ) -> Obligation:
        try:
            updated = self._repository.update(
                obligation_id,
                expected_version=expected_version,
                fields=fields,
            )
            if updated is None:
                raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")
            self._session.commit()
            return updated
        except Exception:
            self._session.rollback()
            raise

    def delete(self, obligation_id: UUID) -> None:
        try:
            existing = self._repository.get_by_id(obligation_id)
            if existing is None:
                raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")
            deleted = self._repository.delete(obligation_id)
            if not deleted:
                raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise

    def change_status(
        self,
        obligation_id: UUID,
        *,
        target_status: ObligationStatus,
        expected_version: int,
    ) -> Obligation:
        try:
            obligation = self._repository.get_by_id(obligation_id)
            if obligation is None:
                raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")

            if obligation.version != expected_version:
                raise ConcurrencyConflictError("Obligation version is stale.")

            change = obligation.transition_to(target_status, changed_at=self._clock())
            updated = self._repository.transition_status(
                obligation_id,
                expected_version=expected_version,
                change=change,
            )
            self._session.commit()
            return updated
        except Exception:
            self._session.rollback()
            raise

    def get_audit_history(self, obligation_id: UUID) -> list[StatusChange]:
        obligation = self._repository.get_by_id(obligation_id)
        if obligation is None:
            raise ObligationNotFoundError(f"Obligation {obligation_id} was not found.")
        return self._repository.get_audit_history(obligation_id)
