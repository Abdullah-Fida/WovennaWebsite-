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

// promo routes (public validation)
const promoRoutes = require('./routes/promo.routes');
app.use('/api/promos', promoRoutes);

// influencer program (public gallery + member routes)
const influencerRoutes = require('./routes/influencer.routes');
app.use('/api/influencers', influencerRoutes);

// admin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Centralized error handler - always return JSON for errors
app.use((err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Turn Mongoose failures into messages an admin can act on, instead of
  // surfacing them as an opaque "error saving product".
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'That record already exists';
  }

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
