"""
Security utilities for password hashing and JWT token handling
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import os
import secrets
import bcrypt
from jose import JWTError, jwt
from app.models.user import TokenData

# JWT settings - read from environment variables
SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "your-super-secret-key-change-in-production-1234567890"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

# Check for insecure default key in production
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
if ENVIRONMENT in ("production", "prod") and SECRET_KEY == "your-super-secret-key-change-in-production-1234567890":
    print("=" * 80)
    print("WARNING: USING DEFAULT JWT SECRET KEY IN PRODUCTION!")
    print("This is CRITICALLY INSECURE. Set JWT_SECRET_KEY environment variable immediately.")
    print("=" * 80)

# Salt for legacy SHA256 hashing (for backward compatibility)
LEGACY_SALT = os.getenv("HASH_SALT", "burnerpro-demo-salt-2026").encode()

# bcrypt work factor (higher = slower = more secure; 12 is a good default)
BCRYPT_ROUNDS = 12


def create_refresh_token() -> str:
    """Create a secure random refresh token."""
    return secrets.token_urlsafe(64)


def _is_legacy_hash(hashed_password: str) -> bool:
    """Check if a hash is the old SHA256 format (64 hex chars, not bcrypt $2b$...)."""
    if not hashed_password:
        return False
    if hashed_password.startswith("$2"):
        return False
    return len(hashed_password) == 64 and all(c in '0123456789abcdef' for c in hashed_password.lower())


def _legacy_verify(plain_password: str, hashed_password: str) -> bool:
    """Legacy SHA256+salt verification (for backward compatibility)."""
    legacy_hash = hashlib.sha256((plain_password + LEGACY_SALT.decode()).encode()).hexdigest()
    return legacy_hash == hashed_password


def _preprocess_password(password: str) -> bytes:
    """Preprocess password with SHA256 before bcrypt.
    
    This removes bcrypt's 72-byte input limit while preserving security.
    Standard practice recommended by security experts.
    """
    return hashlib.sha256(password.encode('utf-8')).digest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    
    Supports both bcrypt (new) and SHA256+salt (legacy) formats.
    Automatically detects the format and uses the appropriate verifier.
    """
    if not hashed_password:
        return False
    
    if _is_legacy_hash(hashed_password):
        return _legacy_verify(plain_password, hashed_password)
    
    try:
        pwd_bytes = _preprocess_password(plain_password)
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt (modern, secure).
    
    Uses SHA256 preprocessing to bypass bcrypt's 72-byte limit.
    """
    pwd_bytes = _preprocess_password(password)
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def needs_migration(hashed_password: str) -> bool:
    """Check if a password hash needs migration from legacy to bcrypt."""
    return _is_legacy_hash(hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return TokenData(email=email)
    except JWTError:
        return None
