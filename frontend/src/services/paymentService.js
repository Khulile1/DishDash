// ======================================
// IMPORTS
// ======================================

import api from "./api";

// ======================================
// PROCESS ORDER PAYMENT
// ======================================
//
// Used by the payment gateway page.
//
// Flow:
//
// awaiting_payment
//        ↓
// POST /payment/checkout
//        ↓
// create Payment
//        ↓
// confirm payment
//        ↓
// Order becomes confirmed
//
// IMPORTANT:
//
// Never send:
//
// - full card number
// - CVV
// - PIN
//
// For a real card provider later, the
// card should be tokenised by the payment
// provider first.
// ======================================

export const processOrderPayment = async (paymentData) => {
  if (!paymentData) {
    throw new Error("Payment data is required.");
  }

  if (!paymentData.order_id) {
    throw new Error("Order ID is required.");
  }

  if (!paymentData.method) {
    throw new Error("Payment method is required.");
  }

  const response = await api.post("/payment/checkout", paymentData);

  return response.data;
};

// ======================================
// CREATE PAYMENT
// ======================================
//
// Can still be useful for direct payment
// creation if required elsewhere.
// ======================================

export const createPayment = async (paymentData) => {
  if (!paymentData) {
    throw new Error("Payment data is required.");
  }

  const response = await api.post("/payment", paymentData);

  return response.data;
};

// ======================================
// GET ALL CUSTOMER PAYMENTS
// ======================================
//
// Backend should only return payments
// belonging to the logged-in customer.
// ======================================

export const getPayments = async () => {
  const response = await api.get("/payment");

  return response.data;
};

// ======================================
// GET ONE PAYMENT
// ======================================

export const getPayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.get(`/payment/${paymentId}`);

  return response.data;
};

// ======================================
// GET PAYMENT BY ORDER
// ======================================
//
// Useful on:
//
// Order Details page
// Payment result page
// Payment history
// ======================================

export const getPaymentByOrder = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const response = await api.get(`/payment/order/${orderId}`);

  return response.data;
};

// ======================================
// UPDATE PAYMENT
// ======================================
//
// Only use this for customer-editable
// payment information while the backend
// allows it.
//
// Payment status itself should not be
// freely editable by the customer.
// ======================================

export const updatePayment = async (paymentId, paymentData) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  if (!paymentData) {
    throw new Error("Payment data is required.");
  }

  const response = await api.put(`/payment/${paymentId}`, paymentData);

  return response.data;
};

// ======================================
// PATCH PAYMENT
// ======================================
//
// Same idea as updatePayment, but useful
// when only changing one or two fields.
// ======================================

export const patchPayment = async (paymentId, paymentData) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  if (!paymentData) {
    throw new Error("Payment data is required.");
  }

  const response = await api.patch(`/payment/${paymentId}`, paymentData);

  return response.data;
};

// ======================================
// DELETE PAYMENT
// ======================================
//
// Your backend should only allow this
// while the related order is still in an
// editable/cancellable state.
//
// Real completed payment records should
// normally not be physically deleted.
// ======================================

export const deletePayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const response = await api.delete(`/payment/${paymentId}`);

  return response.data;
};
