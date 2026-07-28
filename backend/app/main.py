from __future__ import annotations

from fastapi import FastAPI

from app.api_errors import register_exception_handlers
from app.routers.obligations import router as obligations_router

app = FastAPI(title="Compliance Obligations Tracker", version="0.1.0")

register_exception_handlers(app)
app.include_router(obligations_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
