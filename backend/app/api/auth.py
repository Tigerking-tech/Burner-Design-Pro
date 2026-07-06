"""
Authentication and User API endpoints
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
import uuid
import os

from app.models.user import (
    User, UserCreate, UserLogin, Token, TokenData,
    ChangePassword, AdminChangePassword, RefreshTokenRequest,
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.security.auth import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
    create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS,
    needs_migration,
)
from app.services.email_service import send_verification_email, generate_verification_code, send_password_reset_email, send_password_changed_email
from app.services.verification_store import (
    store_verification_code, verify_code, delete_verification_code,
    get_verification_entry, store_password_reset, verify_password_reset,
    mark_password_reset_used, is_account_locked, record_failed_login,
    reset_login_attempts,
)
from app.services.database import (
    save_user, get_user_by_id, get_user_by_email, get_user_password,
    activate_user, update_user_password, user_exists,
    update_user_refresh_token, get_user_by_refresh_token,
    list_users, delete_user, get_user_orders,
    save_login_activity, get_user_login_activities,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _dict_to_user(user_dict: dict) -> User:
    """Convert a DB row dict to a User model."""
    return User(**user_dict)


def _create_token_response(user: User) -> Token:
    """Create access + refresh token response for a user."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token()
    refresh_expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    update_user_refresh_token(
        user_id=user.id,
        refresh_token=refresh_token,
        refresh_token_expires_at=refresh_expires_at,
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


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
    """Register a new user (requires email verification before login)"""
    # GDPR: Verify terms acceptance (explicit opt-in required)
    if not user_data.agreed_to_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must agree to the Terms of Service and Privacy Policy to create an account"
        )
    
    # Check if user already exists
    if user_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    print(f"[REGISTRATION] New user: {user_data.email} (terms_accepted={user_data.agreed_to_terms})")
    
    # Create user (inactive until verified)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    save_user(
        user_id=user_id,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=False,
        is_admin=False,
        subscription_tier="free",
        subscription_expires_at=None,
    )
    
    # Generate and store verification code
    code = generate_verification_code()
    store_verification_code(user_data.email, code, user_id, expires_minutes=30)
    
    # Send verification email
    await send_verification_email(user_data.email, code)
    
    return {
        "success": True,
        "message": "Registration successful. Please check your email for verification code.",
        "email": user_data.email,
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
    
    # Create access + refresh tokens
    return _create_token_response(user)


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
    print(f"[LOGIN DEBUG] Attempting login with email: '{form_data.username}'")
    
    email = form_data.username.strip().lower()
    
    # Check if account is locked
    locked, lockout_until = is_account_locked(email)
    if locked:
        minutes_left = int((lockout_until - datetime.utcnow()).total_seconds() / 60) + 1
        print(f"[LOGIN DEBUG] FAILED - Account locked: {email}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Account locked for {minutes_left} minutes. Try again later or reset your password.",
            headers={"Retry-After": str(max(60, minutes_left * 60))},
        )
    
    user_dict = get_user_by_email(email)
    if user_dict is None:
        # Record failed attempt even for non-existent emails (prevents enumeration timing attacks)
        record_failed_login(email)
        # Log activity with placeholder user_id for non-existent users
        try:
            save_login_activity(
                user_id="unknown",
                email=email,
                success=False,
                failure_reason="User not found",
            )
        except Exception:
            pass
        print(f"[LOGIN DEBUG] FAILED - User not found with email: '{email}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = _dict_to_user(user_dict)
    print(f"[LOGIN DEBUG] Found user: id={user.id}, is_active={user.is_active}, is_admin={user.is_admin}")
    
    hashed_password = get_user_password(user.id)
    print(f"[LOGIN DEBUG] Stored hash: '{hashed_password[:20]}...' (length: {len(hashed_password) if hashed_password else 0})")
    
    if not hashed_password or not verify_password(form_data.password, hashed_password):
        failed_count, locked, lockout_until = record_failed_login(email)
        try:
            save_login_activity(
                user_id=user.id,
                email=email,
                success=False,
                failure_reason="Incorrect password",
            )
        except Exception:
            pass
        print(f"[LOGIN DEBUG] FAILED - Password mismatch (attempt {failed_count})")
        if locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Account locked for 15 minutes. Try again later or reset your password.",
                headers={"Retry-After": "900"},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        try:
            save_login_activity(
                user_id=user.id,
                email=email,
                success=False,
                failure_reason="Account not active",
            )
        except Exception:
            pass
        print(f"[LOGIN DEBUG] FAILED - User not active")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for verification code.",
        )
    
    # Reset failed attempts on successful login
    reset_login_attempts(email)
    
    # Log successful login
    try:
        save_login_activity(
            user_id=user.id,
            email=email,
            success=True,
        )
    except Exception:
        pass
    
    # Auto-migrate legacy SHA256 password hashes to bcrypt on successful login
    if needs_migration(hashed_password):
        print(f"[LOGIN DEBUG] Migrating password hash to bcrypt for user: {user.email}")
        new_hash = get_password_hash(form_data.password)
        update_user_password(user.id, new_hash)
    
    # Create access + refresh tokens
    return _create_token_response(user)


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@router.get("/login-activity")
async def get_login_activity(
    current_user: User = Depends(get_current_active_user),
    limit: int = 20,
):
    """Get recent login activity for the current user."""
    limit = min(max(1, limit), 100)
    activities = get_user_login_activities(current_user.id, limit=limit)
    return {
        "success": True,
        "activities": activities,
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(data: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    refresh_token = data.refresh_token.strip()
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required",
        )

    user_dict = get_user_by_refresh_token(refresh_token)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = _dict_to_user(user_dict)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )

    row_expires = user_dict.get("refresh_token_expires_at")
    if row_expires and datetime.utcnow() > row_expires:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    return _create_token_response(user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Invalidate the current user's refresh token"""
    update_user_refresh_token(
        user_id=current_user.id,
        refresh_token=None,
        refresh_token_expires_at=None,
    )
    return {"success": True, "message": "Logged out successfully"}


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


@router.get("/export-data")
async def export_my_data(current_user: User = Depends(get_current_active_user)):
    """
    Export all personal data for the current user (GDPR right to data portability).
    Returns a JSON object with all user data.
    """
    user_dict = get_user_by_id(current_user.id)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove sensitive data
    user_data = {
        "id": user_dict.get("id"),
        "email": user_dict.get("email"),
        "full_name": user_dict.get("full_name"),
        "created_at": user_dict.get("created_at"),
        "updated_at": user_dict.get("updated_at"),
        "subscription_tier": user_dict.get("subscription_tier"),
        "subscription_expires_at": user_dict.get("subscription_expires_at"),
        "creem_customer_id": user_dict.get("creem_customer_id"),
        "creem_subscription_id": user_dict.get("creem_subscription_id"),
        "creem_status": user_dict.get("creem_status"),
    }
    
    # Get orders
    orders = get_user_orders(current_user.id)
    
    return {
        "exported_at": datetime.utcnow().isoformat(),
        "user": user_data,
        "orders": orders,
    }


@router.delete("/account")
async def delete_my_account(
    password_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete current user's account and all associated data (GDPR right to erasure).
    Requires password confirmation.
    """
    password = password_data.get("password", "")
    
    # Verify password
    hashed_password = get_user_password(current_user.id)
    if not hashed_password or not verify_password(password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )
    
    user_email = current_user.email
    user_id = current_user.id
    
    # Delete the user and all their data
    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    print(f"[ACCOUNT DELETION] User deleted: {user_id} ({user_email})")
    
    return {
        "success": True,
        "message": "Your account has been permanently deleted."
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


# ----------------------------------------------------------------------
# Password Reset (Forgot Password)
# ----------------------------------------------------------------------
@router.post("/password-reset/request")
async def request_password_reset(data: dict):
    """
    Request a password reset link.
    Always returns success to prevent email enumeration attacks.
    """
    email = data.get("email", "").strip().lower()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    user_dict = get_user_by_email(email)
    
    # Always return success to prevent email enumeration
    if not user_dict:
        return {
            "success": True,
            "message": "If an account exists with that email, a password reset link has been sent."
        }
    
    # Generate secure random token
    import secrets
    reset_token = secrets.token_urlsafe(48)
    
    # Store token (1 hour expiry)
    store_password_reset(
        token=reset_token,
        user_id=user_dict["id"],
        email=email,
        expires_minutes=60,
    )
    
    # Send email
    app_url = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    await send_password_reset_email(email, reset_token, app_url)
    
    return {
        "success": True,
        "message": "If an account exists with that email, a password reset link has been sent."
    }


@router.post("/password-reset/confirm")
async def confirm_password_reset(data: dict):
    """
    Confirm password reset with token and set new password.
    """
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new password are required"
        )
    
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Verify token
    entry = verify_password_reset(token)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )
    
    # Get user
    user_dict = get_user_by_id(entry.user_id)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Mark token as used (before changing password to prevent race conditions)
    mark_password_reset_used(token)
    
    # Update password
    new_hashed_password = get_password_hash(new_password)
    update_user_password(entry.user_id, new_hashed_password)
    
    # Send confirmation email
    await send_password_changed_email(entry.email)
    
    return {
        "success": True,
        "message": "Password has been reset successfully. You can now log in with your new password."
    }
