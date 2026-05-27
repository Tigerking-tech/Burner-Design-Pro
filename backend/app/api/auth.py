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
    in_memory_users, in_memory_passwords, email_to_user_id
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.security.auth import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
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


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    if user_data.email in email_to_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=True,
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
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, user=user)


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
                "has_pro_calculators": tier.has_pro_calculators,
                "has_team_features": tier.has_team_features
            }
            for tier_id, tier in SUBSCRIPTION_TIERS.items()
        ]
    }
