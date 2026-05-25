# Woveena - E-Commerce Application

A full-stack e-commerce application built with Node.js/Express backend and React frontend.

## Project Structure

```
├── Backend/                 # Node.js/Express server
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── utils/          # Helper functions
│   │   └── db/             # Database connection
│   ├── .env                # Environment variables
│   ├── .env.example        # Environment template
│   └── package.json
│
└── frontend/                # React + Vite app
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── context/        # Context providers
    │   └── api.js          # API client
    ├── .env.example        # Environment template
    └── package.json
```

## Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB Atlas account (for remote DB)

## Setup Instructions

### 1. Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file (copy from `.env.example`):
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file:
```
VITE_API_BASE_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user
- `GET /api/users/verify` - Verify authentication
- `GET /api/users/me` - Get user profile
- `PUT /api/users/profile` - Update profile

### Products (Public)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details

### Cart (Protected)
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/:productId` - Update cart item
- `DELETE /api/cart/:productId` - Remove from cart

### Orders (Protected)
- `GET /api/order` - Get user orders
- `POST /api/order` - Create order
- `GET /api/order/:id` - Get order details

### Admin Routes (Protected - Admin only)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/products` - List products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List orders
- `PUT /api/admin/orders/:id/status` - Update order status

## Security Features

✅ **Implemented:**
- Environment variables for sensitive data (.env)
- Password hashing with bcryptjs
- Session-based authentication
- Protected routes with middleware
- Admin role-based access control
- CORS configuration for frontend
- HttpOnly cookies for session tokens

✅ **Important:**
- Never commit `.env` file (added to .gitignore)
- Cloudinary credentials stored in environment variables
- MongoDB credentials in connection string
- Use `.env.example` for configuration template

## Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "customer" | "admin",
  phone: String,
  address: { street, city, country, zipCode },
  isActive: Boolean
}
```

### Product
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  images: [String] (Cloudinary URLs)
}
```

### Order
```javascript
{
  orderId: String (unique),
  user: ObjectId,
  items: [{productId, name, price, image, quantity}],
  shippingAddress: {street, city, country, zipCode, phone},
  paymentMethod: String,
  totalAmount: Number,
  shippingCharges: Number,
  taxAmount: Number,
  finalAmount: Number,
  orderStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled"
}
```

## Features

- User authentication and profile management
- Product catalog with filtering
- Shopping cart functionality
- Order management
- Admin dashboard
- Product management (CRUD)
- Order tracking
- Image upload to Cloudinary

## Development Notes

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`
- Vite proxy forwards `/api` and `/uploads` to backend
- Session tokens stored as HttpOnly cookies (secure)
- Database: MongoDB Atlas

## Troubleshooting

**CORS Issues?**
- Check allowed origins in `Backend/src/app.js`
- Ensure frontend URL is in the whitelist

**MongoDB Connection Failed?**
- Verify MONGO_URI in .env
- Check MongoDB Atlas IP whitelist
- Ensure credentials are URL-encoded

**Image Upload Not Working?**
- Verify Cloudinary credentials in .env
- Check API key and secret are correct
- Ensure CLOUDINARY_CLOUD_NAME is set

**Sessions Not Persisting?**
- Sessions are in-memory (clear on server restart)
- For production, implement Redis or database sessions
- Check HttpOnly cookie settings

## Future Improvements

- [ ] Implement persistent session storage (Redis)
- [ ] Add email verification
- [ ] Implement password reset
- [ ] Add payment gateway integration
- [ ] Implement review and rating system
- [ ] Add wishlist feature
- [ ] Implement search and advanced filtering
- [ ] Add email notifications
