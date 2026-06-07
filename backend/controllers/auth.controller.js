const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.create({ name, email, password });
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { _id: user._id, name: user.name, email: user.email },
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error('[Auth Controller] Register error:', error);
    res.status(500).json({ success: false, message: 'Server currently unavailable. Please try again.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: { _id: user._id, name: user.name, email: user.email },
        token: accessToken,
        refreshToken: refreshToken
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth Controller] Login error:', error);
    res.status(500).json({ success: false, message: 'Server currently unavailable. Please try again.' });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Session user no longer exists.' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id); // Rotate refresh token for maximum security

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('[Auth Controller] Refresh error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token. Please sign in again.' });
  }
};

exports.logout = (req, res) => {
  // Client should discard the tokens
  res.json({ success: true, message: 'Logged out successfully' });
};