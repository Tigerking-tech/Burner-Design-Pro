from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api import health, fuels, units, emissions
from app.security import (
    RateLimiter,
    SecurityHeadersMiddleware,
    ErrorHandlerMiddleware
)

app = FastAPI(title="Burner Design Pro API")

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
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
