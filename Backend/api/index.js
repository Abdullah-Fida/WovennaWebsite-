const app = require('../src/app.js');
const mongoose = require('mongoose');
const connectDB = require('../src/db/db.js');

module.exports = async (req, res) => {
  // Prevent multiple database connections in a serverless environment
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  
  // Pass the request to the Express app
  return app(req, res);
};
