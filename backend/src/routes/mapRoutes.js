// ======================================
// IMPORTS
// ======================================

const express = require("express");

const {
  autocompleteAddress,
  reverseAddress,
  calculateRoute,
} = require("../controllers/mapController");

// ======================================
// ROUTER
// ======================================

const router = express.Router();

// ======================================
// ADDRESS AUTOCOMPLETE
// ======================================

router.get("/autocomplete", autocompleteAddress);

// ======================================
// REVERSE GEOCODING
// ======================================

router.get("/reverse", reverseAddress);

// ======================================
// ROUTING
// ======================================

router.post("/route", calculateRoute);

// ======================================
// EXPORT
// ======================================

module.exports = router;
