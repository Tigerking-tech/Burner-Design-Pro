"""
Authentication and User API endpoints
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
import uuid

from app.models.user import (
    User, UserCreate, UserLogin, Token, TokenData,
    ChangePassword, AdminChangePassword,
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.security.auth import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.services.email_service import send_verification_email, generate_verification_code
from app.services.verification_store import (
    store_verification_code, verify_code, delete_verification_code,
    get_verification_entry
)
from app.services.database import (
    save_user, get_user_by_id, get_user_by_email, get_user_password,
    activate_user, update_user_password, user_exists,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _dict_to_user(user_dict: dict) -> User:
    """Convert a DB row dict to a User model."""
    return User(**user_dict)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    if token_data is None:
        raise credentials_exception
    
    # Look up user by email in the database
    user_dict = get_user_by_email(token_data.email)
    if user_dict is None:
        raise credentials_exception
    
    return _dict_to_user(user_dict)


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    return current_user


@router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user (auto-activated, no email verification required)"""
    # Check if user already exists
    if user_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (auto-activated)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    save_user(
        user_id=user_id,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False,
        subscription_tier="free",
        subscription_expires_at=None,
    )
    
    # Create access token immediately
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email, "email": user_data.email},
        expires_delta=access_token_expires,
    )
    
    user_dict = get_user_by_id(user_id)
    user = _dict_to_user(user_dict)
    
    return {
        "success": True,
        "message": "Registration successful.",
        "email": user_data.email,
        "requires_verification": False,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.dict(),
    }


@router.post("/verify-email")
async def verify_email(data: dict):
    """Verify email with code"""
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    
    if not email or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and verification code are required"
        )
    
    user_id = verify_code(email, code)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Activate user in database
    user_dict = get_user_by_id(user_id)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    activate_user(user_id)
    
    # Refresh user data
    user_dict = get_user_by_id(user_id)
    user = _dict_to_user(user_dict)
    
    # Clean up verification code
    delete_verification_code(email)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, user=user)


@router.post("/resend-verification")
async def resend_verification(data: dict):
    """Resend verification code"""
    email = data.get("email", "").strip().lower()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    # Check user exists in DB
    user_dict = get_user_by_email(email)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = _dict_to_user(user_dict)
    
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Check rate limit (max 3 resends per email)
    entry = get_verification_entry(email)
    if entry and entry.resend_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many resend attempts. Please wait 30 minutes."
        )
    
    # Generate new code
    code = generate_verification_code()
    store_verification_code(email, code, user.id, expires_minutes=30)
    
    # Send verification email
    await send_verification_email(email, code)
    
    return {
        "success": True,
        "message": "Verification code sent. Please check your email."
    }


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with OAuth2 password flow"""
    # Find user by email (form_data.username is the email in OAuth2)
    user_dict = get_user_by_email(form_data.username)
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = _dict_to_user(user_dict)
    
    # Verify password from DB
    hashed_password = get_user_password(user.id)
    if not hashed_password or not verify_password(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if email is verified
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for verification code.",
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, user=user)


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@router.get("/pricing")
async def get_pricing():
    """Get all pricing tiers"""
    return {
        "success": True,
        "tiers": [
            {
                "id": tier_id,
                "name": tier.name,
                "price": tier.price,
                "price_display": tier.price_display,
                "period": tier.period,
                "features": tier.features,
                "max_calculations": tier.max_calculations,
                "has_pdf_export": tier.has_pdf_export,
                "has_pro_calculators": tier.has_pro_calculators
            }
            for tier_id, tier in SUBSCRIPTION_TIERS.items()
        ]
    }


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_active_user)
):
    """Change current user's password"""
    # Verify current password from DB
    hashed_password = get_user_password(current_user.id)
    
    if not hashed_password or not verify_password(password_data.current_password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update in DB
    new_hashed_password = get_password_hash(password_data.new_password)
    update_user_password(current_user.id, new_hashed_password)
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }


@router.post("/admin/users/{user_id}/change-password")
async def admin_change_user_password(
    user_id: str,
    password_data: AdminChangePassword,
    current_user: User = Depends(get_admin_user)
):
    """Change any user's password (admin only)"""
    # Check if user exists in DB
    if not get_user_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update in DB
    new_hashed_password = get_password_hash(password_data.new_password)
    update_user_password(user_id, new_hashed_password)
    
    return {
        "success": True,
        "message": "User password changed successfully"
    }
