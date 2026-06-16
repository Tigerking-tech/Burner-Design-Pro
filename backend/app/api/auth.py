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
    in_memory_users, in_memory_passwords, email_to_user_id
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

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


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
    
    user_id = email_to_user_id.get(token_data.email)
    if user_id is None:
        raise credentials_exception
    
    user = in_memory_users.get(user_id)
    if user is None:
        raise credentials_exception
    
    return user


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
    """Register a new user (requires email verification before login)"""
    # Check if user already exists
    if user_data.email in email_to_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (inactive until verified)
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=False,  # Requires verification
        is_admin=False,
        created_at=now,
        updated_at=now,
        subscription_tier="free",
        subscription_expires_at=None
    )
    
    # Store user and password hash
    in_memory_users[user_id] = user
    email_to_user_id[user.email] = user_id
    in_memory_passwords[user_id] = hashed_password
    
    # Generate and store verification code
    code = generate_verification_code()
    store_verification_code(user.email, code, user_id, expires_minutes=30)
    
    # Send verification email
    await send_verification_email(user.email, code)
    
    return {
        "success": True,
        "message": "Registration successful. Please check your email for verification code.",
        "email": user.email,
        "requires_verification": True,
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
    
    # Activate user
    user = in_memory_users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    user.updated_at = datetime.utcnow()
    
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
    
    user_id = email_to_user_id.get(email)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = in_memory_users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
    store_verification_code(user.email, code, user_id, expires_minutes=30)
    
    # Send verification email
    await send_verification_email(user.email, code)
    
    return {
        "success": True,
        "message": "Verification code sent. Please check your email."
    }


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with OAuth2 password flow"""
    # Find user
    user_id = email_to_user_id.get(form_data.username)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = in_memory_users.get(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    hashed_password = in_memory_passwords.get(user_id)
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
    # Verify current password
    user_id = current_user.id
    hashed_password = in_memory_passwords.get(user_id)
    
    if not hashed_password or not verify_password(password_data.current_password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update with new password
    new_hashed_password = get_password_hash(password_data.new_password)
    in_memory_passwords[user_id] = new_hashed_password
    
    # Update user's updated_at timestamp
    in_memory_users[user_id].updated_at = datetime.utcnow()
    
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
    # Check if user exists
    if user_id not in in_memory_users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update with new password
    new_hashed_password = get_password_hash(password_data.new_password)
    in_memory_passwords[user_id] = new_hashed_password
    
    # Update user's updated_at timestamp
    in_memory_users[user_id].updated_at = datetime.utcnow()
    
    return {
        "success": True,
        "message": "User password changed successfully"
    }
