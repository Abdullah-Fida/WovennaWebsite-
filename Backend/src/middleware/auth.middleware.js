// middleware/auth.middleware.js
const asyncHandler = require('express-async-handler');
const { getSession } = require('../utils/sessionStore');
const User = require('../models/user.model');

const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.sessionToken;

  // Also check Authorization header as fallback
  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify session from session store
    const session = getSession(token);
    if (!session) {
      res.status(401);
      throw new Error('Not authorized, invalid session');
    }

    // Get user from database
    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

module.exports = { protect };