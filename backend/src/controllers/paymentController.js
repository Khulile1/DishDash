// ======================================
// IMPORTS
// ======================================

const Payment = require("../models/payment");
const Order = require("../models/order");

// ======================================
// GET LOGGED-IN USER ID
// ======================================

const getUserId = (req) => {
  return String(req.user?._id || req.user?.id || req.user?.userId || "");
};

// ======================================
// NORMALISE PAYMENT METHOD
// ======================================

const normalisePaymentMethod = (value) => {
  const method = String(value || "")
    .trim()
    .toLowerCase();

  const allowedMethods = ["cash", "card", "balance"];

  if (!allowedMethods.includes(method)) {
    return null;
  }

  return method;
};

// ======================================
// GET CUSTOMER ORDER
// ======================================

const getCustomerOrder = async (orderId, userId) => {
  return Order.findOne({
    _id: orderId,
    customer_id: userId,
  });
};

// ======================================
// SAFE PAYMENT DETAILS
// ======================================
//
// NEVER save:
//
// - full card number
// - CVV
// - PIN
//
// A real payment provider should return
// a token/reference instead.
// ======================================

const getSafePaymentDetails = (paymentDetails = {}) => {
  return {
    cardBrand: String(paymentDetails.cardBrand || ""),

    cardType: String(paymentDetails.cardType || ""),

    last4: String(paymentDetails.last4 || ""),

    expiryMonth: String(paymentDetails.expiryMonth || ""),

    expiryYear: String(paymentDetails.expiryYear || ""),

    tenderAmount: Number(paymentDetails.tenderAmount || 0),

    changeDue: Number(paymentDetails.changeDue || 0),

    paymentReference: String(paymentDetails.paymentReference || ""),

    paymentProvider: String(paymentDetails.paymentProvider || ""),
  };
};

// ======================================
// GENERATE PAYMENT REFERENCE
// ======================================

const generatePaymentReference = () => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `PAY-${Date.now()}-${randomPart}`;
};

// ======================================
// PROCESS ORDER PAYMENT
// ======================================
//
// POST /api/payment/checkout
//
// Flow:
//
// awaiting_payment
//       ↓
// Payment created
//       ↓
// Order confirmed
//
// CARD:
// currently treated as successful by the
// Dish Dash TEST gateway.
//
// CASH:
// Payment remains pending because money
// is collected on delivery.
//
// BALANCE:
// Must cover the complete remaining order.
// ======================================

