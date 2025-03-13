# Frontend Deployment Guide for Render

This guide explains how to deploy the CareerLens frontend to Render.

## Prerequisites

- A Render account
- Git repository with your frontend code
- Backend already deployed at https://full-mern-project.onrender.com

## Deployment Steps

1. **Push your code to a Git repository**
   Make sure your code is in a Git repository (GitHub, GitLab, etc.)

2. **Create a new Web Service on Render**
   - Log in to your Render dashboard
   - Click "New" and select "Static Site"
   - Connect your Git repository
   - Configure the service:
     - Name: careerlens-frontend
     - Build Command: `npm install && npm run build`
     - Publish Directory: `build`
   - Add the environment variable:
     - Key: `REACT_APP_API_URL`
     - Value: `https://full-mern-project.onrender.com/api`
   - Click "Create Static Site"

3. **Configure SPA Routing**
   - In your Render dashboard, go to the Static Site settings
   - Under "Redirects/Rewrites", add a new rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Type: Rewrite

## Verification

After deployment, verify that:
1. The frontend loads correctly
2. API calls to the backend work properly
3. Authentication functions as expected
4. File uploads and other features work correctly

## Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Verify that CORS is properly configured on the backend
3. Ensure environment variables are set correctly
4. Check Render logs for build or runtime errors
