// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

// ======================================
// ORDER ITEM SNAPSHOT
// ======================================
//
// This is a historical snapshot of what
// the customer ordered.
//
// The separate OrderItem model can still
// be used during the 10-second edit window.
// ======================================

const OrderItemSnapshotSchema = new mongoose.Schema(
  {
    // ======================================
    // MENU ITEM
    // ======================================

    menu_item_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "MenuItem",

      required: true,
    },

    // ======================================
    // ITEM NAME SNAPSHOT
    // ======================================

    name: {
      type: String,

      trim: true,

      default: "",
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

      required: true,

      min: [1, "Quantity must be at least 1"],

      default: 1,
    },

    // ======================================
    // PRICE AT TIME OF ORDER
    // ======================================

    price: {
      type: Number,

      required: true,

      min: [0, "Price cannot be negative"],
    },

    // ======================================
    // ITEM TOTAL
    // ======================================

    item_total: {
      type: Number,

      min: [0, "Item total cannot be negative"],

      default: 0,
    },
  },

  {
    _id: false,
  },
);

// ======================================
// RESTAURANT ORDER SNAPSHOT
// ======================================

const RestaurantOrderSchema = new mongoose.Schema(
  {
    // ======================================
    // RESTAURANT
    // ======================================

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Restaurant",

      required: true,
    },

    // ======================================
    // RESTAURANT NAME SNAPSHOT
    // ======================================

    restaurant_name: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // ITEMS
    // ======================================

    items: {
      type: [OrderItemSnapshotSchema],

      default: [],
    },

    // ======================================
    // RESTAURANT SUBTOTAL
    // ======================================

    subtotal: {
      type: Number,

      required: true,

      min: [0, "Restaurant subtotal cannot be negative"],

      default: 0,
    },

    // ======================================
    // RESTAURANT STATUS
    // ======================================

    status: {
      type: String,

      enum: [
        "pending_confirmation",

        "awaiting_payment",

        "confirmed",

        "accepted",

        "preparing",

        "ready_for_pickup",

        "picked_up",

        "cancelled",
      ],

      default: "pending_confirmation",
    },

    // ======================================
    // TIMESTAMPS
    // ======================================

    accepted_at: {
      type: Date,

      default: null,
    },

    preparing_at: {
      type: Date,

      default: null,
    },

    ready_at: {
      type: Date,

      default: null,
    },

    picked_up_at: {
      type: Date,

      default: null,
    },
  },

  {
    _id: false,
  },
);

// ======================================
// DELIVERY ADDRESS SNAPSHOT
// ======================================
//
// Your CheckoutPage currently sends:
//
// delivery_address_id
// delivery_address
//
// where delivery_address is formatted text.
//
// This object gives you room to save the
// complete address snapshot as well.
// ======================================

const DeliveryAddressSnapshotSchema = new mongoose.Schema(
  {
    label: {
      type: String,

      trim: true,

      default: "",
    },

    formatted_address: {
      type: String,

      trim: true,

      default: "",
    },

    street_address: {
      type: String,

      trim: true,

      default: "",
    },

    suburb: {
      type: String,

      trim: true,

      default: "",
    },

    city: {
      type: String,

      trim: true,

      default: "",
    },

    province: {
      type: String,

      trim: true,

      default: "",
    },

    postal_code: {
      type: String,

      trim: true,

      default: "",
    },

    country: {
      type: String,

      trim: true,

      default: "South Africa",
    },

    latitude: {
      type: Number,

      default: null,
    },

    longitude: {
      type: Number,

      default: null,
    },
  },

  {
    _id: false,
  },
);

// ======================================
// PAYMENT DETAILS
// ======================================
//
// IMPORTANT:
//
// Never store:
//
// full card number
// CVV
// PIN
//
// This matches the sanitised object from
// your orderController.
// ======================================