const processOrderPayment = async (req, res) => {
  let createdPayment = null;

  try {
    // ======================================
    // AUTHENTICATION
    // ======================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // REQUEST DATA
    // ======================================

    const { order_id, balance_used = 0, payment_details = {} } = req.body;

    if (!order_id) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    // ======================================
    // PAYMENT METHOD
    // ======================================

    const method = normalisePaymentMethod(req.body.method);

    if (!method) {
      return res.status(400).json({
        message: "A valid payment method is required.",
      });
    }

    // ======================================
    // FIND CUSTOMER ORDER
    // ======================================

    const order = await getCustomerOrder(order_id, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // ALREADY CONFIRMED
    // ======================================

    if (order.status === "confirmed") {
      const existingPayment = await Payment.findOne({
        order_id: order._id,
        customer_id: userId,
      });

      return res.status(200).json({
        message: "This order has already been confirmed.",

        payment: existingPayment || null,

        order,
      });
    }

    // ======================================
    // MUST BE WAITING FOR PAYMENT
    // ======================================

    if (order.status !== "awaiting_payment") {
      return res.status(409).json({
        message: `Order cannot be paid from status "${order.status}".`,
      });
    }

    // ======================================
    // EXISTING PAYMENT
    // ======================================

    const existingPayment = await Payment.findOne({
      order_id: order._id,
    });

    if (existingPayment) {
      return res.status(409).json({
        message: "A payment already exists for this order.",

        payment: existingPayment,
      });
    }

    // ======================================
    // TRUST TOTAL FROM DATABASE
    // ======================================

    const orderTotal = Number(order.total_price || 0);

    if (!Number.isFinite(orderTotal) || orderTotal < 0) {
      return res.status(400).json({
        message: "Order total is invalid.",
      });
    }

    // ======================================
    // BALANCE USED
    // ======================================

    const requestedBalance = Number(balance_used || 0);

    if (!Number.isFinite(requestedBalance) || requestedBalance < 0) {
      return res.status(400).json({
        message: "Balance used must be a valid positive amount.",
      });
    }

    const balanceUsed = Math.min(
      orderTotal,

      Math.max(0, requestedBalance),
    );

    // ======================================
    // AMOUNT STILL TO PAY
    // ======================================

    const amountToPay = Number(
      Math.max(0, orderTotal - balanceUsed).toFixed(2),
    );

    // ======================================
    // BALANCE-ONLY VALIDATION
    // ======================================
    //
    // Example:
    //
    // Order total = R300
    // Balance      = R50
    //
    // Customer cannot choose "balance"
    // as the only payment method.
    // ======================================

    if (method === "balance" && amountToPay > 0) {
      return res.status(400).json({
        message:
          "Your Dish Dash balance does not fully cover this order. Choose Card or Cash for the remaining amount.",
      });
    }

    // ======================================
    // SAFE PAYMENT DETAILS
    // ======================================

    const safe = getSafePaymentDetails(payment_details);

    // ======================================
    // CARD VALIDATION
    // ======================================

    if (method === "card") {
      if (!["debit", "credit"].includes(safe.cardType)) {
        return res.status(400).json({
          message: "Card type must be debit or credit.",
        });
      }

      if (!/^\d{4}$/.test(safe.last4)) {
        return res.status(400).json({
          message: "Valid card last4 digits are required.",
        });
      }
    }

    // ======================================
    // CASH VALIDATION
    // ======================================

    if (method === "cash") {
      if (
        !Number.isFinite(safe.tenderAmount) ||
        safe.tenderAmount < amountToPay
      ) {
        return res.status(400).json({
          message: `Cash tender amount must be at least R${amountToPay.toFixed(
            2,
          )}.`,
        });
      }

      // Recalculate change on backend.
      //
      // Do not trust frontend change_due.
      safe.changeDue = Number(
        Math.max(
          0,

          safe.tenderAmount - amountToPay,
        ).toFixed(2),
      );
    }

    // ======================================
    // PAYMENT STATUS
    // ======================================

    let paymentStatus = "pending";

    let amountPaid = 0;

    let paidAt = null;

    // ======================================
    // CARD
    // ======================================
    //
    // TEST GATEWAY ONLY.
    //
    // Later a real provider must approve
    // the transaction first.
    // ======================================

    if (method === "card") {
      paymentStatus = "paid";

      amountPaid = amountToPay;

      paidAt = new Date();
    }

    // ======================================
    // BALANCE
    // ======================================

    if (method === "balance" && amountToPay === 0) {
      paymentStatus = "paid";

      amountPaid = orderTotal;

      paidAt = new Date();
    }

    // ======================================
    // CASH
    // ======================================
    //
    // The order can be confirmed, but
    // Payment stays pending until delivery.
    // ======================================

    if (method === "cash") {
      paymentStatus = "pending";

      amountPaid = 0;

      paidAt = null;
    }

    // ======================================
    // PAYMENT REFERENCE
    // ======================================

    const paymentReference =
      safe.paymentReference || generatePaymentReference();

    // ======================================
    // PROVIDER
    // ======================================

    const paymentProvider =
      safe.paymentProvider ||
      (method === "card"
        ? "Dish Dash Test Gateway"
        : method === "cash"
          ? "Cash On Delivery"
          : "Dish Dash Balance");

    // ======================================
    // CREATE PAYMENT RECORD
    // ======================================

    createdPayment = await Payment.create({
      order_id: order._id,

      customer_id: userId,

      method,

      status: paymentStatus,

      order_total: orderTotal,

      balance_used: balanceUsed,

      amount_to_pay: amountToPay,

      amount_paid: amountPaid,

      card_brand: method === "card" ? safe.cardBrand : "",

      card_type: method === "card" ? safe.cardType : "",

      card_last4: method === "card" ? safe.last4 : "",

      card_expiry_month: method === "card" ? safe.expiryMonth : "",

      card_expiry_year: method === "card" ? safe.expiryYear : "",

      tender_amount: method === "cash" ? safe.tenderAmount : 0,

      change_due: method === "cash" ? safe.changeDue : 0,

      payment_reference: paymentReference,

      payment_provider: paymentProvider,

      paid_at: paidAt,
    });

    // ======================================
    // UPDATE ORDER PAYMENT INFORMATION
    // ======================================

    order.payment_method = method;

    order.balance_used = balanceUsed;

    order.amount_to_pay = amountToPay;

    // ======================================
    // SAFE PAYMENT SNAPSHOT ON ORDER
    // ======================================

    order.payment_details = {
      method,

      cardBrand: method === "card" ? safe.cardBrand : "",

      cardType: method === "card" ? safe.cardType : "",

      last4: method === "card" ? safe.last4 : "",

      expiryMonth: method === "card" ? safe.expiryMonth : "",

      expiryYear: method === "card" ? safe.expiryYear : "",

      tenderAmount: method === "cash" ? safe.tenderAmount : 0,

      changeDue: method === "cash" ? safe.changeDue : 0,

      balanceUsed,

      remainingToPay: amountToPay,

      amountDue: amountToPay,

      paymentReference,
    };

    // ======================================
    // CONFIRM ORDER
    // ======================================
    //
    // CARD:
    // test payment accepted.
    //
    // BALANCE:
    // balance fully covers the order.
    //
    // CASH:
    // payment method accepted; actual cash
    // collection still pending.
    // ======================================

    const confirmedAt = new Date();

    order.status = "confirmed";

    order.confirmed_at = confirmedAt;

    // ======================================
    // RESTAURANT STATUSES
    // ======================================

    if (Array.isArray(order.restaurant_orders)) {
      order.restaurant_orders.forEach((restaurantOrder) => {
        if (restaurantOrder.status === "awaiting_payment") {
          restaurantOrder.status = "confirmed";
        }
      });
    }

    // ======================================
    // STATUS HISTORY
    // ======================================

    if (Array.isArray(order.status_history)) {
      order.status_history.push({
        status: "confirmed",

        changed_at: confirmedAt,

        message:
          method === "cash"
            ? "Cash on delivery selected. Order confirmed."
            : method === "balance"
              ? "Dish Dash balance payment accepted. Order confirmed."
              : "Card payment accepted. Order confirmed.",
      });
    }

    // ======================================
    // SAVE ORDER
    // ======================================

    await order.save();

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(201).json({
      message:
        method === "cash"
          ? "Cash payment details recorded. Order confirmed."
          : "Payment completed successfully.",

      payment: createdPayment,

      order,
    });
  } catch (error) {
    console.error("Process payment error:", error);

    // ======================================
    // CLEAN UP PARTIAL TEST PAYMENT
    // ======================================
    //
    // Useful while using the mock gateway:
    //
    // If Payment was created but saving
    // Order failed, remove the Payment so
    // the customer can retry.
    //
    // IMPORTANT:
    //
    // With a REAL provider later, do not
    // blindly delete a successfully charged
    // payment. Reconcile/refund instead.
    // ======================================

    if (createdPayment?._id) {
      try {
        await Payment.findByIdAndDelete(createdPayment._id);
      } catch (cleanupError) {
        console.error("Payment cleanup error:", cleanupError);
      }
    }

    // ======================================
    // DUPLICATE
    // ======================================

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A payment already exists for this order.",
      });
    }

    // ======================================
    // VALIDATION
    // ======================================

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    // ======================================
    // SERVER ERROR
    // ======================================

    return res.status(500).json({
      message: error.message || "Payment could not be processed.",
    });
  }
};

