
const express = require('express');
const router = express.Router();
const { getDashboard, getProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
router.get('/profile', protect, getProfile);
router.get('/dashboard', protect, getDashboard);
module.exports = router;
