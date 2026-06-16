"""
In-memory store for email verification codes.
In production, this should be replaced with Redis or a database.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional


class VerificationEntry:
    def __init__(self, code: str, user_id: str, expires_at: datetime):
        self.code = code
        self.user_id = user_id
        self.expires_at = expires_at
        self.verified = False
        self.resend_count = 0


# In-memory store: email -> VerificationEntry
_verification_codes: Dict[str, VerificationEntry] = {}


def store_verification_code(email: str, code: str, user_id: str, expires_minutes: int = 30) -> None:
    """Store a verification code for an email.
    If code already exists, increment resend_count."""
    key = email.lower()
    existing = _verification_codes.get(key)
    resend_count = existing.resend_count + 1 if existing else 0
    _verification_codes[key] = VerificationEntry(
        code=code,
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
    )
    _verification_codes[key].resend_count = resend_count


def get_verification_entry(email: str) -> Optional[VerificationEntry]:
    """Get verification entry for an email."""
    return _verification_codes.get(email.lower())


def verify_code(email: str, code: str) -> Optional[str]:
    """
    Verify a code for an email.
    Returns user_id if successful, None if failed.
    """
    entry = _verification_codes.get(email.lower())
    if not entry:
        return None
    if entry.verified:
        return None
    if datetime.utcnow() > entry.expires_at:
        return None
    if entry.code != code:
        return None
    entry.verified = True
    return entry.user_id


def delete_verification_code(email: str) -> None:
    """Delete verification code for an email."""
    _verification_codes.pop(email.lower(), None)


def cleanup_expired_codes() -> None:
    """Remove expired verification codes."""
    now = datetime.utcnow()
    expired = [
        email for email, entry in _verification_codes.items()
        if datetime.utcnow() > entry.expires_at and not entry.verified
    ]
    for email in expired:
        del _verification_codes[email]
