const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyFavourites,
  addFavourite,
  removeFavourite,
} = require("../controllers/favouriteController");

router.get("/", authMiddleware, getMyFavourites);

router.post("/", authMiddleware, addFavourite);

router.delete("/:restaurantId", authMiddleware, removeFavourite);

module.exports = router;
