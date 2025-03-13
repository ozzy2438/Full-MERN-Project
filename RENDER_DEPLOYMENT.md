-# Render Deployment Guide

This guide provides instructions for deploying the frontend and backend of the Job Portal application to Render.

## Backend Deployment

The backend is already deployed at: https://full-mern-project.onrender.com

## Frontend Deployment

To deploy the frontend to Render, follow these steps:

### Option 1: Manual Deployment

1. Log in to your Render account
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Fill in the deployment form:
   - **Name**: Choose a name for your frontend (e.g., "job-portal-frontend")
   - **Branch**: main (or the branch containing your code)
   - **Root Directory**: frontend
   - **Runtime**: Node
   - **Build Command**: npm run build
   - **Start Command**: npm run serve
   - **Environment Variables**:
     - REACT_APP_API_URL: https://full-mern-project.onrender.com/api

### Option 2: Using the Deploy Script

1. Run the deployment script from the project root:
   ```bash
   ./deploy-frontend.sh
   ```
2. Follow the instructions provided by the script
3. Deploy to Render using the settings provided by the script

## Troubleshooting

If you encounter build issues during deployment, try these solutions:

1. **Module not found errors**: The custom build script in the frontend directory will automatically handle common module not found errors by installing missing dependencies.

2. **Service worker issues**: The build script will try multiple approaches, including disabling service workers if needed.

3. **Fallback mode**: If all build attempts fail, the script will create a minimal fallback build that displays a maintenance page.

4. **Manual fixes**:
   - Add any missing dependencies to frontend/package.json
   - Create a .env file in the frontend directory with:
     ```
     DISABLE_ESLINT_PLUGIN=true
     GENERATE_SOURCEMAP=false
     SKIP_PREFLIGHT_CHECK=true
     CI=false
     ```

## Checking Deployment Status

After deployment, you can check the status of your frontend at the URL provided by Render. The frontend should connect to the backend API and display the Job Portal application.