const PaymentDetailsSchema = new mongoose.Schema(
  {
    method: {
      type: String,

      enum: ["cash", "card", "balance"],
    },

    cardBrand: {
      type: String,

      trim: true,

      default: "",
    },

    cardType: {
      type: String,

      trim: true,

      default: "",
    },

    last4: {
      type: String,

      trim: true,

      maxlength: 4,

      default: "",
    },

    expiryMonth: {
      type: String,

      trim: true,

      default: "",
    },

    expiryYear: {
      type: String,

      trim: true,

      default: "",
    },

    tenderAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    changeDue: {
      type: Number,

      default: 0,

      min: 0,
    },

    balanceUsed: {
      type: Number,

      default: 0,

      min: 0,
    },

    remainingToPay: {
      type: Number,

      default: 0,

      min: 0,
    },

    amountDue: {
      type: Number,

      default: 0,

      min: 0,
    },

    paymentReference: {
      type: String,

      trim: true,

      default: "",
    },
  },

  {
    _id: false,
  },
);

// ======================================
// STATUS HISTORY
// ======================================

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,

      required: true,
    },

    changed_at: {
      type: Date,

      default: Date.now,
    },

    message: {
      type: String,

      trim: true,

      default: "",
    },
  },

  {
    _id: false,
  },
);

// ======================================
// ORDER SCHEMA
// ======================================

const OrderSchema = new mongoose.Schema(
  {
    // ======================================
    // ORDER NUMBER
    // ======================================

    order_number: {
      type: String,

      required: [true, "Order number is required"],

      unique: true,

      index: true,

      trim: true,
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
    // LEGACY / SINGLE RESTAURANT
    // ======================================
    //
    // This is optional now.
    //
    // Single restaurant orders can still
    // use it, while bundled orders use
    // restaurant_ids.
    // ======================================

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Restaurant",

      default: null,
    },

    // ======================================
    // ALL RESTAURANTS
    // ======================================

    restaurant_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Restaurant",
      },
    ],

    // ======================================
    // RESTAURANT ORDER SNAPSHOTS
    // ======================================

    restaurant_orders: {
      type: [RestaurantOrderSchema],

      default: [],
    },

    // ======================================
    // BUNDLED ORDER
    // ======================================

    is_bundled_order: {
      type: Boolean,

      default: false,
    },

    // ======================================
    // ORDER STATUS
    // ======================================

    status: {
      type: String,

      enum: {
        values: [
          "pending_confirmation",

          "awaiting_payment",

          "confirmed",

          "accepted",

          "preparing",

          "ready_for_pickup",

          "driver_assigned",

          "collecting",

          "out_for_delivery",

          "delivered",

          "cancelled",

          "refunded",
        ],

        message: "{VALUE} is not a valid order status",
      },

      default: "pending_confirmation",

      required: true,

      index: true,
    },

    // ======================================
    // 10 SECOND EDIT WINDOW
    // ======================================

    editable_until: {
      type: Date,

      required: [true, "Editable-until time is required"],
    },

    // ======================================
    // CONFIRMED DATE
    // ======================================

    confirmed_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // DELIVERY ADDRESS ID
    // ======================================

    delivery_address_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Address",

      required: [true, "Delivery address ID is required"],
    },

    // ======================================
    // FORMATTED DELIVERY ADDRESS
    // ======================================
    //
    // This matches your current checkout:
    //
    // delivery_address:
    //   "12 Road, Midrand, Gauteng..."
    //
    // ======================================

    delivery_address: {
      type: String,

      required: [true, "Delivery address is required"],

      trim: true,
    },

    // ======================================
    // FULL ADDRESS SNAPSHOT
    // ======================================

    delivery_address_snapshot: {
      type: DeliveryAddressSnapshotSchema,

      default: () => ({}),
    },

    // ======================================
    // PAYMENT METHOD
    // ======================================

    payment_method: {
      type: String,

      enum: ["cash", "card", "balance"],

      required: [true, "Payment method is required"],
    },

    // ======================================
    // SAFE PAYMENT DETAILS
    // ======================================

    payment_details: {
      type: PaymentDetailsSchema,

      default: () => ({}),
    },

    // ======================================
    // BALANCE USED
    // ======================================

    balance_used: {
      type: Number,

      default: 0,

      min: 0,
    },

    // ======================================
    // AMOUNT CUSTOMER STILL PAYS
    // ======================================

    amount_to_pay: {
      type: Number,

      required: [true, "Amount to pay is required"],

      min: 0,
    },

    // ======================================
    // SUBTOTAL
    // ======================================

    subtotal: {
      type: Number,

      required: [true, "Subtotal is required"],

      min: 0,
    },

    // ======================================
    // DELIVERY FEE
    // ======================================

    delivery_fee: {
      type: Number,

      required: [true, "Delivery fee is required"],

      min: 0,

      default: 0,
    },

    // ======================================
    // SERVICE FEE
    // ======================================

    service_fee: {
      type: Number,

      required: [true, "Service fee is required"],

      min: 0,

      default: 0,
    },

    // ======================================
    // TOTAL PRICE
    // ======================================

    total_price: {
      type: Number,

      required: [true, "Total price is required"],

      min: [0, "Total price cannot be negative"],

      validate: {
        validator: Number.isFinite,

        message: "Total price must be a valid number",
      },
    },

    // ======================================
    // DELIVERY DISTANCE
    // ======================================

    delivery_distance_km: {
      type: Number,

      default: 0,

      min: 0,
    },

    // ======================================
    // DELIVERY DURATION
    // ======================================

    delivery_duration_minutes: {
      type: Number,

      default: 0,

      min: 0,
    },

    // ======================================
    // PICKUP ORDER
    // ======================================
    //
    // Geo/routing responses can contain
    // different fields, so keep this
    // flexible for now.
    // ======================================

    pickup_order: {
      type: [mongoose.Schema.Types.Mixed],

      default: [],
    },

    // ======================================
    // DELIVERY BUNDLE
    // ======================================

    delivery_bundle: {
      type: Boolean,

      default: false,
    },

    // ======================================
    // DRIVER
    // ======================================

    driver_id: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    // ======================================
    // DRIVER ASSIGNED TIME
    // ======================================

    driver_assigned_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // ACCEPTED TIME
    // ======================================

    accepted_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // PREPARATION START TIME
    // ======================================

    preparation_started_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // READY TIME
    // ======================================

    ready_for_pickup_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // PICKED UP
    // ======================================

    picked_up_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // OUT FOR DELIVERY
    // ======================================

    out_for_delivery_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // DELIVERED
    // ======================================

    delivered_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // CANCELLED
    // ======================================

    cancelled_at: {
      type: Date,

      default: null,
    },

    // ======================================
    // CANCELLATION REASON
    // ======================================

    cancellation_reason: {
      type: String,

      trim: true,

      default: "",
    },

    // ======================================
    // CANCELLED BY
    // ======================================

    cancelled_by: {
      type: String,

      enum: ["", "customer", "restaurant", "driver", "admin", "system"],

      default: "",
    },

    // ======================================
    // STATUS HISTORY
    // ======================================

    status_history: {
      type: [StatusHistorySchema],

      default: () => [
        {
          status: "pending_confirmation",

          changed_at: new Date(),

          message: "Order created. Customer has 10 seconds to edit.",
        },
      ],
    },
  },

  {
    timestamps: true,
  },
);

