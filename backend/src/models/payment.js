// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

// ======================================
// PAYMENT SCHEMA
// ======================================

const PaymentSchema = new mongoose.Schema(
  {
    // ======================================
    // ORDER
    // ======================================

    order_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Order",

      required: [true, "Order ID is required"],

      unique: true,

      index: true,
    },

    // ======================================
    // CUSTOMER
    // ======================================

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: [true, "Customer ID is required"],

      index: true,
    },

    // ======================================
    // PAYMENT METHOD
    // ======================================

    method: {
      type: String,

      enum: {
        values: ["cash", "card", "balance"],

        message: "{VALUE} is not a valid payment method",
      },

      required: [true, "Payment method is required"],
    },

    // ======================================
    // PAYMENT STATUS
    // ======================================

    status: {
      type: String,

      enum: {
        values: [
          "pending",
          "authorised",
          "paid",
          "failed",
          "cancelled",
          "refunded",
          "partially_refunded",
        ],

        message: "{VALUE} is not a valid payment status",
      },

      default: "pending",

      required: true,

      index: true,
    },

    // ======================================
    // ORDER TOTAL
    // ======================================

    order_total: {
      type: Number,

      required: [true, "Order total is required"],

      min: [0, "Order total cannot be negative"],

      validate: {
        validator(value) {
          return Number.isFinite(value);
        },

        message: "Order total must be a valid number",
      },
    },

    // ======================================
    // BALANCE USED
    // ======================================

    balance_used: {
      type: Number,

      default: 0,

      min: [0, "Balance used cannot be negative"],
    },

    // ======================================
    // AMOUNT TO PAY
    // ======================================

    amount_to_pay: {
      type: Number,

      required: [true, "Amount to pay is required"],

      min: [0, "Amount to pay cannot be negative"],

      validate: {
        validator(value) {
          return Number.isFinite(value);
        },

        message: "Amount to pay must be a valid number",
      },
    },

    // ======================================
    // AMOUNT PAID
    // ======================================

    amount_paid: {
      type: Number,

      default: 0,

      min: [0, "Amount paid cannot be negative"],
    },

    // ======================================
    // CARD DISPLAY INFORMATION
    // ======================================
    //
    // NEVER STORE:
    //
    // - full card number
    // - CVV
    // - PIN
    //
    // ======================================

    card_brand: {
      type: String,

      trim: true,

      default: "",
    },

    card_type: {
      type: String,

      enum: ["", "debit", "credit"],

      default: "",
    },

    card_last4: {
      type: String,

      trim: true,

      default: "",

      validate: {
        validator(value) {
          if (!value) {
            return true;
          }

          return /^\d{4}$/.test(value);
        },

        message: "Card last4 must contain exactly 4 digits",
      },
    },

    card_expiry_month: {
      type: String,

      trim: true,

      default: "",
    },

    card_expiry_year: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // CASH
    // ======================================

    tender_amount: {
      type: Number,

      default: 0,

      min: [0, "Tender amount cannot be negative"],
    },

    change_due: {
      type: Number,

      default: 0,

      min: [0, "Change due cannot be negative"],
    },

    // ======================================
    // PAYMENT REFERENCE
    // ======================================

    payment_reference: {
      type: String,

      trim: true,

      default: "",

      index: true,
    },

    // ======================================
    // PAYMENT PROVIDER
    // ======================================

    payment_provider: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // FAILURE
    // ======================================

    failure_reason: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // AUTHORISED DATE
    // ======================================

    authorised_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // PAID DATE
    // ======================================

    paid_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // REFUND
    // ======================================

    refunded_amount: {
      type: Number,

      default: 0,

      min: 0,
    },

    refunded_at: {
      type: Date,

      default: null,
    },

    refund_reference: {
      type: String,

      trim: true,

      default: "",
    },
  },

  {
    timestamps: true,
  },
);

// ======================================
// PAYMENT VALIDATION
// ======================================
//
// IMPORTANT:
//
// No `next` callback.
//
// Throw an Error directly if validation
// fails.
// ======================================

PaymentSchema.pre(
  "validate",

  function () {
    const orderTotal = Number(this.order_total ?? 0);

    const balanceUsed = Number(this.balance_used ?? 0);

    const amountToPay = Number(this.amount_to_pay ?? 0);

    // ======================================
    // VALID NUMBERS
    // ======================================

    if (!Number.isFinite(orderTotal)) {
      throw new Error("Order total must be a valid number");
    }

    if (!Number.isFinite(balanceUsed)) {
      throw new Error("Balance used must be a valid number");
    }

    if (!Number.isFinite(amountToPay)) {
      throw new Error("Amount to pay must be a valid number");
    }

    // ======================================
    // BALANCE CANNOT EXCEED TOTAL
    // ======================================

    if (balanceUsed > orderTotal) {
      throw new Error("Balance used cannot exceed the order total");
    }

    // ======================================
    // EXPECTED AMOUNT
    // ======================================

    const expectedAmountToPay = Math.max(
      0,

      Number((orderTotal - balanceUsed).toFixed(2)),
    );

    // ======================================
    // AMOUNT MUST MATCH
    // ======================================

    if (Math.abs(amountToPay - expectedAmountToPay) > 0.01) {
      throw new Error(
        "Amount to pay does not match the order total minus balance used",
      );
    }

    // ======================================
    // CASH CHANGE
    // ======================================

    if (this.method === "cash") {
      const tenderAmount = Number(this.tender_amount ?? 0);

      if (Number.isFinite(tenderAmount) && tenderAmount > 0) {
        this.change_due = Math.max(
          0,

          Number((tenderAmount - amountToPay).toFixed(2)),
        );
      }
    } else {
      this.change_due = 0;
    }
  },
);

// ======================================
// CUSTOMER PAYMENT HISTORY
// ======================================

PaymentSchema.index({
  customer_id: 1,

  createdAt: -1,
});

// ======================================
// PAYMENT STATUS LOOKUP
// ======================================

PaymentSchema.index({
  status: 1,

  createdAt: -1,
});

// ======================================
// JSON SETTINGS
// ======================================

PaymentSchema.set(
  "toJSON",

  {
    virtuals: true,
  },
);

PaymentSchema.set(
  "toObject",

  {
    virtuals: true,
  },
);

// ======================================
// EXPORT
// ======================================

module.exports =
  mongoose.models.Payment ||
  mongoose.model(
    "Payment",

    PaymentSchema,
  );
