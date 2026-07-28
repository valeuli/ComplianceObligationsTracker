from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from uuid import UUID

from .errors import InvalidStatusTransition, RequiredDocumentMissing


class ObligationType(str, Enum):
    ANNUAL_REPORT = "annual_report"
    FRANCHISE_TAX = "franchise_tax"
    BOI_REPORT = "boi_report"
    REGISTERED_AGENT_RENEWAL = "registered_agent_renewal"


class ObligationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    DONE = "done"


ALLOWED_STATUS_TRANSITIONS: dict[ObligationStatus, set[ObligationStatus]] = {
    ObligationStatus.PENDING: {ObligationStatus.IN_PROGRESS},
    ObligationStatus.IN_PROGRESS: {ObligationStatus.SUBMITTED, ObligationStatus.PENDING},
    ObligationStatus.SUBMITTED: {ObligationStatus.DONE, ObligationStatus.IN_PROGRESS},
    ObligationStatus.DONE: {ObligationStatus.IN_PROGRESS},
}


@dataclass(frozen=True)
class StatusChange:
    previous_status: ObligationStatus
    new_status: ObligationStatus
    changed_at: datetime


@dataclass(frozen=True)
class TransitionOption:
    status: ObligationStatus
    enabled: bool
    reason: str | None = None


@dataclass
class Obligation:
    id: UUID
    type: ObligationType
    title: str
    description: str
    status: ObligationStatus
    due_date: date
    owner: str
    requires_document: bool
    document_name: str | None
    company_tax_id: str
    version: int

    def available_transitions(self) -> set[ObligationStatus]:
        return set(ALLOWED_STATUS_TRANSITIONS[self.status])

    def transition_options(self) -> list[TransitionOption]:
        allowed_statuses = ALLOWED_STATUS_TRANSITIONS[self.status]
        return [
            self._transition_option(target_status)
            for target_status in ObligationStatus
            if target_status in allowed_statuses
        ]

    def transition_to(self, new_status: ObligationStatus, *, changed_at: datetime) -> StatusChange:
        transition_option = self._transition_option(new_status)
        if not transition_option.enabled:
            if transition_option.reason == "document_required":
                raise RequiredDocumentMissing("A document is required before submitting this obligation.")
            raise InvalidStatusTransition(
                f"Transition from {self.status.value} to {new_status.value} is not allowed."
            )

        previous_status = self.status
        self.status = new_status
        self.version += 1
        return StatusChange(
            previous_status=previous_status,
            new_status=new_status,
            changed_at=changed_at,
        )

    def _transition_option(self, target_status: ObligationStatus) -> TransitionOption:
        if target_status not in ALLOWED_STATUS_TRANSITIONS[self.status]:
            return TransitionOption(status=target_status, enabled=False, reason="invalid_transition")

        if target_status == ObligationStatus.SUBMITTED and self.requires_document and not self.document_name:
            return TransitionOption(status=target_status, enabled=False, reason="document_required")

        return TransitionOption(status=target_status, enabled=True)

    def is_overdue(self, current_date: date) -> bool:
        return current_date > self.due_date and self.status not in {
            ObligationStatus.SUBMITTED,
            ObligationStatus.DONE,
        }

    def masked_tax_id(self) -> str:
        suffix = self.company_tax_id[-4:] if len(self.company_tax_id) >= 4 else self.company_tax_id
        return f"••••{suffix}"
