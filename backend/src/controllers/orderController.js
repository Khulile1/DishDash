// ======================================
// IMPORTS
// ======================================

const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const MenuItem = require("../models/menuItem");

// ======================================
// GET LOGGED-IN USER ID
// ======================================

const getUserId = (req) => {
  return String(req.user?._id || req.user?.id || req.user?.userId || "");
};

// ======================================
// GENERATE ORDER NUMBER
// ======================================

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `DD-${timestamp}-${randomPart}`;
};

// ======================================
// CHECK WHETHER ORDER IS EDITABLE
// ======================================

const canEditOrder = (order) => {
  if (!order) {
    return false;
  }

  if (order.status !== "pending_confirmation") {
    return false;
  }

  if (!order.editable_until) {
    return false;
  }

  return new Date(order.editable_until).getTime() > Date.now();
};

// ======================================
// SANITISE PAYMENT DETAILS
// ======================================
//
// We should not store:
//
// - full card number
// - CVV
// - PIN
//
// The real card details will eventually
// go directly to the payment gateway.
// ======================================

const sanitisePaymentDetails = (paymentDetails) => {
  if (!paymentDetails || typeof paymentDetails !== "object") {
    return {};
  }

  return {
    method: paymentDetails.method,

    cardBrand: paymentDetails.cardBrand,

    cardType: paymentDetails.cardType,

    last4: paymentDetails.last4,

    expiryMonth: paymentDetails.expiryMonth,

    expiryYear: paymentDetails.expiryYear,

    tenderAmount: paymentDetails.tenderAmount,

    changeDue: paymentDetails.changeDue,

    balanceUsed: paymentDetails.balanceUsed,

    remainingToPay: paymentDetails.remainingToPay,

    amountDue: paymentDetails.amountDue,

    paymentReference: paymentDetails.paymentReference,
  };
};

// ======================================
// CREATE ORDER
// ======================================

