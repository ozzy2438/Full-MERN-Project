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

# Create build directory
echo "Creating build directory..."
mkdir -p build

# Create a simple index.html file in the build directory
echo "Creating static files..."
cat > build/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareerLens</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
        }
        h1 {
            color: #4a6cf7;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to CareerLens</h1>
        <p>Your AI-powered career assistant is ready to help you find the perfect job match.</p>
        <p>The frontend is currently being updated. Please check back soon for the full experience.</p>
        <p>In the meantime, you can access our API services directly.</p>
        <a href="https://full-mern-project.onrender.com/api" class="button">Access API</a>
    </div>
</body>
</html>
EOL

# Create a simple manifest.json file
cat > build/manifest.json << 'EOL'
{
  "short_name": "CareerLens",
  "name": "CareerLens - AI Job Portal",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#4a6cf7",
  "background_color": "#ffffff"
}
EOL

# Create a simple robots.txt file
cat > build/robots.txt << 'EOL'
User-agent: *
Allow: /
EOL

# Copy favicon.ico if it exists
if [ -f public/favicon.ico ]; then
  echo "Copying favicon.ico..."
  cp public/favicon.ico build/
fi

echo "Static build completed successfully!"
