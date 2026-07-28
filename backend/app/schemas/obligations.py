from __future__ import annotations

from collections.abc import Sequence
from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain import Obligation, ObligationStatus, ObligationType, StatusChange, TransitionOption


class _BaseSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        populate_by_name=True,
    )


class CreateObligationRequest(_BaseSchema):
    type: ObligationType
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(max_length=2000)
    due_date: date
    owner: str = Field(min_length=1, max_length=120)
    requires_document: bool
    document_name: str | None = Field(default=None, max_length=255)
    company_tax_id: str = Field(min_length=4, max_length=80)


class UpdateObligationRequest(_BaseSchema):
    expected_version: int = Field(ge=0)
    type: ObligationType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    due_date: date | None = None
    owner: str | None = Field(default=None, min_length=1, max_length=120)
    requires_document: bool | None = None
    document_name: str | None = Field(default=None, max_length=255)
    company_tax_id: str | None = Field(default=None, min_length=4, max_length=80)

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> Self:
        if all(
            value is None
            for value in (
                self.type,
                self.title,
                self.description,
                self.due_date,
                self.owner,
                self.requires_document,
                self.document_name,
                self.company_tax_id,
            )
        ):
            raise ValueError("At least one editable field must be provided.")
        return self


class TransitionObligationRequest(_BaseSchema):
    target_status: ObligationStatus
    expected_version: int = Field(ge=0)


class TransitionOptionResponse(_BaseSchema):
    status: ObligationStatus
    enabled: bool
    reason: str | None = None

    @classmethod
    def from_domain(cls, transition_option: TransitionOption) -> Self:
        return cls(
            status=transition_option.status,
            enabled=transition_option.enabled,
            reason=transition_option.reason,
        )


class AuditEntryResponse(_BaseSchema):
    previous_status: ObligationStatus
    new_status: ObligationStatus
    changed_at: datetime

    @classmethod
    def from_domain(cls, change: StatusChange) -> Self:
        return cls(
            previous_status=change.previous_status,
            new_status=change.new_status,
            changed_at=change.changed_at,
        )


class ObligationBaseResponse(_BaseSchema):
    id: UUID
    type: ObligationType
    title: str
    description: str
    status: ObligationStatus
    due_date: date
    owner: str
    requires_document: bool
    document_name: str | None
    company_tax_id_masked: str
    version: int
    overdue: bool
    transition_options: list[TransitionOptionResponse] = Field(default_factory=list)

    @classmethod
    def _base_kwargs(cls, obligation: Obligation, *, today: date) -> dict[str, object]:
        return {
            "id": obligation.id,
            "type": obligation.type,
            "title": obligation.title,
            "description": obligation.description,
            "status": obligation.status,
            "due_date": obligation.due_date,
            "owner": obligation.owner,
            "requires_document": obligation.requires_document,
            "document_name": obligation.document_name,
            "company_tax_id_masked": obligation.masked_tax_id(),
            "version": obligation.version,
            "overdue": obligation.is_overdue(today),
            "transition_options": [
                TransitionOptionResponse.from_domain(option)
                for option in obligation.transition_options()
            ],
        }


class ObligationSummaryResponse(ObligationBaseResponse):
    @classmethod
    def from_domain(cls, obligation: Obligation, *, today: date | None = None) -> Self:
        effective_today = today or date.today()
        return cls(**cls._base_kwargs(obligation, today=effective_today))


class ObligationResponse(ObligationBaseResponse):
    audit_history: list[AuditEntryResponse] = Field(default_factory=list)

    @classmethod
    def from_domain(
        cls,
        obligation: Obligation,
        *,
        audit_history: Sequence[StatusChange],
        today: date | None = None,
    ) -> Self:
        effective_today = today or date.today()
        return cls(
            **cls._base_kwargs(obligation, today=effective_today),
            audit_history=[AuditEntryResponse.from_domain(change) for change in audit_history],
        )


class ErrorResponse(_BaseSchema):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