const createOrder = async (req, res) => {
  let createdOrder = null;

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
    // RESTAURANT ORDERS
    // ======================================

    const requestedRestaurantOrders = Array.isArray(req.body.restaurant_orders)
      ? req.body.restaurant_orders
      : [];

    if (requestedRestaurantOrders.length === 0) {
      return res.status(400).json({
        message: "The order does not contain any restaurant orders.",
      });
    }

    // ======================================
    // MAXIMUM TWO RESTAURANTS
    // ======================================

    if (requestedRestaurantOrders.length > 2) {
      return res.status(400).json({
        message: "A bundled order can contain a maximum of 2 restaurants.",
      });
    }

    // ======================================
    // COLLECT CART ITEMS
    // ======================================

    const requestedItems = [];

    for (const restaurantOrder of requestedRestaurantOrders) {
      const restaurantId = String(restaurantOrder.restaurant_id || "");

      if (!restaurantId) {
        return res.status(400).json({
          message: "Restaurant ID is missing.",
        });
      }

      const items = Array.isArray(restaurantOrder.items)
        ? restaurantOrder.items
        : [];

      if (items.length === 0) {
        return res.status(400).json({
          message: "A restaurant order does not contain any menu items.",
        });
      }

      for (const item of items) {
        const menuItemId = String(item.menu_item_id || "");

        const quantity = Number(item.quantity || 0);

        if (!menuItemId) {
          return res.status(400).json({
            message: "Menu item ID is missing.",
          });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          return res.status(400).json({
            message: "Every order item must have a valid quantity.",
          });
        }

        requestedItems.push({
          restaurant_id: restaurantId,

          restaurant_name: restaurantOrder.restaurant_name || "",

          menu_item_id: menuItemId,

          quantity,
        });
      }
    }

    // ======================================
    // MUST CONTAIN ITEMS
    // ======================================

    if (requestedItems.length === 0) {
      return res.status(400).json({
        message: "The order does not contain any menu items.",
      });
    }

    // ======================================
    // UNIQUE MENU ITEM IDS
    // ======================================

    const menuItemIds = [
      ...new Set(requestedItems.map((item) => item.menu_item_id)),
    ];

    // ======================================
    // LOAD MENU ITEMS FROM DATABASE
    // ======================================
    //
    // This means the browser cannot lie
    // about the price of an item.
    // ======================================

    const databaseMenuItems = await MenuItem.find({
      _id: {
        $in: menuItemIds,
      },
    });

    // ======================================
    // CHECK THAT EVERYTHING EXISTS
    // ======================================

    if (databaseMenuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        message: "One or more menu items no longer exist.",
      });
    }

    // ======================================
    // MENU ITEM LOOKUP
    // ======================================

    const menuItemLookup = new Map(
      databaseMenuItems.map((menuItem) => [String(menuItem._id), menuItem]),
    );

    // ======================================
    // BUILD TRUSTED ORDER DATA
    // ======================================

    const trustedRestaurantOrders = [];

    const orderItemSnapshots = [];

    let trustedSubtotal = 0;

    // ======================================
    // PROCESS EACH RESTAURANT
    // ======================================

    for (const restaurantOrder of requestedRestaurantOrders) {
      const restaurantId = String(restaurantOrder.restaurant_id);

      const restaurantItems = requestedItems.filter(
        (item) => String(item.restaurant_id) === restaurantId,
      );

      const trustedItems = [];

      let restaurantSubtotal = 0;

      // ======================================
      // PROCESS ITEMS
      // ======================================

      for (const requestedItem of restaurantItems) {
        const menuItem = menuItemLookup.get(requestedItem.menu_item_id);

        if (!menuItem) {
          return res.status(400).json({
            message: "Menu item not found.",
          });
        }

        // ======================================
        // RESTAURANT VALIDATION
        // ======================================

        const actualRestaurantId = String(
          menuItem.restaurant_id?._id || menuItem.restaurant_id || "",
        );

        if (actualRestaurantId !== restaurantId) {
          return res.status(400).json({
            message: `${menuItem.name} does not belong to the selected restaurant.`,
          });
        }

        // ======================================
        // ITEM AVAILABILITY
        // ======================================

        if (menuItem.available === false) {
          return res.status(400).json({
            message: `${menuItem.name} is currently unavailable.`,
          });
        }

        // ======================================
        // STOCK CHECK
        // ======================================

        if (menuItem.track_stock === true) {
          const availableStock = Math.max(
            0,

            Number(menuItem.stock_quantity || 0),
          );

          if (requestedItem.quantity > availableStock) {
            return res.status(400).json({
              message: `Only ${availableStock} ${
                availableStock === 1 ? "portion" : "portions"
              } of ${menuItem.name} ${
                availableStock === 1 ? "is" : "are"
              } available.`,
            });
          }
        }

        // ======================================
        // PRICE FROM DATABASE
        // ======================================

        const price = Number(menuItem.price);

        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            message: `${menuItem.name} has an invalid price.`,
          });
        }

        // ======================================
        // ITEM TOTAL
        // ======================================

        const itemTotal = Number((price * requestedItem.quantity).toFixed(2));

        restaurantSubtotal += itemTotal;

        trustedSubtotal += itemTotal;

        // ======================================
        // EMBEDDED ITEM SNAPSHOT
        // ======================================

        trustedItems.push({
          menu_item_id: menuItem._id,

          name: menuItem.name,

          image_url: menuItem.image_url || "",

          quantity: requestedItem.quantity,

          price,

          item_total: itemTotal,
        });

        // ======================================
        // SEPARATE ORDER ITEM
        // ======================================

        orderItemSnapshots.push({
          menu_item_id: menuItem._id,

          restaurant_id: menuItem.restaurant_id,

          name: menuItem.name,

          image_url: menuItem.image_url || "",

          quantity: requestedItem.quantity,

          price,

          item_total: itemTotal,
        });
      }

      // ======================================
      // RESTAURANT SNAPSHOT
      // ======================================

      trustedRestaurantOrders.push({
        restaurant_id: restaurantId,

        restaurant_name: restaurantOrder.restaurant_name || "",

        items: trustedItems,

        subtotal: Number(restaurantSubtotal.toFixed(2)),

        status: "pending_confirmation",
      });
    }

    // ======================================
    // UNIQUE RESTAURANT IDS
    // ======================================

    const restaurantIds = [
      ...new Set(
        trustedRestaurantOrders.map((restaurantOrder) =>
          String(restaurantOrder.restaurant_id),
        ),
      ),
    ];

    // ======================================
    // FINAL MAX 2 RESTAURANTS CHECK
    // ======================================

    if (restaurantIds.length > 2) {
      return res.status(400).json({
        message: "A bundled order can contain a maximum of 2 restaurants.",
      });
    }

    // ======================================
    // BUNDLED ORDER?
    // ======================================

    const isBundledOrder = restaurantIds.length > 1;

    // ======================================
    // 10 SECOND EDIT WINDOW
    // ======================================

    const now = new Date();

    const editableUntil = new Date(now.getTime() + 10_000);

    // ======================================
    // SAFE PAYMENT DETAILS
    // ======================================

    const safePaymentDetails = sanitisePaymentDetails(req.body.payment_details);

    // ======================================
    // PRICING
    // ======================================

    trustedSubtotal = Number(trustedSubtotal.toFixed(2));

    const deliveryFee = Math.max(
      0,

      Number(req.body.delivery_fee || 0),
    );

    const serviceFee = Math.max(
      0,

      Number(req.body.service_fee || 0),
    );

    const totalPrice = Number(
      (trustedSubtotal + deliveryFee + serviceFee).toFixed(2),
    );

    // ======================================
    // BALANCE
    // ======================================

    const balanceUsed = Math.min(
      totalPrice,

      Math.max(
        0,

        Number(req.body.balance_used || 0),
      ),
    );

    const amountToPay = Number(
      Math.max(
        0,

        totalPrice - balanceUsed,
      ).toFixed(2),
    );

    // ======================================
    // CREATE ORDER DATA
    // ======================================

    const orderData = {
      ...req.body,

      // ======================================
      // CUSTOMER
      // ======================================

      customer_id: userId,

      // ======================================
      // ORDER NUMBER
      // ======================================

      order_number: generateOrderNumber(),

      // ======================================
      // RESTAURANTS
      // ======================================

      restaurant_id: isBundledOrder ? null : restaurantIds[0],

      restaurant_ids: restaurantIds,

      restaurant_orders: trustedRestaurantOrders,

      is_bundled_order: isBundledOrder,

      // ======================================
      // PRICING
      // ======================================

      subtotal: trustedSubtotal,

      delivery_fee: deliveryFee,

      service_fee: serviceFee,

      total_price: totalPrice,

      balance_used: balanceUsed,

      amount_to_pay: amountToPay,

      // ======================================
      // ORDER STATUS
      // ======================================

      status: "pending_confirmation",

      editable_until: editableUntil,

      confirmed_at: null,

      // ======================================
      // PAYMENT DETAILS
      // ======================================

      payment_details: safePaymentDetails,
    };

    // ======================================
    // REMOVE PROTECTED VALUES
    // ======================================

    orderData.customer_id = userId;

    orderData.status = "pending_confirmation";

    orderData.editable_until = editableUntil;

    orderData.confirmed_at = null;

    // ======================================
    // CREATE ORDER
    // ======================================

    createdOrder = await Order.create(orderData);

    // ======================================
    // CREATE ORDER ITEMS
    // ======================================

    const orderItemsToCreate = orderItemSnapshots.map((item) => ({
      ...item,

      order_id: createdOrder._id,
    }));

    const createdOrderItems = await OrderItem.create(orderItemsToCreate);

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(201).json({
      message: "Order started successfully.",

      order: createdOrder,

      orderItems: createdOrderItems,

      editWindowSeconds: 10,

      editableUntil: createdOrder.editable_until,
    });
  } catch (error) {
    console.error("Create order error:", error);

    // ======================================
    // CLEAN UP PARTIAL ORDER
    // ======================================

    if (createdOrder?._id) {
      try {
        await OrderItem.deleteMany({
          order_id: createdOrder._id,
        });

        await Order.findByIdAndDelete(createdOrder._id);
      } catch (cleanupError) {
        console.error("Order cleanup error:", cleanupError);
      }
    }

    // ======================================
    // DUPLICATE
    // ======================================

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A duplicate order or order item was detected.",
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

    return res.status(500).json({
      message: error.message || "Could not create order.",
    });
  }
};

