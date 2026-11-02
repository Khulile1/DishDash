// ======================================
// IMPORTS
// ======================================

const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getRestaurantRoute,
  getRestaurantDistances,
  getDeliveryQuote,
} = require("../controllers/routingController");

// ======================================
// ROUTER
// ======================================

const router = express.Router();

// ======================================
// ALL RESTAURANT DISTANCES
// ======================================

// GET /api/routes/restaurants

router.get("/restaurants", authMiddleware, getRestaurantDistances);

// ======================================
// ONE RESTAURANT ROUTE
// ======================================

// GET /api/routes/restaurant/:restaurantId

router.get("/restaurant/:restaurantId", authMiddleware, getRestaurantRoute);

// ======================================
// DELIVERY QUOTE
// ======================================

// POST /api/routes/delivery-quote

router.post("/delivery-quote", authMiddleware, getDeliveryQuote);

// ======================================
// EXPORT
// ======================================

module.exports = router;
