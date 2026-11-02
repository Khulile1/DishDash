// ======================================
// IMPORT EXPRESS
// ======================================

const express = require("express");

// ======================================
// IMPORT CONTROLLERS
// ======================================

const {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controllers/authController");

// ======================================
// IMPORT MIDDLEWARE
// ======================================

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const loginRateLimitMiddleware = require("../middleware/loginRateLimitMiddleware");

// ======================================
// CREATE ROUTER
// ======================================

const router = express.Router();

// ======================================
// PUBLIC AUTH ROUTES
// ======================================

// ======================================
// REGISTER
// ======================================

router.post("/register", register);

// ======================================
// LOGIN
// ======================================

router.post("/login", loginRateLimitMiddleware, login);

// ======================================
// VERIFY EMAIL
// ======================================

router.post("/verify-email", verifyEmail);

// ======================================
// RESEND VERIFICATION CODE
// ======================================

router.post("/resend-verification", resendVerificationCode);

// ======================================
// FORGOT PASSWORD
// ======================================

router.post("/forgot-password", forgotPassword);

// ======================================
// VERIFY PASSWORD RESET LINK
// ======================================

// This runs when the user clicks the link
// from the reset password email.
//
// It checks:
// - email
// - reset token
// - whether the token exists
// - whether the token has expired
//
// It DOES NOT change the password.
router.post("/verify-reset-token", verifyResetToken);

// ======================================
// RESET PASSWORD
// ======================================

// This runs only after the user enters:
// - 6-digit reset code
// - new password
// - confirmation password
router.post("/reset-password", resetPassword);

// ======================================
// PROTECTED AUTH ROUTES
// ======================================

// ======================================
// CURRENT USER / TEST AUTH
// ======================================

router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    message: "Auth middleware is working",

    user: req.user,
  });
});

// ======================================
// ADMIN ONLY
// ======================================

router.get(
  "/admin-only",

  authMiddleware,

  roleMiddleware("admin"),

  (req, res) => {
    return res.status(200).json({
      message: "Admin access granted",

      user: req.user,
    });
  },
);

// ======================================
// CUSTOMER ONLY
// ======================================

router.get(
  "/customer-only",

  authMiddleware,

  roleMiddleware("customer"),

  (req, res) => {
    return res.status(200).json({
      message: "Customer access granted",

      user: req.user,
    });
  },
);

// ======================================
// RESTAURANT ONLY
// ======================================

router.get(
  "/restaurant-only",

  authMiddleware,

  roleMiddleware("restaurant"),

  (req, res) => {
    return res.status(200).json({
      message: "Restaurant access granted",

      user: req.user,
    });
  },
);

// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;
