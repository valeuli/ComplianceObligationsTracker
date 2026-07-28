from __future__ import annotations

from dataclasses import dataclass
from datetime import date
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

    def transition_to(self, new_status: ObligationStatus) -> None:
        allowed_statuses = self.available_transitions()
        if new_status not in allowed_statuses:
            raise InvalidStatusTransition(
                f"Transition from {self.status.value} to {new_status.value} is not allowed."
            )

        if new_status == ObligationStatus.SUBMITTED and self.requires_document and not self.document_name:
            raise RequiredDocumentMissing("A document is required before submitting this obligation.")

        self.status = new_status
        self.version += 1

    def is_overdue(self, current_date: date) -> bool:
        return current_date > self.due_date and self.status not in {
            ObligationStatus.SUBMITTED,
            ObligationStatus.DONE,
        }

    def masked_tax_id(self) -> str:
        suffix = self.company_tax_id[-4:] if len(self.company_tax_id) >= 4 else self.company_tax_id
        return f"••••{suffix}"
