// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  let token = req.header('x-auth-token');
  
  // Check for Bearer token in Authorization header
  const authHeader = req.header('Authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Log auth attempt for debugging
  console.log('Auth middleware:', {
    hasToken: !!token,
    url: req.originalUrl,
    method: req.method
  });

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      error: 'Authorization error, token not found' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    
    // Log success for debugging
    console.log('Authentication successful for user:', req.user.id);
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
};
