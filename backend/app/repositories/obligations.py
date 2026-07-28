from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.domain import Obligation, ObligationStatus, ObligationType, StatusChange
from app.models import AuditEntryModel, ObligationModel

from .errors import ConcurrencyConflictError, InvalidEditableFieldError

EDITABLE_FIELDS = {
    "type",
    "title",
    "description",
    "due_date",
    "owner",
    "requires_document",
    "document_name",
    "company_tax_id",
}


class ObligationRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, obligation: Obligation) -> Obligation:
        model = self._to_model(obligation)
        self._session.add(model)
        self._session.flush()
        return self._to_domain(model)

    def get_by_id(self, obligation_id: UUID) -> Obligation | None:
        model = self._session.get(ObligationModel, obligation_id)
        if model is None:
            return None
        return self._to_domain(model)

    def list_all(self) -> list[Obligation]:
        models = self._session.scalars(
            select(ObligationModel).order_by(
                ObligationModel.due_date,
                ObligationModel.id,
            )
        ).all()
        return [self._to_domain(model) for model in models]

    def update(
        self,
        obligation_id: UUID,
        *,
        expected_version: int,
        fields: Mapping[str, object],
    ) -> Obligation | None:
        self._validate_editable_fields(fields)
        values = {field_name: self._normalize_value(value) for field_name, value in fields.items()}
        values["version"] = ObligationModel.version + 1

        result = self._session.execute(
            update(ObligationModel)
            .where(
                ObligationModel.id == obligation_id,
                ObligationModel.version == expected_version,
            )
            .values(**values)
        )
        if result.rowcount == 0:
            raise ConcurrencyConflictError("Obligation update was rejected due to version mismatch.")

        self._session.flush()
        self._session.expire_all()
        return self.get_by_id(obligation_id)

    def delete(self, obligation_id: UUID) -> bool:
        model = self._session.get(ObligationModel, obligation_id)
        if model is None:
            return False

        self._session.delete(model)
        self._session.flush()
        return True

    def transition_status(
        self,
        obligation_id: UUID,
        *,
        expected_version: int,
        change: StatusChange,
    ) -> Obligation:
        result = self._session.execute(
            update(ObligationModel)
            .where(
                ObligationModel.id == obligation_id,
                ObligationModel.version == expected_version,
            )
            .values(
                status=change.new_status.value,
                version=ObligationModel.version + 1,
            )
        )
        if result.rowcount == 0:
            raise ConcurrencyConflictError("Obligation transition was rejected due to version mismatch.")

        self._session.add(
            AuditEntryModel(
                obligation_id=obligation_id,
                previous_status=change.previous_status.value,
                new_status=change.new_status.value,
                changed_at=change.changed_at,
            )
        )
        self._session.flush()
        self._session.expire_all()

        updated_obligation = self.get_by_id(obligation_id)
        if updated_obligation is None:
            raise ConcurrencyConflictError("Obligation transition could not be loaded after update.")
        return updated_obligation

    def get_audit_history(self, obligation_id: UUID) -> list[StatusChange]:
        entries = self._session.scalars(
            select(AuditEntryModel)
            .where(AuditEntryModel.obligation_id == obligation_id)
            .order_by(
                AuditEntryModel.changed_at,
                AuditEntryModel.id,
            )
        ).all()
        return [
            StatusChange(
                previous_status=ObligationStatus(entry.previous_status),
                new_status=ObligationStatus(entry.new_status),
                changed_at=self._normalize_changed_at(entry.changed_at),
            )
            for entry in entries
        ]

    def _validate_editable_fields(self, fields: Mapping[str, object]) -> None:
        invalid_fields = sorted(set(fields) - EDITABLE_FIELDS)
        if invalid_fields:
            raise InvalidEditableFieldError(
                f"Fields are not editable through update(): {', '.join(invalid_fields)}"
            )

    def _to_domain(self, model: ObligationModel) -> Obligation:
        return Obligation(
            id=model.id,
            type=ObligationType(model.type),
            title=model.title,
            description=model.description,
            status=ObligationStatus(model.status),
            due_date=model.due_date,
            owner=model.owner,
            requires_document=model.requires_document,
            document_name=model.document_name,
            company_tax_id=model.company_tax_id,
            version=model.version,
        )

    def _to_model(self, obligation: Obligation) -> ObligationModel:
        return ObligationModel(
            id=obligation.id,
            type=obligation.type.value,
            title=obligation.title,
            description=obligation.description,
            status=obligation.status.value,
            due_date=obligation.due_date,
            owner=obligation.owner,
            requires_document=obligation.requires_document,
            document_name=obligation.document_name,
            company_tax_id=obligation.company_tax_id,
            version=obligation.version,
        )

    def _normalize_value(self, value: object) -> object:
        if isinstance(value, Enum):
            return value.value
        return value

    def _normalize_changed_at(self, changed_at: datetime) -> datetime:
        if changed_at.tzinfo is None:
            return changed_at.replace(tzinfo=timezone.utc)
        return changed_at
