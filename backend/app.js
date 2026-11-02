// ======================================
// IMPORTS
// ======================================

const express = require("express");
const cors = require("cors");

// ======================================
// ROUTES
// ======================================

const routingRoutes = require("./src/routes/routingRoutes.js");

const addressRoutes = require("./src/routes/addressRoutes.js");

const authRoutes = require("./src/routes/authRoutes.js");

const menuItemRoutes = require("./src/routes/menuItemRoutes.js");

const favouriteRoutes = require("./src/routes/favouriteRoutes.js");

const restaurantRoutes = require("./src/routes/restaurantRoutes.js");

const orderRoutes = require("./src/routes/orderRoutes.js");

const paymentRoutes = require("./src/routes/paymentRoutes.js");

const orderItemRoutes = require("./src/routes/orderItemRoutes.js");

const mapRoutes = require("./src/routes/mapRoutes.js");

const searchRoutes = require("./src/routes/searchRoutes.js");

// ======================================
// MIDDLEWARE
// ======================================

const rateLimitMiddleware = require("./src/middleware/rateLimitMiddleware.js");

// ======================================
// CREATE EXPRESS APPLICATION
// ======================================

const app = express();

// ======================================
// CORS
// ======================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    credentials: true,
  }),
);

// ======================================
// JSON MIDDLEWARE
// ======================================

app.use(express.json());

// ======================================
// RATE LIMITING
// ======================================

app.use(rateLimitMiddleware);

// ======================================
// ROOT TEST ROUTE
// ======================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Dish Dash Platform API is running",
  });
});

// ======================================
// API TEST ROUTE
// ======================================

app.get("/api/test", (req, res) => {
  return res.status(200).json({
    message: "Backend connected successfully",
  });
});

// ======================================
// ADDRESSES
// ======================================

app.use("/api/addresses", addressRoutes);

// ======================================
// AUTHENTICATION
// ======================================

app.use("/api/auth", authRoutes);

// ======================================
// MENU ITEMS
// ======================================

app.use("/api/menuItems", menuItemRoutes);

// ======================================
// RESTAURANTS
// ======================================

app.use("/api/restaurant", restaurantRoutes);

// ======================================
// ORDERS
// ======================================

app.use("/api/order", orderRoutes);

// ======================================
// SEARCH
// ======================================

// Example:
// GET /api/search?q=burger

app.use("/api/search", searchRoutes);

// ======================================
// PAYMENTS
// ======================================

app.use("/api/payment", paymentRoutes);

// ======================================
// ORDER ITEMS
// ======================================

app.use("/api/orderItem", orderItemRoutes);

// ======================================
// ROUTING / DISTANCE
// ======================================

app.use("/api/favourite", favouriteRoutes);

// ======================================
// ROUTING / DISTANCE
// ======================================

app.use("/api/routes", routingRoutes);

// ======================================
// MAPS
// ======================================

app.use("/api/maps", mapRoutes);

// ======================================
// 404 API ROUTE
// ======================================

// Any /api route that reaches this point
// does not exist.

app.use("/api", (req, res) => {
  return res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================================
// EXPORT APP
// ======================================

module.exports = app;
