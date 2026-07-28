from datetime import date

import pytest

from app.domain import (
    InvalidStatusTransition,
    Obligation,
    ObligationStatus,
    ObligationType,
    RequiredDocumentMissing,
)


def make_obligation(**overrides: object) -> Obligation:
    data = {
        "id": 1,
        "type": ObligationType.ANNUAL_REPORT,
        "title": "Annual report",
        "description": "File annual report",
        "status": ObligationStatus.PENDING,
        "due_date": date(2026, 1, 10),
        "owner": "Acme LLC",
        "requires_document": False,
        "document_name": None,
        "company_tax_id": "123456789",
        "version": 0,
    }
    data.update(overrides)
    return Obligation(**data)  # type: ignore[arg-type]


def test_allowed_transition_increments_version() -> None:
    obligation = make_obligation()

    obligation.transition_to(ObligationStatus.IN_PROGRESS)

    assert obligation.status == ObligationStatus.IN_PROGRESS
    assert obligation.version == 1


def test_invalid_transition_raises() -> None:
    obligation = make_obligation(status=ObligationStatus.PENDING)

    with pytest.raises(InvalidStatusTransition):
        obligation.transition_to(ObligationStatus.SUBMITTED)


def test_required_document_blocks_submission() -> None:
    obligation = make_obligation(
        status=ObligationStatus.IN_PROGRESS,
        requires_document=True,
        document_name=None,
    )

    with pytest.raises(RequiredDocumentMissing):
        obligation.transition_to(ObligationStatus.SUBMITTED)


def test_overdue_is_derived_from_current_date() -> None:
    obligation = make_obligation(status=ObligationStatus.IN_PROGRESS, due_date=date(2026, 1, 1))

    assert obligation.is_overdue(date(2026, 1, 2)) is True
    assert obligation.is_overdue(date(2026, 1, 1)) is False


def test_overdue_is_false_for_submitted_or_done() -> None:
    submitted = make_obligation(status=ObligationStatus.SUBMITTED, due_date=date(2026, 1, 1))
    done = make_obligation(status=ObligationStatus.DONE, due_date=date(2026, 1, 1))

    assert submitted.is_overdue(date(2026, 1, 2)) is False
    assert done.is_overdue(date(2026, 1, 2)) is False


def test_masked_tax_id_keeps_last_four_digits() -> None:
    obligation = make_obligation(company_tax_id="123456789")

    assert obligation.masked_tax_id() == "••••6789"
