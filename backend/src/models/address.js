// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

// ======================================
// ADDRESS SCHEMA
// ======================================

const addressSchema = new mongoose.Schema(
  {
    // ======================================
    // USER
    // ======================================

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ======================================
    // ADDRESS LABEL
    // ======================================

    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },

    // ======================================
    // STREET ADDRESS
    // ======================================

    street_address: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================
    // SUBURB
    // ======================================

    suburb: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================
    // CITY
    // ======================================

    city: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================
    // PROVINCE
    // ======================================

    province: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================
    // POSTAL CODE
    // ======================================

    postal_code: {
      type: String,
      trim: true,
    },

    // ======================================
    // COUNTRY
    // ======================================

    country: {
      type: String,
      default: "South Africa",
      trim: true,
    },

    // ======================================
    // LATITUDE
    // ======================================

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    // ======================================
    // LONGITUDE
    // ======================================

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    // ======================================
    // GEOAPIFY PLACE ID
    // ======================================

    geoapify_place_id: {
      type: String,
      trim: true,
      default: null,
    },

    // ======================================
    // FULL FORMATTED ADDRESS
    // ======================================

    formatted_address: {
      type: String,
      trim: true,
    },

    // ======================================
    // DEFAULT ADDRESS
    // ======================================

    is_default: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ======================================
// INDEXES
// ======================================

// Useful when loading all addresses
// belonging to a specific user.
addressSchema.index({
  user_id: 1,
});

// ======================================
// EXPORT MODEL
// ======================================

module.exports = mongoose.model("Address", addressSchema);
