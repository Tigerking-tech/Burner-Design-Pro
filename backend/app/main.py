from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta
import uuid
from app.api import health, fuels, units, emissions, auth, subscription
from app.api.webhooks import router as webhooks_router
from app.models.user import User, in_memory_users, in_memory_passwords, email_to_user_id
from app.security import (
    RateLimiter,
    SecurityHeadersMiddleware,
    ErrorHandlerMiddleware
)
from app.security.auth import get_password_hash

app = FastAPI(title="Burner Design Pro API")

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiter (100 requests per minute per IP)
rate_limit = int(os.getenv("RATE_LIMIT", "100"))
rate_window = int(os.getenv("RATE_WINDOW", "60"))
app.add_middleware(RateLimiter, max_requests=rate_limit, window_seconds=rate_window)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(fuels.router, prefix="/api", tags=["fuels"])
app.include_router(units.router)
app.include_router(emissions.router)
app.include_router(auth.router)
app.include_router(subscription.router)
app.include_router(webhooks_router)

# Initialize admin user for production
def create_default_admin():
    """
    Create admin user from environment variables in production,
    or use default for demo purposes.
    
    Environment Variables:
    - ADMIN_EMAIL: Admin email address
    - ADMIN_PASSWORD: Admin password (required for new installations)
    - ADMIN_FULL_NAME: Admin full name (optional)
    """
    # Get admin credentials from environment variables or use demo defaults
    admin_email = os.getenv("ADMIN_EMAIL", "admin@burnerpro.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "System Admin")
    environment = os.getenv("ENVIRONMENT", "development")
    
    if admin_email not in email_to_user_id:
        admin_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        admin_user = User(
            id=admin_id,
            email=admin_email,
            full_name=admin_full_name,
            is_active=True,
            is_admin=True,
            created_at=now,
            updated_at=now,
            subscription_tier="pro",
            subscription_expires_at=datetime.utcnow() + timedelta(days=365)
        )
        
        in_memory_users[admin_id] = admin_user
        email_to_user_id[admin_email] = admin_id
        in_memory_passwords[admin_id] = get_password_hash(admin_password)
        
        print(f"[INFO] Created admin user: {admin_email}")
        
        if environment == "production":
            print(f"[INFO] Production mode - Admin credentials configured via environment variables")
            print(f"[INFO] Admin email: {admin_email}")
            if not os.getenv("ADMIN_PASSWORD"):
                print(f"[WARNING] Using default admin password in production! Please set ADMIN_PASSWORD immediately!")
        else:
            print(f"[INFO] Admin password: {admin_password}")
            print("[INFO] For production, set ADMIN_EMAIL and ADMIN_PASSWORD environment variables")

# Create admin user on startup
@app.on_event("startup")
async def startup_event():
    create_default_admin()

@app.get("/")
def root():
    return {
        "name": "Burner Design Pro API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
