// ======================================
// IMPORTS
// ======================================

// Configured Axios instance.
//
// Your api instance should already attach
// the logged-in user's JWT/token.
import api from "./api";

// ======================================
// CREATE ORDER ITEM
// ======================================
//
// Used during the 10-second edit window.
//
// Expected:
//
// {
//   order_id: "...",
//   menu_item_id: "...",
//   quantity: 1
// }
//
// Price/name should NOT be sent from the
// frontend because the backend reads those
// values from MongoDB.
// ======================================

export const createOrderItem = async (orderItemData) => {
  const response = await api.post("/orderItems", orderItemData);

  return response.data;
};

// ======================================
// GET ORDER ITEMS
// ======================================
//
// IMPORTANT:
//
// We no longer request every order item.
//
// Instead:
//
// GET /orderItems?orderId=...
//
// The backend checks that the order belongs
// to the currently logged-in customer.
// ======================================

export const getOrderItems = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required to load order items.");
  }

  const response = await api.get("/orderItems", {
    params: {
      orderId,
    },
  });

  return response.data;
};

// ======================================
// GET ONE ORDER ITEM
// ======================================

export const getOrderItem = async (id) => {
  if (!id) {
    throw new Error("Order item ID is required.");
  }

  const response = await api.get(`/orderItems/${id}`);

  return response.data;
};

// ======================================
// UPDATE ORDER ITEM
// ======================================
//
// Normally only quantity should be changed.
//
// Example:
//
// updateOrderItem(id, {
//   quantity: 3,
// });
//
// The backend prevents changes after the
// 10-second edit window expires.
// ======================================

export const updateOrderItem = async (id, orderItemData) => {
  if (!id) {
    throw new Error("Order item ID is required.");
  }

  const response = await api.put(`/orderItems/${id}`, orderItemData);

  return response.data;
};

// ======================================
// UPDATE ORDER ITEM QUANTITY
// ======================================
//
// Convenience method for changing only
// quantity.
//
// Uses PATCH rather than PUT.
// ======================================

export const updateOrderItemQuantity = async (id, quantity) => {
  if (!id) {
    throw new Error("Order item ID is required.");
  }

  const numericQuantity = Number(quantity);

  if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  const response = await api.patch(`/orderItems/${id}`, {
    quantity: numericQuantity,
  });

  return response.data;
};

// ======================================
// DELETE ORDER ITEM
// ======================================
//
// Removes an item from the pending order.
//
// Backend only allows this while:
//
// status === "pending_confirmation"
//
// and:
//
// editable_until > current time
// ======================================

export const deleteOrderItem = async (id) => {
  if (!id) {
    throw new Error("Order item ID is required.");
  }

  const response = await api.delete(`/orderItems/${id}`);

  return response.data;
};
