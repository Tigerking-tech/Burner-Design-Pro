# Burner Design Pro - Deployment Guide

This guide covers deployment to various platforms. Choose the option that best fits your needs.

## Option 1: Vercel (Recommended for React Frontend)

### Frontend Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Navigate to frontend directory**
```bash
cd /workspace/burnerpro/frontend
```

3. **Create vercel.json**
```bash
cat > vercel.json << 'EOF'
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF
```

4. **Deploy to Vercel**
```bash
vercel
# Follow prompts, select your project settings
vercel --prod  # For production deployment
```

5. **Set Environment Variables (Optional)**
In Vercel dashboard:
- `VITE_API_URL`: Your backend URL (e.g., https://burner-api.vercel.app)

### Backend Deployment (Backend as a Service Options)

#### Option A: Railway (Recommended)

1. **Connect GitHub repository to Railway**
   - Go to https://railway.app
   - Connect your GitHub repo
   - Select the `backend` folder

2. **Configure Start Command**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

3. **Set Environment Variables**
```
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://your-frontend.vercel.app
RATE_LIMIT=100
RATE_WINDOW=60
ADMIN_EMAIL=your-admin-email@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password-here
ADMIN_FULL_NAME=System Administrator
```

**Important:** Always set a strong `ADMIN_PASSWORD` in production!

4. **Get Backend URL**
After deployment, you'll get a URL like: `https://burner-api.railway.app`

#### Option B: Render

1. **Create Render Account**
   - Go to https://render.com
   - Connect GitHub

2. **Create New Web Service**
   - Connect your repo
   - Set root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
Same as Railway above

#### Option C: PythonAnywhere

1. **Create Account**
   - Go to https://pythonanywhere.com

2. **Upload Backend Code**
   - Use Bash console or upload files

3. **Create WSGI File**
```bash
# In your app directory
cat > burnermat.wsgi << 'EOF'
import sys
path = '/home/yourusername/burnerpro/backend'
if path not in sys.path:
    sys.path.insert(0, path)

from app.main import app as application
EOF
```

4. **Configure in Web Tab**
   - WSGI file: `/home/yourusername/burnerpro/burnermat.wsgi`
   - Virtualenv: Create and install requirements

## Option 2: Docker Deployment

### 1. Create Dockerfile for Backend

```bash
cd /workspace/burnerpro/backend
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV ENVIRONMENT=production
ENV DEBUG=false

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
```

### 2. Create docker-compose.yml (Optional)

```bash
cd /workspace/burnerpro
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
      - ALLOWED_ORIGINS=http://localhost:3000
      - RATE_LIMIT=100
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    restart: unless-stopped

networks:
  default:
    name: burnerpro-network
EOF
```

### 3. Create nginx.conf

```bash
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 4. Build and Run

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Build and start containers
docker-compose up -d
```

## Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

### 1. Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx
```

### 2. Clone Repository

```bash
cd /opt
git clone https://your-repo-url/burnerpro.git
cd burnerpro
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
nano .env  # Edit with your production values
```

### 4. Setup SSL with Let's Encrypt

```bash
# Edit nginx config
nano /etc/nginx/sites-available/default

# Add this server block for SSL
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Get SSL certificate
certbot --nginx -d yourdomain.com
```

### 5. Deploy with Docker

```bash
cd /opt/burnerpro
docker-compose up -d
```

## Frontend API Configuration

### Update API URL for Production

In your frontend code, update the API base URL:

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com';
```

Or update Vite config:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
})
```

## Security Checklist Before Going Live

### Backend
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=false`
- [ ] Configure `ALLOWED_ORIGINS` with your frontend domain
- [ ] Set strong rate limits
- [ ] Use HTTPS for all connections
- [ ] Review and test all API endpoints

### Frontend
- [ ] Build for production: `npm run build`
- [ ] Test all functionality in production build
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up monitoring (Vercel Analytics, Sentry, etc.)

### General
- [ ] Remove any test data
- [ ] Set up logging
- [ ] Configure backup strategy
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Review CORS settings
- [ ] Test error handling

## Monitoring & Maintenance

### Set Up Error Tracking

```bash
# Install Sentry SDK (backend)
pip install sentry-sdk[fastapi]

# Add to main.py
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### Set Up Logging

```python
# In backend/app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/burnerpro/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` includes your frontend URL
   - Ensure HTTPS is enabled

2. **Build Failures**
   - Check Node.js version: `node --version` (need v18+)
   - Clear cache: `npm cache clean --force`

3. **API 500 Errors**
   - Check backend logs
   - Verify environment variables are set
   - Check database connections if applicable

### Useful Commands

```bash
# Check backend logs (Docker)
docker-compose logs -f backend

# Check frontend logs (Docker)
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Update deployment
git pull origin main
docker-compose up -d --build
```

## Backup Strategy

### Database Backups (if using database)
```bash
# PostgreSQL example
pg_dump -U username dbname > backup_$(date +%Y%m%d).sql
```

### File Backups
```bash
# Backup entire app
tar -czf burnerpro_backup_$(date +%Y%m%d).tar.gz /opt/burnerpro
```

### Automated Backups
Set up cron job:
```bash
# Edit crontab
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /opt/burnerpro/scripts/backup.sh
```

## Support & Resources

- **Documentation**: `/workspace/burnerpro/docs/`
- **API Docs**: Available at `/docs` endpoint
- **Logs**: Check Docker logs or `/var/log/burnerpro/`
- **Security Issues**: Create GitHub issue or contact support

## Administrator Account Setup

### How the Admin Account is Created

The system automatically creates an admin account during the first server startup. The credentials are configured via environment variables.

### Environment Variables for Admin Account

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_EMAIL` | No | `admin@burnerpro.com` | Email address for the admin account |
| `ADMIN_PASSWORD` | **Yes (Production)** | `admin123` | Strong password for admin access |
| `ADMIN_FULL_NAME` | No | `System Admin` | Display name for the admin |

### Production Setup (Important!)

**Never use the default password in production!**

In your deployment platform (Railway, Render, Docker, etc.), set these environment variables:

```bash
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your_very_secure_password_here  # Use a strong password!
ADMIN_FULL_NAME=System Administrator
ENVIRONMENT=production
```

### Password Best Practices for Production

1. **Use a strong password**: Minimum 12 characters, mix of uppercase, lowercase, numbers, and symbols
2. **Never commit passwords** to version control
3. **Rotate passwords regularly**: Consider changing admin password every 90 days
4. **Limit access**: Only share admin credentials with trusted team members
5. **Consider 2FA**: For enhanced security (future feature)

### Changing Admin Password Later

Currently, to change the admin password:

1. **Option 1**: Update the `ADMIN_PASSWORD` environment variable and restart the server (works for new installations)
2. **Option 2**: Use the admin dashboard to create a new admin user, then disable the old one

**Note**: Current version uses in-memory storage. For persistent storage, consider adding a database integration.

## Quick Start (Summary)

For the fastest deployment:

1. **Frontend → Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Backend → Railway**
   - Connect repo at railway.app
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set environment variables (including admin credentials!)
   - Get backend URL

3. **Update Frontend**
   - Set `VITE_API_URL` to backend URL
   - Redeploy

That's it! Your app will be live in minutes.
