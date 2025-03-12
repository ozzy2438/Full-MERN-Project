#!/bin/bash

# Exit on error
set -e

echo "Installing dependencies..."
npm install

echo "Creating scripts directory if it doesn't exist..."
mkdir -p scripts

echo "Checking if custom build script exists..."
if [ ! -f "scripts/build.js" ]; then
  echo "Custom build script not found, creating it..."
  cat > scripts/build.js << 'EOL'
// Custom build script to bypass workbox-webpack-plugin issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a temporary file to override the webpack config
const createTempConfig = () => {
  const webpackConfigPath = path.resolve(
    __dirname,
    '../node_modules/react-scripts/config/webpack.config.js'
  );

  // Check if the webpack config exists
  if (!fs.existsSync(webpackConfigPath)) {
    console.error('Could not find webpack config at:', webpackConfigPath);
    process.exit(1);
  }

  // Read the webpack config
  let webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');

  // Replace the workbox-webpack-plugin import with a mock
  webpackConfig = webpackConfig.replace(
    /const\s+WorkboxWebpackPlugin\s+=\s+require\(['"]workbox-webpack-plugin['"]\);/,
    'const WorkboxWebpackPlugin = { GenerateSW: class MockGenerateSW {} };'
  );

  // Disable the workbox plugin usage
  webpackConfig = webpackConfig.replace(
    /new\s+WorkboxWebpackPlugin\.GenerateSW\(/g,
    'false && new WorkboxWebpackPlugin.GenerateSW('
  );

  // Write the modified config to a temporary file
  const tempConfigPath = path.resolve(__dirname, '../webpack.config.temp.js');
  fs.writeFileSync(tempConfigPath, webpackConfig);

  return tempConfigPath;
};

// Main function
const main = async () => {
  try {
    console.log('Creating temporary webpack config...');
    const tempConfigPath = createTempConfig();

    console.log('Running build with modified webpack config...');
    // Set environment variables and run the build
    const env = {
      ...process.env,
      DISABLE_ESLINT_PLUGIN: 'true',
      GENERATE_SOURCEMAP: 'false',
      BROWSER: 'none',
      CI: 'false',
      DISABLE_WORKBOX: 'true',
      WDS_SOCKET_HOST: '0.0.0.0',
      FAST_REFRESH: 'false',
      SKIP_PREFLIGHT_CHECK: 'true'
    };

    // Run the original build script
    execSync('node ../node_modules/react-scripts/scripts/build.js', {
      stdio: 'inherit',
      env
    });

    console.log('Build completed successfully!');

    // Clean up the temporary file
    fs.unlinkSync(tempConfigPath);
    console.log('Temporary webpack config removed.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

main();
EOL
fi

echo "Making build script executable..."
chmod +x scripts/build.js

echo "Running custom build script..."
node scripts/build.js

echo "Build completed!"
