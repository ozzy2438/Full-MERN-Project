// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS settings - Allow all origins
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false, // Set to false when using '*' for origin
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Special middleware for CORS Pre-flight OPTIONS
app.options('*', cors());

// CORS debugging middleware
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Log request details for debugging
  console.log('CORS Request:', {
    origin: req.headers.origin || 'No Origin',
    method: req.method,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Not Present',
      'x-auth-token': req.headers['x-auth-token'] ? 'Present' : 'Not Present'
    }
  });
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb', strict: false }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Raw body parser for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/auth/login')) {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      console.log('Raw request data:', data);
      try {
        if (data && typeof req.body !== 'object') {
          req.rawBody = data;
          try {
            req.body = JSON.parse(data);
            console.log('Parsed JSON body:', req.body);
          } catch (e) {
            console.error('Failed to parse JSON:', e);
          }
        }
      } catch (e) {
        console.error('Error processing raw body:', e);
      }
      next();
    });
  } else {
    next();
  }
});

// Create uploads folder and serve it statically
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CareerLens API is running',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/jobs',
      '/api/applications',
      '/api/upload',
      '/api/analyze',
      '/api/jobSearch'
    ]
  });
});

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

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS enabled for all origins');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