// ======================================
// GET ALL CUSTOMER ORDERS
// ======================================

const getOrders = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const orders = await Order.find({
      customer_id: userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: error.message || "Could not load orders.",
    });
  }
};

// ======================================
// GET ONE ORDER
// ======================================

const getOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // LOAD ORDER ITEMS
    // ======================================

    const orderItems = await OrderItem.find({
      order_id: order._id,
    })
      .sort({
        createdAt: 1,
      })
      .populate("menu_item_id");

    return res.status(200).json({
      order,

      orderItems,
    });
  } catch (error) {
    console.error("Get order error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    return res.status(500).json({
      message: error.message || "Could not load order.",
    });
  }
};

// ======================================
// UPDATE ORDER
// ======================================
//
// Only possible during the 10-second
// pending_confirmation window.
// ======================================

const updateOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // GET CUSTOMER ORDER
    // ======================================

    const order = await Order.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // CHECK EDIT WINDOW
    // ======================================

    if (!canEditOrder(order)) {
      return res.status(409).json({
        message:
          "The 10-second edit window has ended. This order can no longer be edited.",
      });
    }

    // ======================================
    // SAFE FIELDS
    // ======================================

    const allowedFields = [
      "delivery_address_id",
      "delivery_address",

      "payment_method",

      "balance_used",
      "amount_to_pay",

      "delivery_distance_km",
      "delivery_duration_minutes",

      "pickup_order",
      "delivery_bundle",
    ];

    // ======================================
    // APPLY UPDATES
    // ======================================

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    }

    // ======================================
    // SAFE PAYMENT INFORMATION
    // ======================================

    if (req.body.payment_details !== undefined) {
      order.payment_details = sanitisePaymentDetails(req.body.payment_details);
    }

    // ======================================
    // SAVE
    // ======================================

    await order.save();

    return res.status(200).json({
      message: "Order updated successfully.",

      order,

      editableUntil: order.editable_until,
    });
  } catch (error) {
    console.error("Update order error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Could not update order.",
    });
  }
};

