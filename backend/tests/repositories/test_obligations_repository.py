import os
from datetime import date, datetime, timezone
from uuid import UUID

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest

from app.database import Base, create_engine_from_url, create_session_factory
from app.domain import Obligation, ObligationStatus, ObligationType
from app.repositories import ConcurrencyConflictError, InvalidEditableFieldError, ObligationRepository

import app.models  # noqa: F401  # register SQLAlchemy models

FIXED_CHANGED_AT = datetime(2026, 1, 15, 12, 30, tzinfo=timezone.utc)
FIRST_ID = UUID("123e4567-e89b-12d3-a456-426614174000")
SECOND_ID = UUID("123e4567-e89b-12d3-a456-426614174001")


def make_obligation(
    *,
    id: UUID = FIRST_ID,
    type: ObligationType = ObligationType.ANNUAL_REPORT,
    title: str = "Annual report",
    description: str = "File annual report",
    status: ObligationStatus = ObligationStatus.PENDING,
    due_date: date = date(2026, 1, 10),
    owner: str = "Acme LLC",
    requires_document: bool = False,
    document_name: str | None = None,
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


@pytest.fixture()
def session(tmp_path) -> object:
    database_url = f"sqlite+pysqlite:///{tmp_path / 'repository.db'}"
    engine = create_engine_from_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_create_get_list_and_delete(session) -> None:
    repository = ObligationRepository(session)
    first = make_obligation(id=FIRST_ID, due_date=date(2026, 1, 5), title="First")
    second = make_obligation(id=SECOND_ID, due_date=date(2026, 1, 10), title="Second")

    created_first = repository.create(first)
    repository.create(second)

    assert created_first == first
    assert repository.get_by_id(FIRST_ID) == first
    assert [obligation.id for obligation in repository.list_all()] == [FIRST_ID, SECOND_ID]
    assert repository.delete(FIRST_ID) is True
    assert repository.get_by_id(FIRST_ID) is None
    assert repository.delete(FIRST_ID) is False


def test_update_with_expected_version_and_immutable_fields(session) -> None:
    repository = ObligationRepository(session)
    repository.create(make_obligation())

    updated = repository.update(
        FIRST_ID,
        expected_version=0,
        fields={
            "title": "Updated title",
            "requires_document": True,
            "document_name": "supporting-doc.pdf",
        },
    )

    assert updated is not None
    assert updated.title == "Updated title"
    assert updated.requires_document is True
    assert updated.document_name == "supporting-doc.pdf"
    assert updated.status == ObligationStatus.PENDING
    assert updated.version == 1

    with pytest.raises(InvalidEditableFieldError):
        repository.update(
            FIRST_ID,
            expected_version=1,
            fields={"status": ObligationStatus.SUBMITTED},
        )

    with pytest.raises(InvalidEditableFieldError):
        repository.update(
            FIRST_ID,
            expected_version=1,
            fields={"id": SECOND_ID},
        )

    with pytest.raises(InvalidEditableFieldError):
        repository.update(
            FIRST_ID,
            expected_version=1,
            fields={"version": 99},
        )


def test_update_uses_optimistic_locking(session) -> None:
    repository = ObligationRepository(session)
    repository.create(make_obligation())

    repository.update(
        FIRST_ID,
        expected_version=0,
        fields={"title": "Updated once"},
    )

    with pytest.raises(ConcurrencyConflictError):
        repository.update(
            FIRST_ID,
            expected_version=0,
            fields={"title": "Updated twice"},
        )


def test_transition_status_persists_audit_history_with_same_session(session) -> None:
    repository = ObligationRepository(session)
    obligation = repository.create(make_obligation())

    change = obligation.transition_to(ObligationStatus.IN_PROGRESS, changed_at=FIXED_CHANGED_AT)
    updated = repository.transition_status(
        obligation.id,
        expected_version=0,
        change=change,
    )

    assert updated.status == ObligationStatus.IN_PROGRESS
    assert updated.version == 1
    assert repository.get_audit_history(obligation.id) == [change]


def test_transition_status_uses_optimistic_locking(session) -> None:
    repository = ObligationRepository(session)
    obligation = repository.create(make_obligation())
    change = obligation.transition_to(ObligationStatus.IN_PROGRESS, changed_at=FIXED_CHANGED_AT)

    repository.transition_status(
        obligation.id,
        expected_version=0,
        change=change,
    )

    with pytest.raises(ConcurrencyConflictError):
        repository.transition_status(
            obligation.id,
            expected_version=0,
            change=change,
        )
