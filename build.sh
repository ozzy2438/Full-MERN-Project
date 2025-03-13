#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Check if we're in the right directory
if [ -d "backend" ]; then
  echo "Found backend directory, proceeding with build..."
else
  echo "Error: backend directory not found!"
  exit 1
fi

# Install backend dependencies only
echo "Installing backend dependencies..."
cd backend
npm install

echo "Backend build completed successfully!"
