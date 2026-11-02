const mongoose = require("mongoose");

// ======================================
// RESTAURANT CATEGORIES
// ======================================
//
// These values are stored in MongoDB.
//
// Customer-facing labels:
//
// fast-food -> Fast Food
// african   -> African
// grill     -> Braai & Grill
// italian   -> Italian
// seafood   -> Seafood
//
// Keep these values consistent with the
// category filters on the customer pages.
// ======================================

const RESTAURANT_CATEGORIES = [
  "fast-food",
  "african",
  "grill",
  "italian",
  "seafood",
];

// ======================================
// RESTAURANT SCHEMA
// ======================================

const RestaurantSchema = new mongoose.Schema(
  {
    // ======================================
    // RESTAURANT NAME
    // ======================================

    name: {
      type: String,

      required: [true, "Restaurant name is required"],

      trim: true,

      minlength: [2, "Restaurant name must be at least 2 characters"],

      maxlength: [100, "Restaurant name cannot exceed 100 characters"],

      match: [
        /^[A-Za-z0-9À-ÿ&'.\-\s]+$/,

        "Please enter a valid restaurant name",
      ],
    },

    // ======================================
    // RESTAURANT CATEGORY
    // ======================================
    //
    // This is different from MenuItem.category.
    //
    // Restaurant category:
    // - Fast Food
    // - African
    // - Braai & Grill
    // - Italian
    // - Seafood
    //
    // Menu item category remains things like:
    // - Burgers
    // - Pizza
    // - Chicken
    // - Drinks
    // - Desserts
    // ======================================

    category: {
      type: String,

      enum: {
        values: RESTAURANT_CATEGORIES,

        message: "{VALUE} is not a valid restaurant category",
      },

      required: [true, "Restaurant category is required"],

      trim: true,

      lowercase: true,

      index: true,
    },

    // ======================================
    // STREET ADDRESS
    // ======================================

    street_address: {
      type: String,

      required: [true, "Street address is required"],

      trim: true,
    },

    // ======================================
    // SUBURB
    // ======================================

    suburb: {
      type: String,

      required: [true, "Suburb is required"],

      trim: true,
    },

    // ======================================
    // CITY
    // ======================================

    city: {
      type: String,

      required: [true, "City is required"],

      trim: true,
    },

    // ======================================
    // PROVINCE
    // ======================================

    province: {
      type: String,

      required: [true, "Province is required"],

      trim: true,
    },

    // ======================================
    // POSTAL CODE
    // ======================================

    postal_code: {
      type: String,

      trim: true,

      default: "",
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

      required: [true, "Latitude is required"],

      min: -90,

      max: 90,
    },

    // ======================================
    // LONGITUDE
    // ======================================

    longitude: {
      type: Number,

      required: [true, "Longitude is required"],

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

      required: [true, "Formatted address is required"],
    },

    // ======================================
    // PHONE NUMBER
    // ======================================

    phone: {
      type: String,

      required: [true, "Phone number is required"],

      trim: true,

      // MongoDB stores:
      // 0821234567

      match: [/^\d{10}$/, "Phone number must contain exactly 10 digits"],
    },

    // ======================================
    // OPENING TIME
    // ======================================

    opening_time: {
      type: String,

      default: "08:00",

      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,

        "Opening time must use HH:mm format",
      ],
    },

    // ======================================
    // CLOSING TIME
    // ======================================

    closing_time: {
      type: String,

      default: "20:00",

      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,

        "Closing time must use HH:mm format",
      ],
    },

    // ======================================
    // RESTAURANT IMAGE
    // ======================================

    image_url: {
      type: String,

      required: [true, "Restaurant image is required"],

      trim: true,

      match: [/^https?:\/\/.+/i, "Please provide a valid image URL"],
    },

    // ======================================
    // RESTAURANT OWNER
    // ======================================

    owner_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: [true, "Restaurant owner is required"],
    },
  },

  {
    timestamps: true,

    // ======================================
    // INCLUDE VIRTUAL FIELDS
    // ======================================

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

// ======================================
// CATEGORY LABEL VIRTUAL
// ======================================
//
// MongoDB stores:
// fast-food
//
// API can also return:
// Fast Food
//
// This is useful on restaurant cards.
// ======================================

RestaurantSchema.virtual("category_label").get(function () {
  const categoryLabels = {
    "fast-food": "Fast Food",

    african: "African",

    grill: "Braai & Grill",

    italian: "Italian",

    seafood: "Seafood",
  };

  return categoryLabels[this.category] || this.category || "";
});

// ======================================
// TIME TO MINUTES
// ======================================

const timeToMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || "")
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

// ======================================
// SOUTH AFRICA CURRENT TIME
// ======================================

const getSouthAfricaCurrentMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",

    hour: "2-digit",

    minute: "2-digit",

    hour12: false,
  }).formatToParts(new Date());

  const hours = Number(parts.find((part) => part.type === "hour")?.value);

  const minutes = Number(parts.find((part) => part.type === "minute")?.value);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

// ======================================
// IS OPEN VIRTUAL
// ======================================
//
// This is not physically stored in MongoDB.
//
// It is calculated whenever the restaurant
// is returned through Mongoose.
//
// Examples:
//
// 08:00 - 20:00
// 15:00 => OPEN
// 21:00 => CLOSED
//
// Overnight:
//
// 18:00 - 02:00
// 23:00 => OPEN
// 01:00 => OPEN
// 03:00 => CLOSED
//
// Same opening + closing time:
//
// 00:00 - 00:00
//
// means OPEN 24 HOURS.
// ======================================

RestaurantSchema.virtual("is_open").get(function () {
  const opening = timeToMinutes(this.opening_time);

  const closing = timeToMinutes(this.closing_time);

  const current = getSouthAfricaCurrentMinutes();

  // ======================================
  // INVALID TIME
  // ======================================

  if (opening === null || closing === null || current === null) {
    return false;
  }

  // ======================================
  // OPEN 24 HOURS
  // ======================================

  if (opening === closing) {
    return true;
  }

  // ======================================
  // NORMAL HOURS
  //
  // 08:00 - 20:00
  // ======================================

  if (opening < closing) {
    return current >= opening && current < closing;
  }

  // ======================================
  // OVERNIGHT HOURS
  //
  // 18:00 - 02:00
  // ======================================

  return current >= opening || current < closing;
});

// ======================================
// INDEXES
// ======================================

// ======================================
// OWNER INDEX
// ======================================
//
// One owner can own multiple restaurants.
// ======================================

RestaurantSchema.index({
  owner_id: 1,
});

// ======================================
// CATEGORY INDEX
// ======================================
//
// Used by:
//
// /restaurants?category=fast-food
// /restaurants?category=african
// /restaurants?category=grill
// /restaurants?category=italian
// /restaurants?category=seafood
//
// ======================================

RestaurantSchema.index({
  category: 1,
});

// ======================================
// CATEGORY + CITY INDEX
// ======================================
//
// Useful later when querying:
//
// Italian restaurants in Johannesburg
// African restaurants in Pretoria
//
// ======================================

RestaurantSchema.index({
  category: 1,

  city: 1,
});

// ======================================
// GEOAPIFY INDEX
// ======================================

RestaurantSchema.index({
  geoapify_place_id: 1,
});

// ======================================
// OWNER + CATEGORY INDEX
// ======================================
//
// Useful when a restaurant owner has
// multiple restaurant businesses.
// ======================================

RestaurantSchema.index({
  owner_id: 1,

  category: 1,
});

// ======================================
// EXPORT
// ======================================

module.exports = mongoose.model("Restaurant", RestaurantSchema);
