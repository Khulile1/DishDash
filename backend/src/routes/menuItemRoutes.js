// ======================================
// IMPORTS
// ======================================

const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ======================================
// ROUTER
// ======================================

const router = express.Router();

// ======================================
// CONTROLLER FUNCTIONS
// ======================================

const {
  createMenuItem,
  getMenuItems,
  getMyMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItems,

  // ======================================
  // INVENTORY
  // ======================================

  updateStock,
  increaseStock,
  decreaseStock,
} = require("../controllers/menuItemController");

// ======================================
// TEST ROUTE
// ======================================

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Menu item routes working",
  });
});

// ======================================
// SEARCH MENU ITEMS
// ======================================

// Example:
// GET /api/menuItems/search?q=burger

router.get("/search", searchMenuItems);

// ======================================
// GET LOGGED-IN RESTAURANT MENU
// ======================================

// GET /api/menuItems/my-menu
//
// This route uses the JWT to identify
// the logged-in restaurant owner.
//
// It MUST come before /:id.

router.get(
  "/my-menu",
  authMiddleware,
  roleMiddleware("restaurant"),
  getMyMenuItems,
);

// ======================================
// CREATE MENU ITEM
// ======================================

// POST /api/menuItems
//
// Only logged-in restaurant users
// should be allowed to create menu items.

router.post("/", authMiddleware, roleMiddleware("restaurant"), createMenuItem);

// ======================================
// GET ALL MENU ITEMS
// ======================================

// GET /api/menuItems
//
// Customers can use this endpoint
// to view menu items.

router.get("/", getMenuItems);

// ======================================
// INVENTORY - SET STOCK
// ======================================

// PATCH /api/menuItems/:id/stock

router.patch(
  "/:id/stock",
  authMiddleware,
  roleMiddleware("restaurant"),
  updateStock,
);

// ======================================
// INVENTORY - INCREASE STOCK
// ======================================

// PATCH /api/menuItems/:id/stock/increase

router.patch(
  "/:id/stock/increase",
  authMiddleware,
  roleMiddleware("restaurant"),
  increaseStock,
);

// ======================================
// INVENTORY - DECREASE STOCK
// ======================================

// PATCH /api/menuItems/:id/stock/decrease

router.patch(
  "/:id/stock/decrease",
  authMiddleware,
  roleMiddleware("restaurant"),
  decreaseStock,
);

// ======================================
// GET ONE MENU ITEM
// ======================================

// GET /api/menuItems/:id

router.get("/:id", getMenuItem);

// ======================================
// UPDATE MENU ITEM
// ======================================

// PUT /api/menuItems/:id

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant"),
  updateMenuItem,
);

// ======================================
// DELETE MENU ITEM
// ======================================

// DELETE /api/menuItems/:id

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant"),
  deleteMenuItem,
);

// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;
