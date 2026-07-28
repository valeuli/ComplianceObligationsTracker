from __future__ import annotations

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Path, Response, status

from app.dependencies import ServiceDep
from app.schemas import (
    CreateObligationRequest,
    ObligationResponse,
    ObligationSummaryResponse,
    TransitionObligationRequest,
    UpdateObligationRequest,
)
from app.services import CreateObligationData

router = APIRouter(prefix="/api/obligations", tags=["obligations"])


@router.post("", response_model=ObligationResponse, status_code=status.HTTP_201_CREATED)
def create_obligation(
    request: CreateObligationRequest,
    service: ServiceDep,
) -> ObligationResponse:
    created = service.create(
        CreateObligationData(
            type=request.type,
            title=request.title,
            description=request.description,
            due_date=request.due_date,
            owner=request.owner,
            requires_document=request.requires_document,
            document_name=request.document_name,
            company_tax_id=request.company_tax_id,
        )
    )
    return ObligationResponse.from_domain(
        created,
        audit_history=service.get_audit_history(created.id),
        today=date.today(),
    )


@router.get("", response_model=list[ObligationSummaryResponse])
def list_obligations(service: ServiceDep) -> list[ObligationSummaryResponse]:
    today = date.today()
    return [
        ObligationSummaryResponse.from_domain(obligation, today=today)
        for obligation in service.list_all()
    ]


@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(
    obligation_id: Annotated[UUID, Path(description="Obligation UUID")],
    service: ServiceDep,
) -> ObligationResponse:
    obligation = service.get_by_id(obligation_id)
    return ObligationResponse.from_domain(
        obligation,
        audit_history=service.get_audit_history(obligation_id),
        today=date.today(),
    )


@router.patch("/{obligation_id}", response_model=ObligationResponse)
def update_obligation(
    request: UpdateObligationRequest,
    obligation_id: Annotated[UUID, Path(description="Obligation UUID")],
    service: ServiceDep,
) -> ObligationResponse:
    update_fields = request.model_dump(exclude_none=True, exclude={"expected_version"})
    updated = service.update(
        obligation_id,
        expected_version=request.expected_version,
        fields=update_fields,
    )
    return ObligationResponse.from_domain(
        updated,
        audit_history=service.get_audit_history(obligation_id),
        today=date.today(),
    )


@router.delete("/{obligation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_obligation(
    obligation_id: Annotated[UUID, Path(description="Obligation UUID")],
    service: ServiceDep,
) -> Response:
    service.delete(obligation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{obligation_id}/transitions", response_model=ObligationResponse)
def transition_obligation(
    request: TransitionObligationRequest,
    obligation_id: Annotated[UUID, Path(description="Obligation UUID")],
    service: ServiceDep,
) -> ObligationResponse:
    updated = service.change_status(
        obligation_id,
        target_status=request.target_status,
        expected_version=request.expected_version,
    )
    return ObligationResponse.from_domain(
        updated,
        audit_history=service.get_audit_history(obligation_id),
        today=date.today(),
    )
