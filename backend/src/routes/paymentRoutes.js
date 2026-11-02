// ======================================
// IMPORTS
// ======================================

const express = require("express");

const router = express.Router();

// ======================================
// PAYMENT CONTROLLER
// ======================================

const {
  processOrderPayment,

  createPayment,

  getPayments,

  getPayment,

  getPaymentByOrder,

  updatePayment,

  deletePayment,
} = require("../controllers/paymentController");

// ======================================
// AUTH MIDDLEWARE
// ======================================
//
// If your auth middleware has a different
// filename, change this path to match it.
// ======================================

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// TEST ROUTE
// ======================================
//
// Public test so we can verify that the
// payment router loaded successfully.
// ======================================

router.get(
  "/test",

  (req, res) => {
    res.status(200).json({
      message: "Payment routes working",
    });
  },
);

// ======================================
// PROCESS ORDER PAYMENT
// ======================================
//
// POST
// /api/payment/checkout
//
// This is the route used by:
//
// PaymentDetailsPage
//
// awaiting_payment
//      ↓
// payment
//      ↓
// confirmed
// ======================================

router.post(
  "/checkout",

  authMiddleware,

  processOrderPayment,
);

// ======================================
// GET PAYMENT BY ORDER
// ======================================
//
// GET
// /api/payment/order/:orderId
// ======================================

router.get(
  "/order/:orderId",

  authMiddleware,

  getPaymentByOrder,
);

// ======================================
// CREATE PAYMENT
// ======================================
//
// POST
// /api/payment
// ======================================

router.post(
  "/",

  authMiddleware,

  createPayment,
);

// ======================================
// GET CUSTOMER PAYMENTS
// ======================================
//
// GET
// /api/payment
// ======================================

router.get(
  "/",

  authMiddleware,

  getPayments,
);

// ======================================
// GET ONE PAYMENT
// ======================================
//
// GET
// /api/payment/:id
// ======================================

router.get(
  "/:id",

  authMiddleware,

  getPayment,
);

// ======================================
// UPDATE PAYMENT
// ======================================
//
// PUT
// /api/payment/:id
// ======================================

router.put(
  "/:id",

  authMiddleware,

  updatePayment,
);

// ======================================
// PATCH PAYMENT
// ======================================

router.patch(
  "/:id",

  authMiddleware,

  updatePayment,
);

// ======================================
// DELETE PAYMENT
// ======================================
//
// DELETE
// /api/payment/:id
// ======================================

router.delete(
  "/:id",

  authMiddleware,

  deletePayment,
);

// ======================================
// EXPORT
// ======================================

module.exports = router;
