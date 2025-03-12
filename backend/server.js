// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS settings
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'https://full-mern-project.onrender.com', 'https://full-mern-project-frontend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Special middleware for CORS Pre-flight OPTIONS
app.options('*', cors());

// CORS debugging middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create uploads folder and serve it statically
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Routes
const uploadRouter = require('./routes/upload');
const analyzeRouter = require('./routes/analyze');
const jobsRouter = require('./routes/jobs');
const applicationsRouter = require('./routes/applications');
const authRouter = require('./routes/auth');
const jobSearchRouter = require('./routes/jobSearch');

app.use('/api/upload', uploadRouter);
app.use('/api/jobSearch', jobSearchRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/auth', authRouter);

// MongoDB connection
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

const PORT = process.env.PORT || 5005;

// Function to start the server with port fallback
const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .on('listening', () => {
        console.log(`Server running on port ${port}`);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('CORS enabled for:', ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'https://full-mern-project.onrender.com', 'https://full-mern-project-frontend.onrender.com']);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use`);
          reject(err);
        } else {
          console.error(`Error starting server on port ${port}:`, err);
          reject(err);
        }
      });
  });
};

// Try to start the server with port fallback
(async function() {
  let server = null;
  let currentPort = PORT;
  
  // Try the default port first
  try {
    server = await startServer(currentPort);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      // Try alternative ports if the default is in use
      console.log(`Port ${currentPort} is already in use, trying alternative ports...`);
      
      for (let altPort = 5002; altPort < 5010; altPort++) {
        try {
          server = await startServer(altPort);
          break; // Break the loop if server starts successfully
        } catch (err) {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${altPort} is also in use, trying next...`);
          } else {
            console.error(`Error starting server on port ${altPort}:`, err);
          }
        }
      }
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
  
  if (!server) {
    console.error('Could not find an available port. Please close other applications using these ports and try again.');
    process.exit(1);
  }
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
})();
