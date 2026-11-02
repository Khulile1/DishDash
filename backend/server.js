// ======================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ======================================

// This MUST happen before app.js is imported
// because app.js loads authRoutes,
// which loads authController,
// which uses EMAIL_USER, EMAIL_PASS
// and JWT_SECRET.
require("dotenv").config();

// ======================================
// IMPORTS
// ======================================

const app = require("./app");

const connectDB = require("./src/config/db.js");

// ======================================
// CHECK ENVIRONMENT VARIABLES
// ====================================

// ======================================
// CONNECT TO DATABASE
// ======================================

connectDB();

// ======================================
// PORT
// ======================================

const PORT = process.env.PORT || 5325;

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
