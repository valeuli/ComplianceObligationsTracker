from datetime import date
from typing import Optional
from uuid import UUID

import pytest

from app.domain import (
    InvalidStatusTransition,
    Obligation,
    ObligationStatus,
    ObligationType,
    RequiredDocumentMissing,
)

FIXED_OBLIGATION_ID = UUID("123e4567-e89b-12d3-a456-426614174000")


def make_obligation(
    *,
    id: UUID = FIXED_OBLIGATION_ID,
    type: ObligationType = ObligationType.ANNUAL_REPORT,
    title: str = "Annual report",
    description: str = "File annual report",
    status: ObligationStatus = ObligationStatus.PENDING,
    due_date: date = date(2026, 1, 10),
    owner: str = "Acme LLC",
    requires_document: bool = False,
    document_name: Optional[str] = None,
    company_tax_id: str = "123456789",
    version: int = 0,
) -> Obligation:
    return Obligation(
        id=id,
        type=type,
        title=title,
        description=description,
        status=status,
        due_date=due_date,
        owner=owner,
        requires_document=requires_document,
        document_name=document_name,
        company_tax_id=company_tax_id,
        version=version,
    )


@pytest.mark.parametrize(
    ("start_status", "target_status"),
    [
        (ObligationStatus.PENDING, ObligationStatus.IN_PROGRESS),
        (ObligationStatus.IN_PROGRESS, ObligationStatus.PENDING),
        (ObligationStatus.IN_PROGRESS, ObligationStatus.SUBMITTED),
        (ObligationStatus.SUBMITTED, ObligationStatus.DONE),
        (ObligationStatus.SUBMITTED, ObligationStatus.IN_PROGRESS),
        (ObligationStatus.DONE, ObligationStatus.IN_PROGRESS),
    ],
)
def test_allowed_transitions(
    start_status: ObligationStatus, target_status: ObligationStatus
) -> None:
    obligation = make_obligation(status=start_status)

    obligation.transition_to(target_status)

    assert obligation.status == target_status
    assert obligation.version == 1


@pytest.mark.parametrize(
    ("start_status", "target_status"),
    [
        (ObligationStatus.PENDING, ObligationStatus.SUBMITTED),
        (ObligationStatus.PENDING, ObligationStatus.DONE),
        (ObligationStatus.DONE, ObligationStatus.SUBMITTED),
    ],
)
def test_invalid_transitions_do_not_mutate_state(
    start_status: ObligationStatus, target_status: ObligationStatus
) -> None:
    obligation = make_obligation(status=start_status)

    with pytest.raises(InvalidStatusTransition):
        obligation.transition_to(target_status)

    assert obligation.status == start_status
    assert obligation.version == 0


def test_required_document_blocks_submission_when_missing() -> None:
    obligation = make_obligation(
        status=ObligationStatus.IN_PROGRESS,
        requires_document=True,
        document_name=None,
    )

    with pytest.raises(RequiredDocumentMissing):
        obligation.transition_to(ObligationStatus.SUBMITTED)

    assert obligation.status == ObligationStatus.IN_PROGRESS
    assert obligation.version == 0


@pytest.mark.parametrize(
    ("requires_document", "document_name"),
    [
        (True, "return.pdf"),
        (False, None),
    ],
)
def test_submission_allowed_when_document_rule_is_satisfied(
    requires_document: bool, document_name: Optional[str]
) -> None:
    obligation = make_obligation(
        status=ObligationStatus.IN_PROGRESS,
        requires_document=requires_document,
        document_name=document_name,
    )

    obligation.transition_to(ObligationStatus.SUBMITTED)

    assert obligation.status == ObligationStatus.SUBMITTED
    assert obligation.version == 1


@pytest.mark.parametrize(
    ("status", "due_date", "current_date", "expected"),
    [
        (ObligationStatus.PENDING, date(2026, 1, 1), date(2026, 1, 2), True),
        (ObligationStatus.IN_PROGRESS, date(2026, 1, 1), date(2026, 1, 2), True),
        (ObligationStatus.SUBMITTED, date(2026, 1, 1), date(2026, 1, 2), False),
        (ObligationStatus.DONE, date(2026, 1, 1), date(2026, 1, 2), False),
        (ObligationStatus.PENDING, date(2026, 1, 10), date(2026, 1, 10), False),
        (ObligationStatus.PENDING, date(2026, 1, 11), date(2026, 1, 10), False),
    ],
)
def test_overdue_is_derived_from_current_date(
    status: ObligationStatus,
    due_date: date,
    current_date: date,
    expected: bool,
) -> None:
    obligation = make_obligation(status=status, due_date=due_date)

    assert obligation.is_overdue(current_date) is expected


def test_masked_tax_id_keeps_only_last_four_digits() -> None:
    obligation = make_obligation(company_tax_id="123456789")
    masked_tax_id = obligation.masked_tax_id()

    assert masked_tax_id == "••••6789"
    assert "123456789" not in masked_tax_id


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (
            ObligationStatus.PENDING,
            {ObligationStatus.IN_PROGRESS},
        ),
        (
            ObligationStatus.IN_PROGRESS,
            {ObligationStatus.PENDING, ObligationStatus.SUBMITTED},
        ),
        (
            ObligationStatus.SUBMITTED,
            {ObligationStatus.IN_PROGRESS, ObligationStatus.DONE},
        ),
        (
            ObligationStatus.DONE,
            {ObligationStatus.IN_PROGRESS},
        ),
    ],
)
def test_available_transitions(status: ObligationStatus, expected: set[ObligationStatus]) -> None:
    obligation = make_obligation(status=status)

    assert obligation.available_transitions() == expected
