import os
from uuid import UUID

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.dependencies import get_session
from app.main import app as fastapi_app

import app.models  # noqa: F401  # register SQLAlchemy models


def _make_client_and_session():
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = testing_session_factory()

    def override_get_session():
        try:
            yield session
        finally:
            pass

    fastapi_app.dependency_overrides[get_session] = override_get_session
    client = TestClient(fastapi_app)
    return client, session


def test_create_returns_201_and_masks_tax_id() -> None:
    client, session = _make_client_and_session()
    response = client.post(
        "/api/obligations",
        json={
            "type": "annual_report",
            "title": "Annual report",
            "description": "File annual report",
            "due_date": "2026-01-10",
            "owner": "Acme LLC",
            "requires_document": False,
            "document_name": None,
            "company_tax_id": "123456789",
        },
    )

    try:
        assert response.status_code == 201
        body = response.json()
        assert body["company_tax_id_masked"] == "••••6789"
        assert "123456789" not in response.text
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_get_missing_obligation_returns_404() -> None:
    client, session = _make_client_and_session()
    try:
        response = client.get(f"/api/obligations/{UUID('123e4567-e89b-12d3-a456-426614174000')}")
        assert response.status_code == 404
        assert response.json()["code"] == "not_found"
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_pending_done_returns_422() -> None:
    client, session = _make_client_and_session()
    try:
        created = client.post(
            "/api/obligations",
            json={
                "type": "annual_report",
                "title": "Annual report",
                "description": "File annual report",
                "due_date": "2026-01-10",
                "owner": "Acme LLC",
                "requires_document": False,
                "document_name": None,
                "company_tax_id": "123456789",
            },
        ).json()

        response = client.post(
            f"/api/obligations/{created['id']}/transitions",
            json={"target_status": "done", "expected_version": 0},
        )
        assert response.status_code == 422
        assert response.json()["code"] == "invalid_transition"
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_missing_required_document_returns_422() -> None:
    client, session = _make_client_and_session()
    try:
        created = client.post(
            "/api/obligations",
            json={
                "type": "annual_report",
                "title": "Annual report",
                "description": "File annual report",
                "due_date": "2026-01-10",
                "owner": "Acme LLC",
                "requires_document": True,
                "document_name": None,
                "company_tax_id": "123456789",
            },
        ).json()

        first_transition = client.post(
            f"/api/obligations/{created['id']}/transitions",
            json={"target_status": "in_progress", "expected_version": 0},
        )
        assert first_transition.status_code == 200

        response = client.post(
            f"/api/obligations/{created['id']}/transitions",
            json={"target_status": "submitted", "expected_version": 1},
        )
        assert response.status_code == 422
        assert response.json()["code"] == "required_document_missing"
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_stale_version_returns_409() -> None:
    client, session = _make_client_and_session()
    try:
        created = client.post(
            "/api/obligations",
            json={
                "type": "annual_report",
                "title": "Annual report",
                "description": "File annual report",
                "due_date": "2026-01-10",
                "owner": "Acme LLC",
                "requires_document": False,
                "document_name": None,
                "company_tax_id": "123456789",
            },
        ).json()

        first_update = client.patch(
            f"/api/obligations/{created['id']}",
            json={"expected_version": 0, "title": "Updated title"},
        )
        assert first_update.status_code == 200

        response = client.patch(
            f"/api/obligations/{created['id']}",
            json={"expected_version": 0, "title": "Updated again"},
        )
        assert response.status_code == 409
        assert response.json()["code"] == "version_conflict"
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_valid_transition_creates_audit_entry() -> None:
    client, session = _make_client_and_session()
    try:
        created = client.post(
            "/api/obligations",
            json={
                "type": "annual_report",
                "title": "Annual report",
                "description": "File annual report",
                "due_date": "2026-01-10",
                "owner": "Acme LLC",
                "requires_document": False,
                "document_name": None,
                "company_tax_id": "123456789",
            },
        ).json()

        response = client.post(
            f"/api/obligations/{created['id']}/transitions",
            json={"target_status": "in_progress", "expected_version": 0},
        )
        assert response.status_code == 200
        assert len(response.json()["audit_history"]) == 1
        assert response.json()["audit_history"][0]["previous_status"] == "pending"
        assert response.json()["audit_history"][0]["new_status"] == "in_progress"
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()


def test_delete_returns_204() -> None:
    client, session = _make_client_and_session()
    try:
        created = client.post(
            "/api/obligations",
            json={
                "type": "annual_report",
                "title": "Annual report",
                "description": "File annual report",
                "due_date": "2026-01-10",
                "owner": "Acme LLC",
                "requires_document": False,
                "document_name": None,
                "company_tax_id": "123456789",
            },
        ).json()

        response = client.delete(f"/api/obligations/{created['id']}")
        assert response.status_code == 204
        assert response.text == ""
    finally:
        client.close()
        session.close()
        fastapi_app.dependency_overrides.clear()
