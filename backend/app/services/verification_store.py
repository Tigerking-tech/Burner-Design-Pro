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


# ========= Password Reset Tokens =========

class PasswordResetEntry:
    def __init__(self, token: str, user_id: str, email: str, expires_at: datetime):
        self.token = token
        self.user_id = user_id
        self.email = email
        self.expires_at = expires_at
        self.used = False


_password_reset_tokens: Dict[str, PasswordResetEntry] = {}


def store_password_reset(token: str, user_id: str, email: str, expires_minutes: int = 60) -> None:
    """Store a password reset token."""
    _password_reset_tokens[token] = PasswordResetEntry(
        token=token,
        user_id=user_id,
        email=email.lower(),
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
    )


def verify_password_reset(token: str) -> Optional[PasswordResetEntry]:
    """
    Verify a password reset token.
    Returns the entry if valid, None if invalid/expired/used.
    """
    entry = _password_reset_tokens.get(token)
    if not entry:
        return None
    if entry.used:
        return None
    if datetime.utcnow() > entry.expires_at:
        return None
    return entry


def mark_password_reset_used(token: str) -> None:
    """Mark a password reset token as used."""
    entry = _password_reset_tokens.get(token)
    if entry:
        entry.used = True


def cleanup_expired_resets() -> None:
    """Remove expired password reset tokens."""
    now = datetime.utcnow()
    expired = [
        token for token, entry in _password_reset_tokens.items()
        if now > entry.expires_at
    ]
    for token in expired:
        del _password_reset_tokens[token]


# ========= Login Attempt Tracking (Account Lockout) =========

class LoginAttemptEntry:
    def __init__(self):
        self.failed_attempts = 0
        self.lockout_until: Optional[datetime] = None
        self.last_attempt_at: Optional[datetime] = None


_login_attempts: Dict[str, LoginAttemptEntry] = {}

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


def _get_login_attempt(email: str) -> LoginAttemptEntry:
    key = email.lower()
    if key not in _login_attempts:
        _login_attempts[key] = LoginAttemptEntry()
    return _login_attempts[key]


def is_account_locked(email: str) -> tuple[bool, Optional[datetime]]:
    """Check if an account is currently locked out.
    
    Returns (is_locked, lockout_until).
    """
    entry = _get_login_attempt(email)
    if entry.lockout_until and datetime.utcnow() < entry.lockout_until:
        return True, entry.lockout_until
    return False, None


def record_failed_login(email: str) -> tuple[int, bool, Optional[datetime]]:
    """Record a failed login attempt.
    
    Returns (failed_attempts, is_now_locked, lockout_until).
    """
    entry = _get_login_attempt(email)
    entry.failed_attempts += 1
    entry.last_attempt_at = datetime.utcnow()
    
    locked = False
    lockout_until = None
    
    if entry.failed_attempts >= MAX_FAILED_ATTEMPTS:
        entry.lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        locked = True
        lockout_until = entry.lockout_until
    
    return entry.failed_attempts, locked, lockout_until


def reset_login_attempts(email: str) -> None:
    """Reset failed login attempts after successful login."""
    key = email.lower()
    if key in _login_attempts:
        _login_attempts[key].failed_attempts = 0
        _login_attempts[key].lockout_until = None


def cleanup_login_attempts() -> None:
    """Clean up old login attempt entries (older than 24h)."""
    now = datetime.utcnow()
    old = []
    for email, entry in _login_attempts.items():
        if entry.last_attempt_at and (now - entry.last_attempt_at).total_seconds() > 86400:
            old.append(email)
    for email in old:
        del _login_attempts[email]
