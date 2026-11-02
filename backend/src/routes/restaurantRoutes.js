// ======================================
// IMPORTS
// ======================================

const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createRestaurant,
  getRestaurants,
  getMyRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");

// ======================================
// ROUTER
// ======================================

const router = express.Router();

// ======================================
// CREATE RESTAURANT
// RESTAURANT OWNER ONLY
// ======================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("restaurant"),
  createRestaurant,
);

// ======================================
// GET ALL RESTAURANTS
// CUSTOMER SIDE
// ======================================

router.get("/", getRestaurants);

// ======================================
// GET LOGGED-IN OWNER'S RESTAURANTS
// ======================================
//
// IMPORTANT:
//
// Keep this BEFORE "/:id".
//
// Otherwise Express may interpret
// "my-restaurants" as a restaurant ID.
//
// ======================================

router.get(
  "/my-restaurants",
  authMiddleware,
  roleMiddleware("restaurant"),
  getMyRestaurants,
);

// ======================================
// GET ONE RESTAURANT
// CUSTOMER SIDE
// ======================================

router.get("/:id", getRestaurant);

// ======================================
// UPDATE RESTAURANT
// OWNER ONLY
// ======================================
//
// opening_time and closing_time are
// updated through this endpoint:
//
// PUT /api/restaurant/:id
//
// ======================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant"),
  updateRestaurant,
);

// ======================================
// DELETE RESTAURANT
// OWNER ONLY
// ======================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant"),
  deleteRestaurant,
);

// ======================================
// EXPORT
// ======================================

module.exports = router;
