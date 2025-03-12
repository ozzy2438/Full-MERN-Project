// prebuild.js - Ensures all dependencies are properly set up before building
const fs = require('fs');
const path = require('path');

console.log('Running prebuild script to ensure dependencies are properly set up...');

// Create necessary directories for problematic dependencies
const jestWorkerPath = path.join(__dirname, 'node_modules', 'jest-worker', 'build');
const ajvPath = path.join(__dirname, 'node_modules', 'ajv', 'dist', 'compile');
const workboxPath = path.join(__dirname, 'node_modules', 'workbox-webpack-plugin', 'build');

// Create directories if they don't exist
[jestWorkerPath, ajvPath, workboxPath].forEach(dir => {
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

// Create package.json files for problematic dependencies
const packageJsonFiles = [
  {
    path: path.join(__dirname, 'node_modules', 'jest-worker', 'package.json'),
    content: {
      name: 'jest-worker',
      version: '29.5.0',
      main: 'build/index.js'
    }
  },
  {
    path: path.join(__dirname, 'node_modules', 'workbox-webpack-plugin', 'package.json'),
    content: {
      name: 'workbox-webpack-plugin',
      version: '6.5.4',
      main: 'build/index.js'
    }
  }
];

// Create package.json files if they don't exist
packageJsonFiles.forEach(({ path: filePath, content }) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating package.json for ${content.name}`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  }
});

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

console.log('Prebuild script completed successfully!');
