// ======================================
// IMPORTS
// ======================================

const OrderItem = require("../models/orderItem");
const Order = require("../models/order");
const MenuItem = require("../models/menuItem");

// ======================================
// GET LOGGED-IN USER ID
// ======================================

const getUserId = (req) => {
  return String(req.user?._id || req.user?.id || req.user?.userId || "");
};

// ======================================
// CHECK IF ORDER CAN STILL BE EDITED
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
// GET CUSTOMER ORDER
// ======================================

const getCustomerOrder = async (orderId, userId) => {
  return Order.findOne({
    _id: orderId,
    customer_id: userId,
  });
};

// ======================================
// CREATE ORDER ITEM
// ======================================

const createOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { order_id, menu_item_id, quantity = 1 } = req.body;

    // ======================================
    // VALIDATE INPUT
    // ======================================

    if (!order_id) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    if (!menu_item_id) {
      return res.status(400).json({
        message: "Menu item ID is required.",
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1.",
      });
    }

    // ======================================
    // GET ORDER
    // ======================================

    const order = await getCustomerOrder(order_id, userId);

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
        message: "This order can no longer be edited.",
      });
    }

    // ======================================
    // GET MENU ITEM FROM DATABASE
    // ======================================
    //
    // Do not trust price/name supplied
    // by the frontend.
    // ======================================

    const menuItem = await MenuItem.findById(menu_item_id);

    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found.",
      });
    }

    // ======================================
    // AVAILABILITY
    // ======================================

    if (menuItem.available === false) {
      return res.status(400).json({
        message: `${menuItem.name} is currently unavailable.`,
      });
    }

    // ======================================
    // STOCK
    // ======================================

    if (menuItem.track_stock) {
      const stock = Math.max(0, Number(menuItem.stock_quantity || 0));

      if (requestedQuantity > stock) {
        return res.status(400).json({
          message: `Only ${stock} ${
            stock === 1 ? "portion is" : "portions are"
          } available.`,
        });
      }
    }

    // ======================================
    // CHECK EXISTING ORDER ITEM
    // ======================================

    const existingOrderItem = await OrderItem.findOne({
      order_id,
      menu_item_id,
    });

    if (existingOrderItem) {
      const newQuantity =
        Number(existingOrderItem.quantity || 0) + requestedQuantity;

      if (menuItem.track_stock) {
        const stock = Math.max(0, Number(menuItem.stock_quantity || 0));

        if (newQuantity > stock) {
          return res.status(400).json({
            message: `Only ${stock} ${
              stock === 1 ? "portion is" : "portions are"
            } available.`,
          });
        }
      }

      existingOrderItem.quantity = newQuantity;

      existingOrderItem.item_total = Number(
        (Number(existingOrderItem.price) * newQuantity).toFixed(2),
      );

      await existingOrderItem.save();

      return res.status(200).json(existingOrderItem);
    }

    // ======================================
    // SNAPSHOT MENU ITEM
    // ======================================

    const price = Number(menuItem.price);

    const orderItem = await OrderItem.create({
      order_id,

      menu_item_id,

      restaurant_id: menuItem.restaurant_id,

      // Snapshot information.
      name: menuItem.name,

      image_url: menuItem.image_url || "",

      quantity: requestedQuantity,

      price,

      item_total: Number((price * requestedQuantity).toFixed(2)),
    });

    res.status(201).json(orderItem);
  } catch (error) {
    console.error("Create order item error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Could not create order item.",
    });
  }
};

// ======================================
// GET ORDER ITEMS FOR ONE ORDER
// ======================================

const getOrderItems = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const orderId = req.query.orderId;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    // ======================================
    // MAKE SURE ORDER BELONGS TO USER
    // ======================================

    const order = await getCustomerOrder(orderId, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // GET ITEMS
    // ======================================

    const orderItems = await OrderItem.find({
      order_id: orderId,
    })
      .populate("menu_item_id")
      .sort({
        createdAt: 1,
      });

    res.status(200).json(orderItems);
  } catch (error) {
    console.error("Get order items error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    res.status(500).json({
      message: "Could not load order items.",
    });
  }
};

// ======================================
// GET ONE ORDER ITEM
// ======================================

const getOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const orderItem = await OrderItem.findById(req.params.id).populate(
      "menu_item_id",
    );

    if (!orderItem) {
      return res.status(404).json({
        message: "Order item not found.",
      });
    }

    // ======================================
    // CHECK ORDER OWNER
    // ======================================

    const order = await getCustomerOrder(orderItem.order_id, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order item not found.",
      });
    }

    res.status(200).json(orderItem);
  } catch (error) {
    console.error("Get order item error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order item ID.",
      });
    }

    res.status(500).json({
      message: "Could not load order item.",
    });
  }
};

// ======================================
// UPDATE ORDER ITEM
// ======================================

const updateOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // GET ORDER ITEM
    // ======================================

    const orderItem = await OrderItem.findById(req.params.id);

    if (!orderItem) {
      return res.status(404).json({
        message: "Order item not found.",
      });
    }

    // ======================================
    // GET ORDER
    // ======================================

    const order = await getCustomerOrder(orderItem.order_id, userId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ======================================
    // 10 SECOND EDIT WINDOW
    // ======================================

    if (!canEditOrder(order)) {
      return res.status(409).json({
        message: "The 10-second edit window has ended.",
      });
    }

    // ======================================
    // QUANTITY
    // ======================================

    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1.",
      });
    }

    // ======================================
    // CHECK CURRENT MENU ITEM STOCK
    // ======================================

    const menuItem = await MenuItem.findById(orderItem.menu_item_id);

    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item no longer exists.",
      });
    }

    if (menuItem.track_stock) {
      const stock = Math.max(0, Number(menuItem.stock_quantity || 0));

      if (quantity > stock) {
        return res.status(400).json({
          message: `Only ${stock} ${
            stock === 1 ? "portion is" : "portions are"
          } available.`,
        });
      }
    }

    // ======================================
    // UPDATE SAFE FIELDS ONLY
    // ======================================
    //
    // Customer cannot change:
    //
    // price
    // restaurant_id
    // menu_item_id
    // order_id
    // ======================================

    orderItem.quantity = quantity;

    orderItem.item_total = Number(
      (Number(orderItem.price) * quantity).toFixed(2),
    );

    await orderItem.save();

    const populatedOrderItem = await OrderItem.findById(orderItem._id).populate(
      "menu_item_id",
    );

    res.status(200).json(populatedOrderItem);
  } catch (error) {
    console.error("Update order item error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Could not update order item.",
    });
  }
};

// ======================================
// DELETE ORDER ITEM
// ======================================

const deleteOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // ======================================
    // GET ORDER ITEM
    // ======================================

    const orderItem = await OrderItem.findById(req.params.id);

    if (!orderItem) {
      return res.status(404).json({
        message: "Order item not found.",
      });
    }

    // ======================================
    // GET ORDER
    // ======================================

    const order = await getCustomerOrder(orderItem.order_id, userId);

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
        message: "The 10-second edit window has ended.",
      });
    }

    // ======================================
    // DELETE
    // ======================================

    await OrderItem.findByIdAndDelete(orderItem._id);

    res.status(200).json({
      message: "Order item removed successfully.",

      orderItemId: String(orderItem._id),
    });
  } catch (error) {
    console.error("Delete order item error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order item ID.",
      });
    }

    res.status(500).json({
      message: "Could not remove order item.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  createOrderItem,
  getOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
