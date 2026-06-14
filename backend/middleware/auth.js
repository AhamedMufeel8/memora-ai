const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      console.log('[JWT] Verifying incoming Authorization header token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Standardization: Support both legacy 'userId' and standard 'id' claims
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        console.warn('[JWT] Token verification rejected: claims missing both "id" and "userId".');
        return res.status(401).json({ success: false, message: 'Not authorized, token payload invalid' });
      }

      console.log('[MONGODB] Querying database for user by token ID:', userId);
      req.user = await User.findById(userId).select('-password');
      if (!req.user) {
        console.warn('[MONGODB] Authorization failed: user no longer exists for ID:', userId);
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Standardize request user properties: ensure both req.user.userId and req.user._id exist and point to the same ID
      req.user.userId = req.user._id;

      console.log(`[JWT] Authorization verified successfully. User: ${req.user.email} (ID: ${req.user._id})`);
      next();
    } catch (error) {
      console.error('[JWT] Token decoding or verification exception:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  } else {
    console.warn('[JWT] Request denied: missing Bearer token authorization header.');
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`[JWT] Authorization rejected: user role (${req.user ? req.user.role : 'none'}) is not permitted.`);
      return res.status(403).json({ success: false, message: 'User role not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };