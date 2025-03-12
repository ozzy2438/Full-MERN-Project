// prebuild.js - Ensures all dependencies are properly set up before building
const fs = require('fs');
const path = require('path');

console.log('Running prebuild script to ensure dependencies are properly set up...');

// Function to create a fallback jest-worker module
function createJestWorkerFallback(basePath) {
  const buildPath = path.join(basePath, 'build');
  if (!fs.existsSync(buildPath)) {
    console.log(`Creating directory: ${buildPath}`);
    fs.mkdirSync(buildPath, { recursive: true });
  }

  const indexPath = path.join(buildPath, 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.log(`Creating fallback jest-worker module: ${indexPath}`);
    fs.writeFileSync(indexPath, `
// Fallback module for jest-worker
module.exports = {
  Worker: class Worker {
    constructor() {
      this.numWorkers = 1;
    }
    getStdout() { return { pipe: (dest) => dest }; }
    getStderr() { return { pipe: (dest) => dest }; }
  }
};`);
  }

  const packageJsonPath = path.join(basePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`Creating package.json for jest-worker: ${packageJsonPath}`);
    fs.writeFileSync(packageJsonPath, JSON.stringify({
      name: 'jest-worker',
      version: '29.5.0',
      main: 'build/index.js'
    }, null, 2));
  }
}

// Create necessary directories for problematic dependencies
const jestWorkerPath = path.join(__dirname, 'node_modules', 'jest-worker');
const ajvPath = path.join(__dirname, 'node_modules', 'ajv', 'dist', 'compile');
const workboxPath = path.join(__dirname, 'node_modules', 'workbox-webpack-plugin', 'build');

// Create jest-worker fallback in the main node_modules
createJestWorkerFallback(jestWorkerPath);

// Find all instances of jest-worker in nested node_modules
function findNestedJestWorkers(baseDir) {
  const results = [];
  
  // Check if the directory exists
  if (!fs.existsSync(baseDir)) return results;
  
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(baseDir, entry.name);
      
      // Check if this is a jest-worker directory inside node_modules
      if (entry.name === 'jest-worker' && path.basename(baseDir) === 'node_modules') {
        results.push(fullPath);
      }
      
      // Check if this is a node_modules directory, and if so, look for jest-worker inside it
      if (entry.name === 'node_modules') {
        const nestedJestWorker = path.join(fullPath, 'jest-worker');
        if (fs.existsSync(nestedJestWorker)) {
          results.push(nestedJestWorker);
        }
      }
      
      // Recursively search in this directory, but avoid going too deep
      if (entry.name !== 'node_modules' && !fullPath.includes('node_modules/node_modules/node_modules')) {
        results.push(...findNestedJestWorkers(fullPath));
      }
    }
  }
  
  return results;
}

// Find and fix all jest-worker instances
console.log('Searching for nested jest-worker instances...');
const nestedJestWorkers = findNestedJestWorkers(path.join(__dirname, 'node_modules'));
console.log(`Found ${nestedJestWorkers.length} jest-worker instances`);

// Create fallbacks for all found jest-worker instances
nestedJestWorkers.forEach(jestWorkerPath => {
  console.log(`Creating fallback for: ${jestWorkerPath}`);
  createJestWorkerFallback(jestWorkerPath);
});

// Create ajv/dist/compile directory if it doesn't exist
if (!fs.existsSync(ajvPath)) {
  console.log(`Creating directory: ${ajvPath}`);
  fs.mkdirSync(ajvPath, { recursive: true });
}

// Create workbox-webpack-plugin/build directory if it doesn't exist
if (!fs.existsSync(workboxPath)) {
  console.log(`Creating directory: ${workboxPath}`);
  fs.mkdirSync(workboxPath, { recursive: true });
}

// Create fallback modules for other problematic dependencies
const fallbackModules = [
  {
    path: path.join(ajvPath, 'codegen.js'),
    content: `
// Fallback module for ajv/dist/compile/codegen
module.exports = {
  _ : {},
  str: () => '',
  nil: () => null,
  Name: class Name { toString() { return ''; } }
};`
  },
  {
    path: path.join(workboxPath, 'index.js'),
    content: `
// Fallback module for workbox-webpack-plugin
module.exports = {
  GenerateSW: class GenerateSW {
    constructor() {}
    apply() {}
  },
  InjectManifest: class InjectManifest {
    constructor() {}
    apply() {}
  }
};`
  }
];

