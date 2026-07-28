class InvalidStatusTransition(Exception):
    """Raised when an obligation status transition is not allowed."""


class RequiredDocumentMissing(Exception):
    """Raised when a required document is missing for submission."""
