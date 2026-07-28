from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.repositories import ConcurrencyConflictError
from app.schemas import ErrorResponse
from app.services import ObligationNotFoundError
from app.domain import InvalidStatusTransition, RequiredDocumentMissing


def _json_error(*, code: str, message: str, http_status: int) -> JSONResponse:
    return JSONResponse(
        status_code=http_status,
        content=ErrorResponse(code=code, message=message).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ObligationNotFoundError)
    def handle_not_found(_: Request, __: ObligationNotFoundError) -> JSONResponse:
        return _json_error(
            code="not_found",
            message="The requested obligation was not found.",
            http_status=status.HTTP_404_NOT_FOUND,
        )

    @app.exception_handler(ConcurrencyConflictError)
    def handle_conflict(_: Request, __: ConcurrencyConflictError) -> JSONResponse:
        return _json_error(
            code="version_conflict",
            message="The obligation was modified by another request.",
            http_status=status.HTTP_409_CONFLICT,
        )

    @app.exception_handler(InvalidStatusTransition)
    def handle_invalid_transition(_: Request, __: InvalidStatusTransition) -> JSONResponse:
        return _json_error(
            code="invalid_transition",
            message="The status transition is not allowed.",
            http_status=status.HTTP_422_UNPROCESSABLE_CONTENT,
        )

    @app.exception_handler(RequiredDocumentMissing)
    def handle_missing_document(_: Request, __: RequiredDocumentMissing) -> JSONResponse:
        return _json_error(
            code="required_document_missing",
            message="A document is required for this transition.",
            http_status=status.HTTP_422_UNPROCESSABLE_CONTENT,
        )

    @app.exception_handler(RequestValidationError)
    def handle_validation_error(_: Request, __: RequestValidationError) -> JSONResponse:
        return _json_error(
            code="validation_error",
            message="Invalid request payload.",
            http_status=status.HTTP_422_UNPROCESSABLE_CONTENT,
        )