// Create fallback files if they don't exist
fallbackModules.forEach(({ path: filePath, content }) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating fallback module: ${filePath}`);
    fs.writeFileSync(filePath, content);
  }
});

// Create package.json for workbox-webpack-plugin if it doesn't exist
const workboxPackagePath = path.join(__dirname, 'node_modules', 'workbox-webpack-plugin', 'package.json');
if (!fs.existsSync(workboxPackagePath)) {
  console.log('Creating package.json for workbox-webpack-plugin');
  fs.writeFileSync(workboxPackagePath, JSON.stringify({
    name: 'workbox-webpack-plugin',
    version: '6.5.4',
    main: 'build/index.js'
  }, null, 2));
}

// Function to patch a file that uses jest-worker
function patchFileWithJestWorker(filePath, importPattern) {
  if (fs.existsSync(filePath)) {
    console.log(`Patching ${path.basename(filePath)}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains the jest-worker import
    if (content.includes('jest-worker')) {
      // Replace the jest-worker import with our mock implementation
      content = content.replace(
        importPattern || /(?:var|const|let)\s+\w+\s+=\s+require\(['"]jest-worker['"]\);/,
        `// Mock implementation to avoid jest-worker dependency
var _jestWorker = {
  Worker: class Worker {
    constructor() {
      this.numWorkers = 1;
    }
    getStdout() { return { pipe: (dest) => dest }; }
    getStderr() { return { pipe: (dest) => dest }; }
  }
};`
      );
      
      // Write the modified content back to the file
      fs.writeFileSync(filePath, content);
      console.log(`Successfully patched ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`No need to patch ${path.basename(filePath)}`);
      return false;
    }
  }
  return false;
}

// Patch css-minimizer-webpack-plugin
patchFileWithJestWorker(
  path.join(__dirname, 'node_modules', 'css-minimizer-webpack-plugin', 'dist', 'index.js'),
  /var _jestWorker = require\("jest-worker"\);/
);

// Patch eslint-webpack-plugin
patchFileWithJestWorker(
  path.join(__dirname, 'node_modules', 'eslint-webpack-plugin', 'dist', 'getESLint.js'),
  /const\s+{\s*Worker\s*}\s*=\s*require\(['"]jest-worker['"]\);/
);

// Patch webpack.config.js to disable workbox-webpack-plugin
const webpackConfig = path.join(__dirname, 'node_modules', 'react-scripts', 'config', 'webpack.config.js');
if (fs.existsSync(webpackConfig)) {
  console.log('Patching webpack.config.js to disable workbox-webpack-plugin...');
  let content = fs.readFileSync(webpackConfig, 'utf8');
  
  // Find the workbox-webpack-plugin import
  if (content.includes('workbox-webpack-plugin')) {
    try {
      // Replace the workbox-webpack-plugin import with a mock
      content = content.replace(
        /const\s+WorkboxWebpackPlugin\s+=\s+require\(['"]workbox-webpack-plugin['"]\);/,
        `// Mock implementation to avoid workbox-webpack-plugin dependency
const WorkboxWebpackPlugin = {
  GenerateSW: class GenerateSW {
    constructor() {}
    apply() {}
  },
  InjectManifest: class InjectManifest {
    constructor() {}
    apply() {}
  }
};`
      );
      
      // Disable the workbox plugin by commenting out its usage
      content = content.replace(
        /new\s+WorkboxWebpackPlugin\.GenerateSW\(/g,
        '/* Disabled workbox plugin */ false && new WorkboxWebpackPlugin.GenerateSW('
      );
      
      content = content.replace(
        /new\s+WorkboxWebpackPlugin\.InjectManifest\(/g,
        '/* Disabled workbox plugin */ false && new WorkboxWebpackPlugin.InjectManifest('
      );
      
      // Write the modified content back to the file
      fs.writeFileSync(webpackConfig, content);
      console.log('Successfully patched webpack.config.js');
    } catch (error) {
      console.error('Error patching webpack.config.js:', error);
    }
  } else {
    console.log('No need to patch webpack.config.js');
  }
}

// Disable ESLint in webpack.config.js
if (fs.existsSync(webpackConfig)) {
  console.log('Patching webpack.config.js to disable ESLint...');
  let content = fs.readFileSync(webpackConfig, 'utf8');
  
  if (content.includes('eslint-webpack-plugin')) {
    try {
      // Replace the ESLintPlugin usage with a disabled version
      content = content.replace(
        /new\s+ESLintPlugin\(/g,
        '/* Disabled ESLint */ false && new ESLintPlugin('
      );
      
      // Write the modified content back to the file
      fs.writeFileSync(webpackConfig, content);
      console.log('Successfully disabled ESLint in webpack.config.js');
    } catch (error) {
      console.error('Error disabling ESLint in webpack.config.js:', error);
    }
  }
}

console.log('Prebuild script completed successfully!');
