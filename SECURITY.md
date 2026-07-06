# Security Documentation - Burner Design Pro

## Overview

This document outlines the security measures implemented in Burner Design Pro to protect against common vulnerabilities and ensure safe operation.

## 1. Input Validation

### Implemented Security Measures

**Location:** `backend/app/security/validator.py`

- **Numeric Input Validation**
  - Validates all numeric inputs
  - Rejects negative values where inappropriate
  - Enforces reasonable value ranges
  - Examples:
    - O2 percentage: 0-21%
    - Temperature: Above absolute zero (-273.15°C) to 10,000°C
    - Load factor: 0-1
    - Annual hours: 0-8760

- **String Sanitization**
  - SQL injection prevention using pattern matching
  - Detects dangerous SQL keywords: SELECT, INSERT, UPDATE, DELETE, DROP, etc.
  - Removes special characters
  - Maximum length validation (255 characters default)

- **Enumeration Validation**
  - Pollutants: NOx, CO, CO2, SOx
  - Fuel types: natural_gas_low, natural_gas_high, diesel_low, heavy_oil_low, coal, natural_gas, heavy_oil, solid
  - Standards: EPA, EU

**Usage Example:**
```python
from app.security.validator import InputValidator, ValidationError

try:
    o2_value = InputValidator.validate_o2_percentage(5.0)
    pollutant = InputValidator.validate_pollutant('NOx')
    fuel = InputValidator.validate_fuel_type('natural_gas_low')
except ValidationError as e:
    print(f"Validation failed: {e.field} - {e.message}")
```

## 2. API Rate Limiting

**Location:** `backend/app/security/rate_limiter.py`

### Configuration
- **Default:** 100 requests per minute per IP
- **Configurable** via environment variables:
  - `RATE_LIMIT`: Maximum requests per window (default: 100)
  - `RATE_WINDOW`: Time window in seconds (default: 60)

### Implementation
- Tracks requests per client IP address
- Automatically cleans up old requests
- Returns HTTP 429 (Too Many Requests) when limit exceeded
- Bypasses rate limiting for health checks

**Environment Variables:**
```bash
RATE_LIMIT=100
RATE_WINDOW=60
```

## 3. CORS Configuration

**Location:** `backend/app/main.py`

### Configuration
- **Allowed Origins:** Configurable via environment variable
- **Allowed Methods:** GET, POST only
- **Allowed Headers:** All headers
- **Credentials:** Supported

### Environment Variables
```bash
# Development (default includes localhost ports)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Production (replace with your Vercel domain)
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## 4. Security Headers

**Location:** `backend/app/security/middleware.py`

### Headers Added
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - XSS filter
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` - HSTS
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- `Content-Security-Policy: default-src 'self'` - CSP

### Server Header Removal
- Removes server identification header to prevent information disclosure

## 5. Error Handling

### Implementation
- All exceptions are caught by middleware
- Generic error messages returned to clients
- Detailed errors logged internally only
- No stack traces exposed to frontend

**Error Response Format:**
```json
{
  "detail": "An internal server error occurred. Please try again later.",
  "error_code": "INTERNAL_ERROR"
}
```

### Validation Errors
```json
{
  "detail": "pollutant: Invalid pollutant. Allowed: NOx, CO, CO2, SOx"
}
```

## 6. Environment Variables

**Location:** `.env` (create from `.env.example`)

### Required Variables
```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000

# Security Settings
RATE_LIMIT=100
RATE_WINDOW=60
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Environment
ENVIRONMENT=development
DEBUG=false
```

### Security Best Practices

1. **Never commit `.env` to version control**
2. **Use different values for development and production**
3. **Validate required variables on startup**

### Validation on Startup

The application validates environment variables when starting:

```python
# In main.py
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

if ENVIRONMENT not in ["development", "production"]:
    raise ValueError("ENVIRONMENT must be 'development' or 'production'")
```

## 7. Request Validation in API Endpoints

### Units API
- Validates numeric values within reasonable ranges
- Sanitizes all string inputs
- Validates unit names exist in the category
- Returns HTTP 400 for invalid requests

### Emissions API
- All numeric inputs validated:
  - Non-negative concentrations
  - O2 percentages (0-21%)
  - Load factors (0-1)
  - Annual hours (0-8760)
- Enumerated values validated against allowed lists
- SQL injection patterns detected and rejected

## 8. HTTPS Enforcement

### Production Checklist
- [ ] Deploy behind HTTPS-enabled load balancer
- [ ] Set `ALLOWED_ORIGINS` to HTTPS URLs only
- [ ] Enable HSTS header (included in security middleware)
- [ ] Set `ENVIRONMENT=production`

### Local Development
- Development server runs on HTTP
- CORS configured to allow localhost
- Rate limiting can be relaxed for testing

## 9. Connection Limiting

**Location:** `backend/app/security/rate_limiter.py`

### ConnectionLimiter Class
- Maximum connections: 100 (configurable)
- Async-safe implementation
- Tracks active connections

```python
from app.security import ConnectionLimiter

limiter = ConnectionLimiter(max_connections=100)

async def handle_request():
    if await limiter.acquire():
        try:
            # Process request
            pass
        finally:
            await limiter.release()
    else:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
```

## 10. Security Testing

### Manual Testing Checklist
1. **Input Validation**
   - [ ] Test negative values → Should return 400
   - [ ] Test extremely large values → Should return 400
   - [ ] Test SQL injection patterns → Should return 400
   - [ ] Test invalid enumerations → Should return 400

2. **Rate Limiting**
   - [ ] Send 100+ requests in 1 minute → Should get 429
   - [ ] Wait 1 minute → Should be able to request again

3. **CORS**
   - [ ] Request from allowed origin → Should succeed
   - [ ] Request from disallowed origin → Should be blocked

4. **Security Headers**
   - [ ] Check response headers in browser DevTools
   - [ ] Verify no server version exposed

## 11. Deployment Recommendations

### Vercel Configuration
```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

### Environment Variables in Vercel
- Set `ALLOWED_ORIGINS` to your Vercel domain
- Set `ENVIRONMENT=production`
- Set `DEBUG=false`

## 12. Monitoring and Logging

### What is Logged
- Rate limit violations (IP addresses)
- Request errors with traceback
- Validation failures

### What is NOT Logged
- User input values (to prevent log injection)
- Full stack traces (sent to client)
- Internal error details

## 13. Security Checklist

- [x] Input validation implemented
- [x] SQL injection prevention
- [x] Rate limiting (100 req/min/IP)
- [x] CORS configuration
- [x] Security headers
- [x] Error handling with generic messages
- [x] Environment variable support
- [x] No secrets in code
- [x] Stack traces not exposed

## 14. Future Enhancements

Planned security improvements:
- [ ] Database connection pooling with limits
- [ ] JWT authentication for admin endpoints
- [ ] API key authentication
- [ ] Request logging and audit trail
- [ ] Web Application Firewall (WAF) integration
- [ ] Dependency vulnerability scanning
- [ ] Regular security audits

## Contact

For security concerns, please contact the development team.
