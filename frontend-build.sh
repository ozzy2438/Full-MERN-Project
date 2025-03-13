#!/bin/bash

# Exit on error
set -e

echo "Starting frontend build process..."

# Check if we're in the right directory
if [ -d "frontend" ]; then
  echo "Found frontend directory, proceeding with build..."
else
  echo "Error: frontend directory not found!"
  exit 1
fi

# Install frontend dependencies with legacy-peer-deps flag
echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

# Build the frontend
echo "Building frontend..."
CI=false npm run build

# No need to install serve globally as it's now in package.json

echo "Frontend build completed successfully!"
