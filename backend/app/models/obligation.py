from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Date, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

OBLIGATION_TYPES = (
    "annual_report",
    "franchise_tax",
    "boi_report",
    "registered_agent_renewal",
)
OBLIGATION_STATUSES = (
    "pending",
    "in_progress",
    "submitted",
    "done",
)


class ObligationModel(Base):
    __tablename__ = "obligations"
    __table_args__ = (
        CheckConstraint(f"type IN {OBLIGATION_TYPES!r}", name="ck_obligations_type_valid"),
        CheckConstraint(f"status IN {OBLIGATION_STATUSES!r}", name="ck_obligations_status_valid"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    owner: Mapped[str] = mapped_column(String(120), nullable=False)
    requires_document: Mapped[bool] = mapped_column(nullable=False, default=False)
    document_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_tax_id: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    audit_entries: Mapped[list["AuditEntryModel"]] = relationship(
        back_populates="obligation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
