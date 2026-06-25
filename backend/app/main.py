from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta
import uuid
from app.api import health, fuels, units, emissions, auth, subscription
from app.api.webhooks import router as webhooks_router
from app.security import (
    RateLimiter,
    SecurityHeadersMiddleware,
    ErrorHandlerMiddleware
)
from app.security.auth import get_password_hash
from app.services.database import (
    init_db, save_user, get_user_by_email, user_exists, db_info,
)

app = FastAPI(title="Burner Design Pro API")

# Configure CORS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
allow_all_origins = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else allowed_origins,
    allow_credentials=not allow_all_origins,
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

# Initialize admin user from DB
def create_default_admin():
    """
    Create admin user in database from environment variables.
    Creates if the email doesn't already exist, or updates password if it does.

    Environment Variables:
    - ADMIN_EMAIL: Admin email address
    - ADMIN_PASSWORD: Admin password (required for new installations)
    - ADMIN_FULL_NAME: Admin full name (optional)
    """
    admin_email = os.getenv("ADMIN_EMAIL", "admin@burnerpro.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "System Admin")
    environment = os.getenv("ENVIRONMENT", "development")

    existing_user = get_user_by_email(admin_email)
    if existing_user:
        print(f"[INFO] Admin user exists, updating password: {admin_email}")
        hashed_password = get_password_hash(admin_password)
        save_user(
            user_id=existing_user["id"],
            email=admin_email,
            hashed_password=hashed_password,
            full_name=existing_user.get("full_name", admin_full_name),
            is_active=True,
            is_admin=True,
            subscription_tier=existing_user.get("subscription_tier", "pro"),
            subscription_expires_at=existing_user.get("subscription_expires_at"),
        )
        print(f"[INFO] Admin password updated successfully")
    else:
        admin_id = str(uuid.uuid4())
        hashed_password = get_password_hash(admin_password)

        save_user(
            user_id=admin_id,
            email=admin_email,
            hashed_password=hashed_password,
            full_name=admin_full_name,
            is_active=True,
            is_admin=True,
            subscription_tier="pro",
            subscription_expires_at=datetime.utcnow() + timedelta(days=365),
        )

        print(f"[INFO] Created admin user: {admin_email}")
    else:
        print(f"[INFO] Admin user already exists: {admin_email}")

    if environment == "production":
        print(f"[INFO] Production mode - Admin credentials configured via environment variables")
        print(f"[INFO] Admin email: {admin_email}")
        if not os.getenv("ADMIN_PASSWORD"):
            print(f"[WARNING] Using default admin password in production! Please set ADMIN_PASSWORD immediately!")
    else:
        print(f"[INFO] Admin password: {admin_password}")
        print("[INFO] For production, set ADMIN_EMAIL and ADMIN_PASSWORD environment variables")

    info = db_info()
    print(f"[INFO] Database contains: {info['users']} users, {info['orders']} orders, {info['withdrawals']} withdrawals")


# Create admin user on startup
@app.on_event("startup")
async def startup_event():
    print("[STARTUP] Initializing database...")
    try:
        init_db()
        print("[STARTUP] Database initialized successfully")
    except Exception as e:
        print(f"[STARTUP] ERROR: Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        raise

    print("[STARTUP] Creating default admin...")
    try:
        create_default_admin()
        print("[STARTUP] Default admin created/verified successfully")
    except Exception as e:
        print(f"[STARTUP] ERROR: Failed to create admin: {e}")
        import traceback
        traceback.print_exc()
        raise

    print("[STARTUP] Startup complete")


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
