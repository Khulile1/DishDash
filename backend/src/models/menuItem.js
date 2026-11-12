// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

// ======================================
// MENU ITEM SCHEMA
// ======================================

const MenuItemSchema = new mongoose.Schema(
  {
    // ======================================
    // RESTAURANT
    // ======================================

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Restaurant",

      required: [true, "Restaurant ID is required"],
    },

    // ======================================
    // CATEGORY
    // ======================================

    category: {
      type: String,

      required: [true, "Menu item category is required"],

      trim: true,

      minlength: [2, "Category must be at least 2 characters"],

      maxlength: [50, "Category cannot exceed 50 characters"],

      match: [/^[A-Za-z0-9&' -]+$/, "Please enter a valid category"],
    },

    // ======================================
    // ITEM NAME
    // ======================================

    name: {
      type: String,

      required: [true, "Menu item name is required"],

      trim: true,

      minlength: [2, "Menu item name must be at least 2 characters"],

      maxlength: [100, "Menu item name cannot exceed 100 characters"],

      match: [
        /^[A-Za-z0-9À-ÿ&'().,+\- /]+$/,
        "Please enter a valid menu item name",
      ],
    },

    // ======================================
    // DESCRIPTION
    // ======================================

    description: {
      type: String,

      required: [true, "Menu item description is required"],

      trim: true,

      minlength: [5, "Description must be at least 5 characters"],

      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // ======================================
    // PRICE
    // ======================================

    price: {
      type: Number,

      required: [true, "Price is required"],

      min: [0.01, "Price must be greater than 0"],

      validate: [
        {
          validator: Number.isFinite,

          message: "Price must be a valid number",
        },

        {
          validator: function (value) {
            return Math.round(value * 100) === value * 100;
          },

          message: "Price can have a maximum of 2 decimal places",
        },
      ],
    },

    // ======================================
    // IMAGE URL
    // ======================================

    image_url: {
      type: String,

      required: [true, "Menu item image is required"],

      trim: true,

      match: [/^https?:\/\/.+/i, "Please provide a valid image URL"],
    },

    // ======================================
    // AVAILABILITY
    // ======================================

    available: {
      type: Boolean,

      default: true,
    },

    // ======================================
    // INVENTORY TRACKING
    // ======================================

    track_stock: {
      type: Boolean,

      default: false,
    },

    // ======================================
    // STOCK QUANTITY
    // ======================================

    stock_quantity: {
      type: Number,

      default: 0,

      min: [0, "Stock quantity cannot be negative"],

      validate: {
        validator: Number.isInteger,

        message: "Stock quantity must be a whole number",
      },
    },

    // ======================================
    // LOW STOCK THRESHOLD
    // ======================================

    low_stock_threshold: {
      type: Number,

      default: 5,

      min: [0, "Low stock threshold cannot be negative"],

      validate: {
        validator: Number.isInteger,

        message: "Low stock threshold must be a whole number",
      },
    },
  },

  {
    timestamps: true,
  },
);

// ======================================
// AUTOMATIC AVAILABILITY
// ======================================

// Runs when item.save() is called
MenuItemSchema.pre("save", function () {
  if (this.track_stock && this.stock_quantity <= 0) {
    this.available = false;
  }
});

// ======================================
// UPDATE HOOK
// ======================================

// Runs for findOneAndUpdate / findByIdAndUpdate
MenuItemSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};

  const values = update.$set || update;

  // ======================================
  // CHECK STOCK UPDATE
  // ======================================

  if (
    values.track_stock === true &&
    values.stock_quantity !== undefined &&
    Number(values.stock_quantity) <= 0
  ) {
    if (update.$set) {
      update.$set.available = false;
    } else {
      update.available = false;
    }
  }
});

// ======================================
// VIRTUAL STOCK STATUS
// ======================================

MenuItemSchema.virtual("stock_status").get(function () {
  if (!this.track_stock) {
    return "not_tracked";
  }

  if (this.stock_quantity <= 0) {
    return "out_of_stock";
  }

  if (this.stock_quantity <= this.low_stock_threshold) {
    return "low_stock";
  }

  return "in_stock";
});

// ======================================
// INCLUDE VIRTUALS IN JSON
// ======================================

MenuItemSchema.set("toJSON", {
  virtuals: true,
});

MenuItemSchema.set("toObject", {
  virtuals: true,
});

// ======================================
// INDEXES
// ======================================

MenuItemSchema.index({
  restaurant_id: 1,
});

MenuItemSchema.index({
  restaurant_id: 1,
  category: 1,
});

MenuItemSchema.index({
  name: 1,
});

MenuItemSchema.index({
  restaurant_id: 1,
  track_stock: 1,
  stock_quantity: 1,
});

// ======================================
// EXPORT MODEL
// ======================================

module.exports = mongoose.model("MenuItem", MenuItemSchema);
