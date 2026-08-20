const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    street: {
      type: String,
      required: true,
    },

    suburb: {
      type: String,
    },

    city: {
      type: String,
      required: true,
    },

    postal_code: {
      type: String,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);