// utils/sessionStore.js
const sessions = new Map();

const createSession = (userId) => {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.set(token, {
    userId,
    createdAt: Date.now()
  });
  return token;
};

const getSession = (token) => {
  return sessions.get(token);
};

const deleteSession = (token) => {
  sessions.delete(token);
};

// Optional: Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = {
  createSession,
  getSession,
  deleteSession
};