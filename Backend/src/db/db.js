const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Fail fast if Mongo isn't reachable (helps avoid "hanging" on startup)
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
