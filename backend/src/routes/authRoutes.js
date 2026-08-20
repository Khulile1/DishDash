// Import Express
const express = require("express");

// Import controller functions
const { register, login } = require("../controllers/authController");

// Import middleware
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const loginRateLimitMiddleware = require("../middleware/loginRateLimitMiddleware");

// Create router
const router = express.Router();

// ==============================
// PUBLIC ROUTES
// ==============================

// Register
router.post("/register", register);

// Login
router.post("/login", loginRateLimitMiddleware, login);

// ==============================
// PROTECTED ROUTES
// ==============================

// Test authentication
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Auth middleware is working",
    user: req.user,
  });
});

// Admin only
router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({
      message: "Admin access granted",
      user: req.user,
    });
  },
);

// Customer only
router.get(
  "/customer-only",
  authMiddleware,
  roleMiddleware("customer"),
  (req, res) => {
    res.json({
      message: "Customer access granted",
      user: req.user,
    });
  },
);

// Driver only
router.get(
  "/driver-only",
  authMiddleware,
  roleMiddleware("driver"),
  (req, res) => {
    res.json({
      message: "Driver access granted",
      user: req.user,
    });
  },
);

// Restaurant only
router.get(
  "/restaurant-only",
  authMiddleware,
  roleMiddleware("restaurant"),
  (req, res) => {
    res.json({
      message: "Restaurant access granted",
      user: req.user,
    });
  },
);

// Export router
module.exports = router;
