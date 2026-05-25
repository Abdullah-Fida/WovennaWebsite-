const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // ✅ added

// Initialize app
const app = express();

// Middlewares
app.use(express.json()); // Parse JSON
// Allow frontend dev servers (both common Vite ports) to make credentialed requests
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // allow cookies to be sent
}));
app.use(cookieParser()); // ✅ parse cookies
app.use(morgan("dev"));

// Routes
const userRoutes = require("./routes/user.routes.js");
app.use("/api/users", userRoutes);

const cartRoutes = require("./routes/cart.routes.js");
app.use("/api/cart", cartRoutes);

const orderRoutes = require("./routes/order.routes.js");
app.use("/api/order", orderRoutes);

// public product routes
const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);
// serve uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// admin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Centralized error handler - always return JSON for errors
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
