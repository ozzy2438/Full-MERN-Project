#!/bin/bash

# Exit on error
set -e

echo "Starting frontend deployment process..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
  echo "Error: frontend directory not found! Make sure you're in the project root."
  exit 1
fi

# Ensure the custom build script is executable
chmod +x frontend/custom-build.js

# Install dependencies in the frontend directory
echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

# Install specific dependencies that might be causing issues
echo "Installing specific dependencies..."
npm install jest-worker@29.7.0 workbox-webpack-plugin@6.5.4

# Create .env file with build optimizations
echo "Creating optimized .env file..."
cat > .env << 'EOL'
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
CI=false
EOL

# Build the frontend
echo "Building frontend..."
npm run build

echo "Frontend build completed!"
echo "You can now deploy the frontend to Render using the following settings:"
echo "  - Root Directory: frontend"
echo "  - Build Command: npm run build"
echo "  - Publish Directory: build"
echo "  - Environment Variables:"
echo "      REACT_APP_API_URL: https://full-mern-project.onrender.com/api"
