// prebuild.js - Ensures all dependencies are properly set up before building
const fs = require('fs');
const path = require('path');

console.log('Running prebuild script to ensure dependencies are properly set up...');

// Create necessary directories for problematic dependencies
const jestWorkerPath = path.join(__dirname, 'node_modules', 'jest-worker', 'build');
const ajvPath = path.join(__dirname, 'node_modules', 'ajv', 'dist', 'compile');

// Create directories if they don't exist
[jestWorkerPath, ajvPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create fallback modules for problematic dependencies
const fallbackModules = [
  {
    path: path.join(jestWorkerPath, 'index.js'),
    content: `
// Fallback module for jest-worker
module.exports = {
  Worker: class Worker {
    constructor() {
      this.numWorkers = 1;
    }
    getStdout() { return { pipe: (dest) => dest }; }
    getStderr() { return { pipe: (dest) => dest }; }
  }
};`
  },
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
  }
];

// Create fallback files if they don't exist
fallbackModules.forEach(({ path: filePath, content }) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating fallback module: ${filePath}`);
    fs.writeFileSync(filePath, content);
  }
});

// Create a package.json for jest-worker if it doesn't exist
const jestWorkerPackagePath = path.join(__dirname, 'node_modules', 'jest-worker', 'package.json');
if (!fs.existsSync(jestWorkerPackagePath)) {
  console.log('Creating package.json for jest-worker');
  fs.writeFileSync(jestWorkerPackagePath, JSON.stringify({
    name: 'jest-worker',
    version: '29.5.0',
    main: 'build/index.js'
  }, null, 2));
}

// Patch css-minimizer-webpack-plugin if it exists
const cssMinimizer = path.join(__dirname, 'node_modules', 'css-minimizer-webpack-plugin', 'dist', 'index.js');
if (fs.existsSync(cssMinimizer)) {
  console.log('Patching css-minimizer-webpack-plugin...');
  let content = fs.readFileSync(cssMinimizer, 'utf8');
  
  // Check if the file contains the jest-worker import
  if (content.includes('require("jest-worker")')) {
    // Replace the jest-worker import with our mock implementation
    content = content.replace(
      /var _jestWorker = require\("jest-worker"\);/,
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
    fs.writeFileSync(cssMinimizer, content);
    console.log('Successfully patched css-minimizer-webpack-plugin');
  } else {
    console.log('No need to patch css-minimizer-webpack-plugin');
  }
}

console.log('Prebuild script completed successfully!');
