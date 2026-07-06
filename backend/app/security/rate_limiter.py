from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.cleanup_task = None
    
    async def get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def is_rate_limited(self, client_ip: str) -> bool:
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > cutoff
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            return True
        
        # Add current request
        self.requests[client_ip].append(now)
        return False
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/api/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = await self.get_client_ip(request)
        
        if await self.is_rate_limited(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
        
        response = await call_next(request)
        return response

class ConnectionLimiter:
    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self.active_connections = 0
        self._lock = asyncio.Lock()
    
    async def acquire(self) -> bool:
        async with self._lock:
            if self.active_connections < self.max_connections:
                self.active_connections += 1
                return True
            return False
    
    async def release(self):
        async with self._lock:
            if self.active_connections > 0:
                self.active_connections -= 1
    
    @property
    def current_connections(self) -> int:
        return self.active_connections
