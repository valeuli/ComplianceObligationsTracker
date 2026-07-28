import os
from datetime import date, datetime, timezone
from uuid import UUID

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest

from app.database import Base, create_engine_from_url, create_session_factory
from app.domain import Obligation, ObligationStatus, ObligationType, StatusChange
from app.repositories import ConcurrencyConflictError, InvalidEditableFieldError, ObligationRepository
from app.services import CreateObligationData, ObligationNotFoundError, ObligationService

import app.models  # noqa: F401  # register SQLAlchemy models

FIXED_ID = UUID("123e4567-e89b-12d3-a456-426614174000")
SECOND_ID = UUID("123e4567-e89b-12d3-a456-426614174001")
FIXED_CHANGED_AT = datetime(2026, 1, 15, 12, 30, tzinfo=timezone.utc)


def make_create_data(
    *,
    type: ObligationType = ObligationType.ANNUAL_REPORT,
    title: str = "Annual report",
    description: str = "File annual report",
    due_date: date = date(2026, 1, 10),
    owner: str = "Acme LLC",
    requires_document: bool = False,
    document_name: str | None = None,
    company_tax_id: str = "123456789",
) -> CreateObligationData:
    return CreateObligationData(
        type=type,
        title=title,
        description=description,
        due_date=due_date,
        owner=owner,
        requires_document=requires_document,
        document_name=document_name,
        company_tax_id=company_tax_id,
    )


def make_obligation(
    *,
    id: UUID = FIXED_ID,
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
def session(tmp_path):
    database_url = f"sqlite+pysqlite:///{tmp_path / 'service.db'}"
    engine = create_engine_from_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def make_service(session) -> ObligationService:
    repository = ObligationRepository(session)
    return ObligationService(
        session,
        repository,
        clock=lambda: FIXED_CHANGED_AT,
        id_factory=lambda: FIXED_ID,
    )


def test_create_generates_id_pending_version_zero_and_commits(session) -> None:
    service = make_service(session)

    created = service.create(make_create_data())

    assert created.id == FIXED_ID
    assert created.status == ObligationStatus.PENDING
    assert created.version == 0
    assert ObligationRepository(session).get_by_id(FIXED_ID) == created


def test_create_rolls_back_when_commit_fails(session, monkeypatch) -> None:
    service = make_service(session)

    def failing_commit() -> None:
        raise RuntimeError("commit failed")

    monkeypatch.setattr(session, "commit", failing_commit)

    with pytest.raises(RuntimeError):
        service.create(make_create_data())

    assert ObligationRepository(session).get_by_id(FIXED_ID) is None


def test_get_by_id_returns_obligation_and_raises_when_missing(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    found = service.get_by_id(FIXED_ID)

    assert found.id == FIXED_ID

    with pytest.raises(ObligationNotFoundError):
        service.get_by_id(SECOND_ID)


def test_list_all_returns_ordered_by_due_date(session) -> None:
    service = make_service(session)
    repository = ObligationRepository(session)
    repository.create(make_obligation(id=SECOND_ID, due_date=date(2026, 1, 10), title="Second"))
    repository.create(make_obligation(id=FIXED_ID, due_date=date(2026, 1, 5), title="First"))

    result = service.list_all()

    assert [obligation.id for obligation in result] == [FIXED_ID, SECOND_ID]


def test_update_commits_and_respects_expected_version(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    updated = service.update(
        FIXED_ID,
        expected_version=0,
        fields={"title": "Updated title", "requires_document": True},
    )

    assert updated.title == "Updated title"
    assert updated.requires_document is True
    assert updated.version == 1


def test_update_rejects_immutable_fields(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    with pytest.raises(InvalidEditableFieldError):
        service.update(
            FIXED_ID,
            expected_version=0,
            fields={"status": ObligationStatus.SUBMITTED},
        )


def test_delete_commits_and_raises_when_missing(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    service.delete(FIXED_ID)

    assert ObligationRepository(session).get_by_id(FIXED_ID) is None

    with pytest.raises(ObligationNotFoundError):
        service.delete(SECOND_ID)


def test_change_status_uses_clock_and_persists_audit(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    updated = service.change_status(
        FIXED_ID,
        target_status=ObligationStatus.IN_PROGRESS,
        expected_version=0,
    )

    assert updated.status == ObligationStatus.IN_PROGRESS
    assert updated.version == 1
    assert ObligationRepository(session).get_audit_history(FIXED_ID) == [
        StatusChange(
            previous_status=ObligationStatus.PENDING,
            new_status=ObligationStatus.IN_PROGRESS,
            changed_at=FIXED_CHANGED_AT,
        )
    ]


def test_change_status_rejects_stale_expected_version_before_persisting(session) -> None:
    service = make_service(session)
    repository = ObligationRepository(session)
    repository.create(make_obligation())
    repository.update(
        FIXED_ID,
        expected_version=0,
        fields={"title": "Updated title"},
    )
    session.commit()

    with pytest.raises(ConcurrencyConflictError):
        service.change_status(
            FIXED_ID,
            target_status=ObligationStatus.IN_PROGRESS,
            expected_version=0,
        )

    assert repository.get_audit_history(FIXED_ID) == []
    updated = repository.get_by_id(FIXED_ID)
    assert updated is not None
    assert updated.title == "Updated title"
    assert updated.version == 1


def test_get_audit_history_requires_existing_obligation(session) -> None:
    service = make_service(session)
    ObligationRepository(session).create(make_obligation())

    assert service.get_audit_history(FIXED_ID) == []

    with pytest.raises(ObligationNotFoundError):
        service.get_audit_history(SECOND_ID)
