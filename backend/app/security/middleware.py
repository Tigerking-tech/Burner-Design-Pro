from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
import traceback

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content-Security-Policy - balanced for React/Vite apps
        # - Allows inline styles (needed for Tailwind/CSS-in-JS)
        # - Allows data: URIs for images/fonts
        # - Restricts everything else to same origin
        # - script-src uses 'self' (production builds work; dev may need 'unsafe-inline')
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        
        # Permissions-Policy - disable unnecessary browser features
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )
        
        # Remove server header (prevent server identification)
        if "server" in response.headers:
            del response.headers["server"]
        
        return response

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Log the full error internally
            logger.error(
                f"Error processing request: {request.method} {request.url.path}\n"
                f"Error: {str(exc)}\n"
                f"Traceback: {traceback.format_exc()}"
            )
            
            # Return generic error message to client
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "An internal server error occurred. Please try again later.",
                    "error_code": "INTERNAL_ERROR"
                }
            )
