from __future__ import annotations

from typing import TYPE_CHECKING
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .obligation import ObligationModel


class AuditEntryModel(Base):
    __tablename__ = "audit_entries"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    obligation_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=False,
    )
    previous_status: Mapped[str] = mapped_column(String(16), nullable=False)
    new_status: Mapped[str] = mapped_column(String(16), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    obligation: Mapped[ObligationModel] = relationship(back_populates="audit_entries")