// ======================================
// CREATE PAYMENT
// ======================================
//
// Kept because your current routes include:
//
// POST /api/payment
//
// For this application we route it through
// the same safe checkout process rather than
// maintaining two separate payment flows.
// ======================================

const createPayment = async (req, res) => {
  return processOrderPayment(req, res);
};

// ======================================
// GET ALL CURRENT CUSTOMER PAYMENTS
// ======================================

const getPayments = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const payments = await Payment.find({
      customer_id: userId,
    })
      .populate("order_id")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      message: error.message || "Could not load payments.",
    });
  }
};

// ======================================
// GET ONE PAYMENT
// ======================================

const getPayment = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,

      customer_id: userId,
    }).populate("order_id");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Get payment error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid payment ID.",
      });
    }

    return res.status(500).json({
      message: error.message || "Could not load payment.",
    });
  }
};

// ======================================
// GET PAYMENT BY ORDER
// ======================================
//
// GET /api/payment/order/:orderId
// ======================================

const getPaymentByOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // VERIFY ORDER OWNERSHIP
    // ======================================

    const order = await getCustomerOrder(req.params.orderId, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // FIND PAYMENT
    // ======================================

    const payment = await Payment.findOne({
      order_id: order._id,

      customer_id: userId,
    }).populate("order_id");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found for this order.",
      });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Get payment by order error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    return res.status(500).json({
      message: error.message || "Could not load payment.",
    });
  }
};

