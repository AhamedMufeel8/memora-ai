const express = require('express');
const jwt = require('jsonwebtoken');
const { getAuth } = require('../config/firebase');
const User = require('../models/User');

const router = express.Router();

router.post('/google', async (req, res) => {
  console.log("[GOOGLE_AUTH] POST /api/auth/google hit. Processing Google Identity payload.");
  try {
    const { token } = req.body;

    if (!token) {
      console.warn('[GOOGLE_AUTH] Rejected: token payload is missing from request body.');
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    console.log('[FIREBASE] Calling Firebase Admin verifyIdToken...');
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email;
    
    // Defensive check: Fallback to email prefix if user's Google profile name is undefined/null
    const name = decodedToken.name || (email ? email.split('@')[0] : 'Google User');
    const picture = decodedToken.picture || '';
    
    console.log('[FIREBASE] verifyIdToken succeeded. Email:', email, 'Name:', name);

    if (!email) {
      console.error('[GOOGLE_AUTH] Firebase verified token, but email is missing from payload.');
      return res.status(400).json({ success: false, message: 'Google account is missing email address.' });
    }

    console.log('[MONGODB] Performing user lookup for email:', email);
    let user = await User.findOne({ email });

    if (!user) {
      console.log('[MONGODB] User not found (Case B). Creating new user with authProvider: "google"');
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        profileImage: picture,
        xp: 0,
        streak: 0
      });
      console.log('[MONGODB] User created successfully. ID:', user._id);
    } else {
      console.log('[MONGODB] User already exists (Case C). ID:', user._id);
      
      // Case A: If user exists via email/password, link Google to it by updating provider and details
      let modified = false;
      if (user.authProvider !== 'google') {
        console.log(`[MONGODB] Account conflict found (Case A). Linking local account (${user.authProvider}) to Google provider.`);
        user.authProvider = 'google';
        modified = true;
      }
      
      if (picture && user.profileImage !== picture) {
        user.profileImage = picture;
        modified = true;
      }
      
      if (modified) {
        await user.save();
        console.log('[MONGODB] Existing user updated and saved successfully.');
      }
    }

    console.log('[JWT] Generating access and refresh tokens...');
    
    // Access token (15m expiry, matches auth.controller.js)
    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Refresh token (7d expiry, matches auth.controller.js)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key',
      { expiresIn: '7d' }
    );

    console.log('[JWT] JWT tokens signed. Google login sequence successfully completed.');

    return res.json({
      success: true,
      token: jwtToken,
      refreshToken: refreshToken,
      data: user
    });

  } catch (error) {
    console.error('================================');
    console.error('[GOOGLE_AUTH] ERROR ENCOUNTERED');
    console.error('================================');
    console.error(error);
    
    try {
      const fs = require('fs');
      const path = require('path');
      const logMessage = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
      fs.appendFileSync(path.join(__dirname, '../error.log'), logMessage);
    } catch (fsErr) {
      console.error('Failed to write to error.log', fsErr);
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
});

module.exports = router;