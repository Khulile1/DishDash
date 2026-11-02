const express = require("express");

const router = express.Router();

const {
  createAddress,
  getAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// TEST ROUTE
// ======================================

// Keep this unprotected so we can test
// whether Express mounted the route correctly
router.get("/test", (req, res) => {
  res.status(200).json({
    message: "Address routes working",
  });
});

// ======================================
// ADDRESS ROUTES
// ======================================

// Create address
router.post("/", authMiddleware, createAddress);

// Get logged-in user's addresses
router.get("/", authMiddleware, getAddresses);

// Get one address
router.get("/:id", authMiddleware, getAddress);

// Update address
router.put("/:id", authMiddleware, updateAddress);

// Delete address
router.delete("/:id", authMiddleware, deleteAddress);

module.exports = router;
