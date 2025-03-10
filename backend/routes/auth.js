// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  console.log('Register request received:', req.body);
  
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name, email, password: !!password });
      return res.status(400).json({ 
        error: 'Please fill in all fields' 
      });
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }

    // Check password strength
    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({
        error: 'This email is already registered'
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();
    console.log('User saved successfully:', user.id);

    // Create token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign error:', err);
          throw err;
        }
        res.json({ token });
      }
    );

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      error: 'An error occurred during registration',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', async (req, res) => {
  console.log('Login request received:', { 
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin || 'not provided'
    }
  });
  
  try {
    // Log the raw request body for debugging
    console.log('Raw request body:', typeof req.body, req.body);
    
    // Handle different request body formats
    let email, password;
    
    if (typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        email = parsedBody.email;
        password = parsedBody.password;
      } catch (e) {
        console.error('Failed to parse JSON body:', e);
      }
    } else if (req.body && typeof req.body === 'object') {
      email = req.body.email;
      password = req.body.password;
    }
    
    console.log('Extracted credentials:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });

    // Validate input
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        error: 'Please fill in all fields',
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({
        error: 'Invalid credentials',
        message: 'The email or password you entered is incorrect'
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({
        error: 'Invalid credentials',
        message: 'The email or password you entered is incorrect'
      });
    }

    // Create token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign error:', err);
          throw err;
        }
        
        // Log successful login
        console.log('Login successful for:', email);
        
        // Return token with user info
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    );

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'An error occurred during login',
      message: 'Server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    console.log('User data request for ID:', req.user.id);
    
    // Get user data (exclude password)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found in database:', req.user.id);
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user could not be found in the database'
      });
    }
    
    console.log('User data retrieved successfully for:', user.email);
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'An error occurred while getting user information',
      message: 'Server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET /api/auth/status
// @desc    Get auth system status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    // Get total user count
    const userCount = await User.countDocuments();
    
    // Get last registered user (masked email)
    const lastUser = await User.findOne().sort({ createdAt: -1 }).select('email createdAt');
    
    let maskedEmail = null;
    if (lastUser) {
      const [username, domain] = lastUser.email.split('@');
      maskedEmail = `${username[0]}${'*'.repeat(username.length - 2)}${username.slice(-1)}@${domain}`;
    }

    res.json({
      status: 'active',
      userCount,
      lastRegistration: lastUser ? {
        email: maskedEmail,
        time: lastUser.createdAt
      } : null
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({
      error: 'An error occurred while checking system status'
    });
  }
});

// @route   GET /api/auth/test
// @desc    Test endpoint for CORS and connectivity
// @access  Public
router.get('/test', (req, res) => {
  console.log('Test endpoint accessed');
  console.log('Headers:', req.headers);
  
  res.json({
    message: 'API test successful',
    time: new Date().toISOString(),
    headers: {
      origin: req.headers.origin || 'not provided',
      'content-type': req.headers['content-type'] || 'not provided',
      'user-agent': req.headers['user-agent'] || 'not provided'
    }
  });
});

// @route   POST /api/auth/test-post
// @desc    Test POST endpoint for CORS and body parsing
// @access  Public
router.post('/test-post', (req, res) => {
  console.log('Test POST endpoint accessed');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  
  res.json({
    message: 'API POST test successful',
    time: new Date().toISOString(),
    receivedData: req.body,
    receivedDataType: typeof req.body,
    headers: {
      origin: req.headers.origin || 'not provided',
      'content-type': req.headers['content-type'] || 'not provided',
      'user-agent': req.headers['user-agent'] || 'not provided'
    }
  });
});

module.exports = router;