// ======================================
// CAN EDIT VIRTUAL
// ======================================
//
// MongoDB doesn't store this property.
//
// It is calculated whenever the order
// is returned.
// ======================================

OrderSchema.virtual("can_edit").get(function () {
  if (this.status !== "pending_confirmation") {
    return false;
  }

  if (!this.editable_until) {
    return false;
  }

  return new Date(this.editable_until).getTime() > Date.now();
});

// ======================================
// EDIT SECONDS REMAINING VIRTUAL
// ======================================

OrderSchema.virtual("edit_seconds_remaining").get(function () {
  if (!this.can_edit) {
    return 0;
  }

  const milliseconds = new Date(this.editable_until).getTime() - Date.now();

  return Math.max(0, Math.ceil(milliseconds / 1000));
});

// ======================================
// OUTPUT VIRTUALS
// ======================================

OrderSchema.set("toJSON", {
  virtuals: true,
});

OrderSchema.set("toObject", {
  virtuals: true,
});

// ======================================
// INDEXES
// ======================================

// Customer order history.
OrderSchema.index({
  customer_id: 1,

  createdAt: -1,
});

// Restaurant order queries.
OrderSchema.index({
  restaurant_ids: 1,

  status: 1,
});

// Driver queries.
OrderSchema.index({
  driver_id: 1,

  status: 1,
});

// Pending confirmation lookup.
OrderSchema.index({
  status: 1,

  editable_until: 1,
});

// ======================================
// EXPORT
// ======================================

module.exports = mongoose.model("Order", OrderSchema);
