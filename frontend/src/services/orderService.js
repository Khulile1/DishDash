// ======================================
// IMPORTS
// ======================================

import api from "./api";

// ======================================
// CREATE ORDER
// ======================================
//
// Creates the order immediately.
//
// Backend should initially create it with:
//
// status: "pending_confirmation"
// editable_until: now + 10 seconds
//
// ======================================

export const createOrder = async (orderData) => {
  if (!orderData) {
    throw new Error("Order data is required.");
  }

  const response = await api.post("/order", orderData);

  return response.data;
};

// ======================================
// GET ALL ORDERS
// ======================================
//
// Backend should return only orders
// belonging to the logged-in customer
// unless the authenticated user is an
// admin/restaurant/driver with permission.
// ======================================

export const findOrders = async () => {
  const response = await api.get("/order");

  return response.data;
};

// ======================================
// GET ONE ORDER
// ======================================

export const findOrder = async (id) => {
  if (!id) {
    throw new Error("Order ID is required.");
  }

  const response = await api.get(`/order/${id}`);

  return response.data;
};

// ======================================
// UPDATE ORDER
// ======================================
//
// Use this only for general permitted
// order updates.
//
// Item quantity changes during the
// 10-second window should preferably go
// through orderItemService.
// ======================================

export const updateOrder = async (id, orderData) => {
  if (!id) {
    throw new Error("Order ID is required.");
  }

  if (!orderData) {
    throw new Error("Order update data is required.");
  }

  const response = await api.put(`/order/${id}`, orderData);

  return response.data;
};

// ======================================
// CONFIRM ORDER
// ======================================
//
// Called when the 10-second edit window
// expires.
//
// Backend route:
//
// POST /order/:id/confirm
//
// Expected lifecycle:
//
// pending_confirmation
//          ↓
//      confirmed
//
// This endpoint should be idempotent.
// Calling it again on an already confirmed
// order should simply return that order.
// ======================================

export const confirmOrder = async (id) => {
  if (!id) {
    throw new Error("Order ID is required to confirm an order.");
  }

  const response = await api.post(`/order/${id}/confirm`);

  return response.data;
};

// ======================================
// DELETE ORDER
// ======================================
//
// Be careful with this endpoint.
//
// For normal customer behaviour it is
// usually better to CANCEL an order rather
// than physically delete it from MongoDB.
//
// You can keep this for admin/development
// use if needed.
// ======================================

export const deleteOrder = async (id) => {
  if (!id) {
    throw new Error("Order ID is required.");
  }

  const response = await api.delete(`/order/${id}`);

  return response.data;
};
