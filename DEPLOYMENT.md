# Deployment Guide for Diouf Al-Sharq CMS

## Overview

This CMS application consists of two parts:
1. **Frontend (React)** - This repository
2. **Backend (Node.js/Express)** - Separate backend server required

## Current Issue

You're getting errors like "Error loading categories" and "Unexpected token '<', '<!DOCTYPE'... is not valid JSON" because:

1. The frontend is deployed on Vercel but expects a backend API server
2. API calls to `/api/*` endpoints are returning HTML (the frontend app) instead of JSON data
3. No backend server is configured to handle the API requests

## Solution Options

### Option 1: Deploy Backend Separately (Recommended)

1. **Deploy the backend server** to a platform like:
   - Vercel (for Node.js APIs)
   - Railway
   - Render
   - Heroku
   - DigitalOcean App Platform

2. **Set environment variable** in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-api-url.com
   ```

3. **Redeploy the frontend** after setting the environment variable

### Option 2: Use Vercel Functions (Alternative)

Create API routes using Vercel's serverless functions:

1. Create `api/` folder in the root directory
2. Add serverless functions for each endpoint
3. Configure database connection

## Step-by-Step Deployment

### Step 1: Backend Deployment

1. **Create a separate repository** for the backend code
2. **Deploy to your chosen platform** (e.g., Railway, Render)
3. **Configure environment variables**:
   ```env
   DATABASE_URL=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   PORT=3000
   ```
4. **Note the deployed backend URL** (e.g., `https://your-backend.railway.app`)

### Step 2: Frontend Configuration

1. **In Vercel dashboard**, go to your project settings
2. **Add environment variable**:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.com` (without trailing slash)
3. **Redeploy the application**

### Step 3: Verification

1. **Check the browser console** for API calls
2. **Verify API calls** are going to the correct backend URL
3. **Test functionality** on pages like Categories, Manpower, etc.

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend-api-url.com
```

### Backend (.env)
```env
DATABASE_URL=mongodb://localhost:27017/diouf-al-sharq-cms
JWT_SECRET=your-jwt-secret-key
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
UPLOAD_DIR=./uploads
PORT=3000
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## Troubleshooting

### Error: "Unexpected token '<', '<!DOCTYPE'..."
- **Cause**: API calls are returning HTML instead of JSON
- **Solution**: Ensure `VITE_API_BASE_URL` points to your backend server

### Error: "Error loading [resource]"
- **Cause**: Backend server is not running or unreachable
- **Solution**: Check backend deployment and URL configuration

### CORS Errors
- **Cause**: Backend not configured to accept requests from frontend domain
- **Solution**: Configure CORS in backend to allow your Vercel domain

## Quick Fix for Testing

If you need a quick temporary solution for testing:

1. **Use a mock API service** like JSONPlaceholder or create mock data
2. **Update the API base URL** to point to the mock service
3. **This is only for testing** - you'll need a proper backend for production

## Next Steps

1. **Deploy your backend server** to a hosting platform
2. **Set the `VITE_API_BASE_URL` environment variable** in Vercel
3. **Redeploy your frontend** application
4. **Test all functionality** to ensure API calls work correctly

## Support

If you need help with:
- Backend deployment
- Database setup
- Environment configuration

Please provide more details about your backend code and preferred hosting platform.