// ======================================
// IMPORTS
// ======================================

const express = require("express");

const router = express.Router();

// ======================================
// CONTROLLER
// ======================================

const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  confirmOrder,
  deleteOrder,
} = require("../controllers/orderController");

// ======================================
// AUTH MIDDLEWARE
// ======================================
//
// Change the path/name below if your
// authentication middleware has a
// different filename.
//
// It must populate:
//
// req.user
//
// Example:
//
// req.user = {
//   id: "...",
//   role: "customer"
// };
//
// ======================================

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// TEST ROUTE
// ======================================
//
// Public test route.
// No customer information is returned.
// ======================================

router.get("/test", (req, res) => {
  res.status(200).json({
    message: "Order routes working",
  });
});

// ======================================
// CREATE ORDER
// ======================================
//
// POST /api/order
//
// Creates the order immediately as:
//
// status = pending_confirmation
//
// editable_until = now + 10 seconds
//
// ======================================

router.post("/", authMiddleware, createOrder);

// ======================================
// GET CURRENT CUSTOMER'S ORDERS
// ======================================
//
// GET /api/order
//
// Controller should only return orders
// where:
//
// customer_id === req.user.id
//
// ======================================

router.get("/", authMiddleware, getOrders);

// ======================================
// CONFIRM ORDER
// ======================================
//
// POST /api/order/:id/confirm
//
// Called when the 10-second edit window
// reaches zero.
//
// pending_confirmation
//          ↓
//      confirmed
//
// IMPORTANT:
// Keep this before the generic /:id
// routes for clarity.
//
// ======================================

router.post("/:id/confirm", authMiddleware, confirmOrder);

// ======================================
// GET ONE ORDER
// ======================================
//
// GET /api/order/:id
//
// Only returns the order if it belongs
// to the logged-in customer.
//
// ======================================

router.get("/:id", authMiddleware, getOrder);

// ======================================
// UPDATE ORDER
// ======================================
//
// PUT /api/order/:id
//
// Only allowed while:
//
// status === pending_confirmation
//
// AND
//
// editable_until > now
//
// ======================================

router.put("/:id", authMiddleware, updateOrder);

// ======================================
// PATCH ORDER
// ======================================
//
// Optional, but useful when updating only
// part of an order during the edit window.
//
// ======================================

router.patch("/:id", authMiddleware, updateOrder);

// ======================================
// DELETE ORDER
// ======================================
//
// DELETE /api/order/:id
//
// With the controller we created,
// deletion is only allowed while the
// order is still inside its edit window.
//
// Later this should normally become an
// order cancellation rather than physical
// deletion.
//
// ======================================

router.delete("/:id", authMiddleware, deleteOrder);

// ======================================
// EXPORT
// ======================================

module.exports = router;
