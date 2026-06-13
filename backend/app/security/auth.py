"""
Security utilities for password hashing and JWT token handling
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import os
from jose import JWTError, jwt
from app.models.user import TokenData

# JWT settings (in production, use environment variables)
SECRET_KEY = "your-super-secret-key-change-in-production-1234567890"  # Replace with env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Simple salt for hashing (for demo purposes only!)
SALT = b"burnerpro-demo-salt-2026"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return get_password_hash(plain_password) == hashed_password


def get_password_hash(password: str) -> str:
    """Hash a password using SHA256 (for demo purposes only!)"""
    return hashlib.sha256((password + "burnerpro-demo-pepper").encode()).hexdigest()


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
