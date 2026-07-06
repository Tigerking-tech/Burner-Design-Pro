# 🚀 Quick Start - Deploy Burner Design Pro

This guide will help you deploy Burner Design Pro in minutes using Vercel (frontend) + Railway (backend).

## Prerequisites

1. GitHub account
2. Vercel account (https://vercel.com)
3. Railway account (https://railway.app)

## Step 1: Push Code to GitHub

```bash
cd /workspace/burnerpro

# Initialize git (if not already done)
git init
git add .
git commit -m "Burner Design Pro - Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/burnerpro.git
git push -u origin master
```

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select the `burnerpro` repository
6. Choose the `backend` folder
7. Railway will auto-detect Python settings

### Configure Environment Variables

In Railway dashboard, go to **Variables** and add:

```
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://*.vercel.app,http://localhost:3000
RATE_LIMIT=100
RATE_WINDOW=60
```

### Get Backend URL

After deployment, Railway will give you a URL like:
```
https://burner-api.railway.app
```
**Copy this URL** - you'll need it for Step 3.

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repo (`burnerpro`)
4. Set root directory: `frontend`
5. **Important**: Click "Environment Variables" and add:

```
NAME: VITE_API_URL
VALUE: https://burner-api.railway.app  (use your actual Railway URL!)
```

6. Click **"Deploy"**

### Wait for Deployment

Vercel will build and deploy your frontend. This takes 1-2 minutes.

## Step 4: Update Backend CORS

After frontend deployment, go back to Railway:
1. Click on your project
2. Go to **Variables**
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
   ```
   Replace `your-frontend` with your actual Vercel subdomain

4. Railway will auto-redeploy

## Step 5: Test Your Deployment

1. Open your Vercel frontend URL
2. Test all features:
   - ✅ Home page loads
   - ✅ Gas calculator works
   - ✅ Unit converter works
   - ✅ Emissions module works

## 🎉 Congratulations!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://burner-api.railway.app

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- Wait for Railway to redeploy after updating

**2. API Not Working**
- Check Railway logs for errors
- Verify `VITE_API_URL` is correct

**3. Build Failed**
- Check Vercel build logs
- Make sure Node.js version is 18+

### View Logs

**Railway logs:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

**Vercel logs:**
- Go to Vercel dashboard → Your project → Logs

## Custom Domain (Optional)

### Vercel
1. Project Settings → Domains
2. Add your domain (e.g., `burnerpro.com`)
3. Update DNS records as instructed

### Railway
1. Project Settings → Networking
2. Add custom domain
3. Configure DNS

## Need Help?

- 📖 Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔒 Security documentation: [SECURITY.md](./SECURITY.md)
- 📝 API documentation: Available at `/docs` endpoint

## Quick Commands

```bash
# Local development
cd frontend && npm run dev      # Frontend
cd backend && uvicorn app.main:app --reload  # Backend

# Production build
cd frontend && npm run build

# Update deployment
git push origin main  # Auto-deploys
```

## Performance Tips

1. **Enable caching** in Vercel (automatic)
2. **Use CDN** - Vercel CDN is enabled by default
3. **Optimize images** - Use WebP format
4. **Monitor performance** - Enable Vercel Analytics

## Security Reminders

✅ All sensitive data in environment variables
✅ Rate limiting enabled (100 req/min)
✅ Input validation on all endpoints
✅ Security headers configured
✅ HTTPS enforced

## Next Steps

1. Set up monitoring (Sentry, LogRocket)
2. Configure backup strategy
3. Set up CI/CD pipeline
4. Add more features!

---

**Questions?** Create an issue on GitHub or contact support.
