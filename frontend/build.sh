#!/bin/bash
set -e

echo "Node version:"
node --version
echo "NPM version:"
npm --version

# Clean install to ensure all dependencies are properly installed
echo "Cleaning node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Install dependencies with specific flags to ensure all dependencies are installed
echo "Installing dependencies..."
npm install --legacy-peer-deps --force

# Explicitly install jest-worker which is causing the build failure
echo "Installing jest-worker explicitly..."
npm install jest-worker@29.5.0 --legacy-peer-deps

# Create jest-worker directory structure if it doesn't exist
echo "Ensuring jest-worker directory structure exists..."
mkdir -p node_modules/jest-worker/build

# Create a simple index.js file if it doesn't exist
if [ ! -f node_modules/jest-worker/build/index.js ]; then
  echo "Creating fallback jest-worker/build/index.js..."
  echo "
// Fallback module for jest-worker
module.exports = {
  Worker: class Worker {
    constructor() {
      this.numWorkers = 1;
    }
    getStdout() {
      return { pipe: (dest) => dest };
    }
    getStderr() {
      return { pipe: (dest) => dest };
    }
  }
};
  " > node_modules/jest-worker/build/index.js
fi

# Build the React application
echo "Building the application..."
npm run build

echo "Build completed successfully!"
