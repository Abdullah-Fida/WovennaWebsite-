// utils/sessionStore.js
const jwt = require('jsonwebtoken');

const createSession = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '1d',
  });
};

const getSession = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    return {
      userId: decoded.userId,
    };
  } catch (error) {
    return null;
  }
};

const deleteSession = (token) => {
  // JWTs are stateless, so we let the client clear the cookie.
};

module.exports = {
  createSession,
  getSession,
  deleteSession
};