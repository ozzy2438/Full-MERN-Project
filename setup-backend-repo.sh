#!/bin/bash

# Exit on error
set -e

echo "Setting up backend-only repository for Render deployment..."

# Create directory for backend-only repo
mkdir -p /Users/osmanorka/job-portal-backend

# Copy backend files to the new directory
echo "Copying backend files..."
cp -r /Users/osmanorka/job-portal/backend/* /Users/osmanorka/job-portal-backend/

# Create a new package.json in the root
echo "Creating package.json..."
cat > /Users/osmanorka/job-portal-backend/package.json << 'EOL'
{
  "name": "job-portal-backend",
  "version": "1.0.0",
  "description": "Job Portal Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "private": true
}
EOL

# Copy over the dependencies from the original package.json
echo "Updating dependencies..."
node -e "
const fs = require('fs');
const originalPkg = require('/Users/osmanorka/job-portal/backend/package.json');
const newPkg = require('/Users/osmanorka/job-portal-backend/package.json');
newPkg.dependencies = originalPkg.dependencies;
newPkg.devDependencies = originalPkg.devDependencies;
fs.writeFileSync('/Users/osmanorka/job-portal-backend/package.json', JSON.stringify(newPkg, null, 2));
"

echo "Backend-only repository setup complete!"
echo "Next steps:"
echo "1. Create a new GitHub repository named 'job-portal-backend'"
echo "2. Push this code to the new repository"
echo "3. Deploy the backend-only repository to Render"
