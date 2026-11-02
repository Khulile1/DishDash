// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

// ======================================
// ORDER ITEM SCHEMA
// ======================================

const OrderItemSchema = new mongoose.Schema(
  {
    // ======================================
    // ORDER
    // ======================================

    order_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Order",

      required: [true, "Order ID is required"],

      index: true,
    },

    // ======================================
    // MENU ITEM
    // ======================================

    menu_item_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "MenuItem",

      required: [true, "Menu item ID is required"],
    },

    // ======================================
    // RESTAURANT
    // ======================================

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Restaurant",

      required: [true, "Restaurant ID is required"],
    },

    // ======================================
    // ITEM NAME SNAPSHOT
    // ======================================
    //
    // Save the name at the time the
    // customer places the order.
    //
    // If the restaurant later changes
    // the MenuItem name, old orders keep
    // their original information.
    // ======================================

    name: {
      type: String,

      required: [true, "Item name is required"],

      trim: true,
    },

    // ======================================
    // IMAGE SNAPSHOT
    // ======================================

    image_url: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // QUANTITY
    // ======================================

    quantity: {
      type: Number,

      required: [true, "Quantity is required"],

      min: [1, "Quantity must be at least 1"],

      validate: {
        validator(value) {
          return Number.isInteger(value) && value >= 1;
        },

        message: "Quantity must be a whole number greater than 0",
      },

      default: 1,
    },

    // ======================================
    // PRICE SNAPSHOT
    // ======================================
    //
    // Save the current MenuItem price.
    //
    // Never depend on MenuItem.price for
    // old completed orders because prices
    // can change later.
    // ======================================

    price: {
      type: Number,

      required: [true, "Price is required"],

      min: [0, "Price cannot be negative"],

      validate: {
        validator(value) {
          return Number.isFinite(value);
        },

        message: "Price must be a valid number",
      },
    },

    // ======================================
    // ITEM TOTAL
    // ======================================
    //
    // quantity × price
    // ======================================

    item_total: {
      type: Number,

      required: [true, "Item total is required"],

      min: [0, "Item total cannot be negative"],

      validate: {
        validator(value) {
          return Number.isFinite(value);
        },

        message: "Item total must be a valid number",
      },
    },
  },

  {
    timestamps: true,
  },
);

// ======================================
// CALCULATE ITEM TOTAL
// BEFORE VALIDATION
// ======================================
//
// IMPORTANT:
//
// Do NOT use:
//
// function (next)
//
// and do NOT call:
//
// next()
//
// Your Mongoose version is using the
// newer middleware style.
//
// This hook runs automatically whenever
// the document is validated/saved.
// ======================================

OrderItemSchema.pre(
  "validate",

  function () {
    const price = Number(this.price ?? 0);

    const quantity = Number(this.quantity ?? 1);

    // ======================================
    // ONLY CALCULATE VALID NUMBERS
    // ======================================

    if (Number.isFinite(price) && Number.isFinite(quantity)) {
      this.item_total = Number((price * quantity).toFixed(2));
    }
  },
);

// ======================================
// UNIQUE ORDER + MENU ITEM
// ======================================
//
// Prevent:
//
// Burger x1
// Burger x1
// Burger x1
//
// Instead:
//
// Burger x3
//
// for the same order.
// ======================================

OrderItemSchema.index(
  {
    order_id: 1,

    menu_item_id: 1,
  },

  {
    unique: true,
  },
);

// ======================================
// ORDER ITEM LOOKUP
// ======================================
//
// Used by:
//
// GET /orderItems?orderId=...
// ======================================

OrderItemSchema.index({
  order_id: 1,

  createdAt: 1,
});

// ======================================
// RESTAURANT ORDER ITEM LOOKUP
// ======================================

OrderItemSchema.index({
  restaurant_id: 1,

  order_id: 1,
});

// ======================================
// JSON SETTINGS
// ======================================

OrderItemSchema.set(
  "toJSON",

  {
    virtuals: true,
  },
);

OrderItemSchema.set(
  "toObject",

  {
    virtuals: true,
  },
);

// ======================================
// EXPORT
// ======================================
//
// The mongoose.models check also protects
// against:
//
// Cannot overwrite `OrderItem` model
// once compiled.
// ======================================

module.exports =
  mongoose.models.OrderItem ||
  mongoose.model(
    "OrderItem",

    OrderItemSchema,
  );
