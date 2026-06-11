const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // ✅ added

// Initialize app
const app = express();

// Middlewares
app.use(express.json()); // Parse JSON

// CORS — reads allowed origins at request time so env vars are always available
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development, allow all localhost origins automatically
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
    }

    // Build list of allowed origins from environment variables
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_2,
    ]
      .filter(Boolean)
      .map(url => url.replace(/\/$/, '')); // strip trailing slashes

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true // allow cookies to be sent
}));
app.use(cookieParser()); // ✅ parse cookies
app.use(morgan("dev"));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running correctly!' });
});

// Root Route (so you don't see "Cannot GET /" if you visit localhost:5000 directly)
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the Woveena API! The backend is running correctly.');
});

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

// contact routes
const contactRoutes = require('./routes/contact.routes');
app.use('/api/contact', contactRoutes);

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
