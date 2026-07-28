class ConcurrencyConflictError(Exception):
    """Raised when an optimistic-locking update affects no rows."""


class InvalidEditableFieldError(Exception):
    """Raised when an update attempts to modify immutable fields."""