// ======================================
// END EDIT WINDOW / MOVE TO PAYMENT
// ======================================
//
// IMPORTANT:
//
// We keep the function name:
//
// confirmOrder
//
// because your route/service already use:
//
// POST /order/:id/confirm
//
// But this endpoint NO LONGER means
// "payment confirmed".
//
// It now means:
//
// pending_confirmation
//        ↓
// awaiting_payment
//
// The payment controller will change
// awaiting_payment → confirmed after a
// successful payment.
// ======================================

const confirmOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // GET CUSTOMER ORDER
    // ======================================

    const order = await Order.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // ALREADY WAITING FOR PAYMENT
    // ======================================
    //
    // This makes the request idempotent.
    // ======================================

    if (order.status === "awaiting_payment") {
      return res.status(200).json({
        message: "Order is already ready for payment.",

        order,

        paymentRequired: true,
      });
    }

    // ======================================
    // ALREADY PAID / CONFIRMED
    // ======================================

    if (order.status === "confirmed") {
      return res.status(200).json({
        message: "Order has already been confirmed.",

        order,

        paymentRequired: false,
      });
    }

    // ======================================
    // INVALID ORDER STATUS
    // ======================================

    if (order.status !== "pending_confirmation") {
      return res.status(409).json({
        message: `Order cannot move to payment from status "${order.status}".`,
      });
    }

    // ======================================
    // CHECK DEADLINE
    // ======================================

    const editableUntil = new Date(order.editable_until).getTime();

    const currentTime = Date.now();

    // ======================================
    // STILL EDITABLE
    // ======================================

    if (currentTime < editableUntil) {
      const remainingMs = editableUntil - currentTime;

      const remainingSeconds = Math.ceil(remainingMs / 1000);

      return res.status(409).json({
        message: `The order is still editable for ${remainingSeconds} ${
          remainingSeconds === 1 ? "second" : "seconds"
        }.`,

        remainingSeconds,

        editableUntil: order.editable_until,
      });
    }

    // ======================================
    // MOVE ORDER TO PAYMENT
    // ======================================

    const changedAt = new Date();

    order.status = "awaiting_payment";

    // ======================================
    // IMPORTANT
    // ======================================
    //
    // The order has NOT been paid yet.
    //
    // Therefore:
    //
    // confirmed_at stays null.
    // ======================================

    order.confirmed_at = null;

    // ======================================
    // STATUS HISTORY
    // ======================================

    if (Array.isArray(order.status_history)) {
      order.status_history.push({
        status: "awaiting_payment",

        changed_at: changedAt,

        message: "10-second edit window completed. Order is awaiting payment.",
      });
    }

    // ======================================
    // RESTAURANT ORDER STATUSES
    // ======================================

    if (Array.isArray(order.restaurant_orders)) {
      order.restaurant_orders.forEach((restaurantOrder) => {
        if (restaurantOrder.status === "pending_confirmation") {
          restaurantOrder.status = "awaiting_payment";
        }
      });
    }

    // ======================================
    // SAVE
    // ======================================

    await order.save();

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      message: "Order locked and ready for payment.",

      order,

      paymentRequired: true,
    });
  } catch (error) {
    console.error("Move order to payment error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Could not move order to payment.",
    });
  }
};

// ======================================
// DELETE ORDER
// ======================================
//
// Physical deletion is only available
// during the 10-second edit window.
// ======================================

const deleteOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // GET ORDER
    // ======================================

    const order = await Order.findOne({
      _id: req.params.id,

      customer_id: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // EDIT WINDOW
    // ======================================

    if (!canEditOrder(order)) {
      return res.status(409).json({
        message: "This order can no longer be deleted.",
      });
    }

    // ======================================
    // DELETE ORDER ITEMS
    // ======================================

    await OrderItem.deleteMany({
      order_id: order._id,
    });

    // ======================================
    // DELETE ORDER
    // ======================================

    await Order.findByIdAndDelete(order._id);

    return res.status(200).json({
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Delete order error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    return res.status(500).json({
      message: error.message || "Could not delete order.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  confirmOrder,
  deleteOrder,
};
