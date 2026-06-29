"""
Security utilities for password hashing and JWT token handling
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import os
import secrets
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

# Salt for hashing - read from environment variables
SALT = os.getenv("HASH_SALT", "burnerpro-demo-salt-2026").encode()


def create_refresh_token() -> str:
    """Create a secure random refresh token."""
    return secrets.token_urlsafe(64)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return get_password_hash(plain_password) == hashed_password


def get_password_hash(password: str) -> str:
    """Hash a password using SHA256 with salt"""
    return hashlib.sha256((password + SALT.decode()).encode()).hexdigest()


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
