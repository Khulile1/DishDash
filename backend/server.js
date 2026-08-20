// Import required libraries
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Database
const connectDB = require("./src/config/db.js");

// Routes
const authRoutes = require("./src/routes/authRoutes.js");
const menuItemRoutes = require("./src/routes/menuItemRoutes.js");
const restaurantRoute = require("./src/routes/restaurantRoute.js");
const orderRoutes = require("./src/routes/orderRoutes.js");
const paymentRoutes = require("./src/routes/paymentRoutes.js");
const orderItemRoutes = require("./src/routes/orderItemRoutes.js");

// Middleware
const rateLimitMiddleware = require("./src/middleware/rateLimitMiddleware.js");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express application
const app = express();

// ==============================
// CORS
// ==============================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// ==============================
// JSON MIDDLEWARE
// ==============================

app.use(express.json());

// ==============================
// RATE LIMITING
// ==============================

// app.use(rateLimitMiddleware);

// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "Local Bite Backend API is running",
  });
});

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);

app.use("/api/menuItems", menuItemRoutes);

app.use("/api/restaurant", restaurantRoute);

app.use("/api/order", orderRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/orderItem", orderItemRoutes);

// ==============================
// PORT
// ==============================

const PORT = process.env.PORT || 5000;

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
