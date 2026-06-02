const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
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
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { _id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id)
    });
  } catch (error) {
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
      res.json({
        success: true,
        message: 'Logged in successfully',
        data: { _id: user._id, name: user.name, email: user.email },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server currently unavailable. Please try again.' });
  }
};

exports.logout = (req, res) => {
  // Client should discard the token
  res.json({ success: true, message: 'Logged out successfully' });
};