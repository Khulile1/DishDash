// ======================================
// IMPORTS
// ======================================

const express = require("express");

const { globalSearch } = require("../controllers/searchController");

// ======================================
// ROUTER
// ======================================

const router = express.Router();

// ======================================
// GLOBAL SEARCH
// ======================================

// GET /api/search?q=burger

router.get("/", globalSearch);

// ======================================
// EXPORT
// ======================================

module.exports = router;