// ======================================
// UPDATE PAYMENT
// ======================================
//
// This route is deliberately restricted.
//
// Customers cannot manually change:
//
// - payment status
// - amount paid
// - paid_at
// - customer
// - order ID
//
// And completed payments cannot be edited.
// ======================================

const updatePayment = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // FIND PAYMENT
    // ======================================

    const payment = await Payment.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    // ======================================
    // COMPLETED PAYMENTS ARE IMMUTABLE
    // ======================================

    if (payment.status === "paid" || payment.status === "refunded") {
      return res.status(409).json({
        message: "Completed payment records cannot be edited.",
      });
    }

    // ======================================
    // GET RELATED ORDER
    // ======================================

    const order = await getCustomerOrder(payment.order_id, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // ONLY BEFORE/WHILE PAYMENT IS OPEN
    // ======================================

    if (!["pending_confirmation", "awaiting_payment"].includes(order.status)) {
      return res.status(409).json({
        message: "Payment details can no longer be changed.",
      });
    }

    // ======================================
    // METHOD
    // ======================================

    if (req.body.method !== undefined) {
      const method = normalisePaymentMethod(req.body.method);

      if (!method) {
        return res.status(400).json({
          message: "Invalid payment method.",
        });
      }

      payment.method = method;
    }

    // ======================================
    // SAFE DETAILS
    // ======================================

    if (
      req.body.payment_details &&
      typeof req.body.payment_details === "object"
    ) {
      const safe = getSafePaymentDetails(req.body.payment_details);

      payment.card_brand = safe.cardBrand;

      payment.card_type = safe.cardType;

      payment.card_last4 = safe.last4;

      payment.card_expiry_month = safe.expiryMonth;

      payment.card_expiry_year = safe.expiryYear;

      payment.tender_amount = safe.tenderAmount;

      if (payment.method === "cash") {
        payment.change_due = Math.max(
          0,

          Number(
            (safe.tenderAmount - Number(payment.amount_to_pay || 0)).toFixed(2),
          ),
        );
      } else {
        payment.change_due = 0;
      }
    }

    // ======================================
    // SAVE
    // ======================================

    await payment.save();

    return res.status(200).json({
      message: "Payment updated successfully.",

      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Could not update payment.",
    });
  }
};

// ======================================
// DELETE PAYMENT
// ======================================
//
// Only unfinished payment records can be
// physically removed.
//
// Paid payment history should not normally
// be deleted.
// ======================================

const deletePayment = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // FIND PAYMENT
    // ======================================

    const payment = await Payment.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    // ======================================
    // DO NOT DELETE PAID HISTORY
    // ======================================

    if (payment.status === "paid") {
      return res.status(409).json({
        message: "Paid payment records cannot be deleted.",
      });
    }

    // ======================================
    // RELATED ORDER
    // ======================================

    const order = await getCustomerOrder(payment.order_id, userId);

    if (
      order &&
      !["pending_confirmation", "awaiting_payment"].includes(order.status)
    ) {
      return res.status(409).json({
        message: "This payment can no longer be deleted.",
      });
    }

    // ======================================
    // DELETE
    // ======================================

    await Payment.findByIdAndDelete(payment._id);

    return res.status(200).json({
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid payment ID.",
      });
    }

    return res.status(500).json({
      message: error.message || "Could not delete payment.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================
//
// These names match paymentRoutes.js
// exactly.
// ======================================

module.exports = {
  processOrderPayment,

  createPayment,

  getPayments,

  getPayment,

  getPaymentByOrder,

  updatePayment,

  deletePayment,
};
