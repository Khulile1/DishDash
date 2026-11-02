// ======================================
// IMPORTS
// ======================================

const express = require("express");

const router = express.Router();

// ======================================
// CONTROLLER
// ======================================

const {
  createOrderItem,
  getOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem,
} = require("../controllers/orderItemController");

// ======================================
// AUTH MIDDLEWARE
// ======================================
//
// Change this path/name if your existing
// authentication middleware has a
// different filename.
//
// The middleware must populate:
//
// req.user
//
// Example:
//
// req.user = {
//   id: "..."
// };
//
// ======================================

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// TEST ROUTE
// ======================================
//
// This can remain public because it
// doesn't expose any customer data.
// ======================================

router.get("/test", (req, res) => {
  res.status(200).json({
    message: "Order item routes working",
  });
});

// ======================================
// GET ORDER ITEMS
// ======================================
//
// Example:
//
// GET /api/order-items?orderId=123
//
// The controller checks that the order
// belongs to the logged-in customer.
// ======================================

router.get("/", authMiddleware, getOrderItems);

// ======================================
// GET ONE ORDER ITEM
// ======================================
//
// GET /api/order-items/:id
// ======================================

router.get("/:id", authMiddleware, getOrderItem);

// ======================================
// CREATE ORDER ITEM
// ======================================
//
// POST /api/order-items
//
// Only works while:
//
// status === "pending_confirmation"
//
// AND
//
// editable_until > current time
//
// ======================================

router.post("/", authMiddleware, createOrderItem);

// ======================================
// UPDATE ORDER ITEM
// ======================================
//
// PUT /api/order-items/:id
//
// Primarily used to change quantity
// during the 10-second edit window.
// ======================================

router.put("/:id", authMiddleware, updateOrderItem);

// ======================================
// PATCH ORDER ITEM
// ======================================
//
// Allows you to use PATCH from the
// frontend when only changing quantity.
//
// Example:
//
// PATCH /api/order-items/123
//
// {
//   "quantity": 3
// }
//
// ======================================

router.patch("/:id", authMiddleware, updateOrderItem);

// ======================================
// DELETE ORDER ITEM
// ======================================
//
// DELETE /api/order-items/:id
//
// Only allowed during the edit window.
// ======================================

router.delete("/:id", authMiddleware, deleteOrderItem);

// ======================================
// EXPORT
// ======================================

module.exports = router;
