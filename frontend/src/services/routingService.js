// ======================================
// IMPORTS
// ======================================

import api from "./api";

// ======================================
// GET DRIVING TIMES TO ALL RESTAURANTS
// ======================================

export const getRestaurantDistances = async () => {
  const response = await api.get("/routes/restaurants");

  return response.data;
};

// ======================================
// GET ONE RESTAURANT ROUTE
// ======================================

export const getRestaurantRoute = async (restaurantId) => {
  const response = await api.get(`/routes/restaurant/${restaurantId}`);

  return response.data;
};

// ======================================
// GET CHECKOUT DELIVERY QUOTE
// ======================================

export const getDeliveryQuote = async ({
  restaurantIds,
  subtotal,
  addressId,
}) => {
  const response = await api.post("/routes/delivery-quote", {
    restaurantIds,

    subtotal,

    addressId,
  });

  return response.data;
};
