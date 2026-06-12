"""
User and Subscription Data Models
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any


class UserBase(BaseModel):
    """Base User model"""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Model for creating a user"""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    """Model for changing password by user"""
    current_password: str
    new_password: str = Field(..., min_length=8)


class AdminChangePassword(BaseModel):
    """Model for changing user password by admin"""
    new_password: str = Field(..., min_length=8)


class User(UserBase):
    """Full User model"""
    id: str
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime
    subscription_tier: str = "free"  # free, pro, team
    subscription_expires_at: Optional[datetime] = None
    # Payment provider integration fields (Paddle)
    paddle_customer_id: Optional[str] = None
    paddle_subscription_id: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT Token model"""
    access_token: str
    token_type: str = "bearer"
    user: User


class TokenData(BaseModel):
    """Token data model for JWT verification"""
    email: Optional[str] = None


# ============== Subscription / Pricing Models ==============

class SubscriptionTier(BaseModel):
    """Subscription tier model"""
    name: str
    price: int  # in cents
    price_display: str
    period: str
    stripe_price_id: Optional[str] = None
    features: List[str]
    max_calculations: Optional[int] = None  # None means unlimited
    has_pdf_export: bool = False
    has_pro_calculators: bool = False
    has_team_features: bool = False
    max_team_members: int = 1


class SubscriptionCreate(BaseModel):
    """Model for creating/updating a subscription (admin only)"""
    user_id: str
    tier: str
    expires_at: Optional[datetime] = None


class SubscriptionUpdate(BaseModel):
    """Model for updating a subscription"""
    tier: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


# ============== Order / Transaction Models ==============

class Order(BaseModel):
    """Order model"""
    id: str
    user_id: str
    user_email: str
    tier: str
    amount: int  # in cents
    currency: str = "usd"
    paddle_checkout_id: Optional[str] = None
    paddle_transaction_id: Optional[str] = None
    status: str = "pending"  # pending, succeeded, failed, refunded
    created_at: datetime
    updated_at: datetime


class OrderCreate(BaseModel):
    """Model for creating an order"""
    tier: str
    payment_method_id: Optional[str] = None


class PaymentIntent(BaseModel):
    """Payment Intent model"""
    client_secret: str
    order_id: str


# ============== Withdrawal Models ==============

class WithdrawalRequest(BaseModel):
    """Withdrawal request model"""
    id: str
    admin_id: str
    admin_email: str
    amount: int  # in cents
    currency: str = "usd"
    payment_method: str = "stripe_transfer"
    status: str = "pending"  # pending, processing, completed, failed
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WithdrawalRequestCreate(BaseModel):
    """Model for creating a withdrawal request (admin only)"""
    amount: int
    payment_method: str = "stripe_transfer"
    notes: Optional[str] = None


class WithdrawalRequestUpdate(BaseModel):
    """Model for updating a withdrawal request (admin only)"""
    status: Optional[str] = None
    notes: Optional[str] = None


# ============== In-Memory Data Stores (for demo) ==============

# In production, these would be replaced with a real database
# For now, we'll use in-memory storage for demonstration
in_memory_users: Dict[str, User] = {}
in_memory_passwords: Dict[str, str] = {}
in_memory_orders: Dict[str, Order] = {}
in_memory_withdrawals: Dict[str, WithdrawalRequest] = {}
email_to_user_id: Dict[str, str] = {}
