// Import the configured Axios instance
import api from "./api";

// ==============================
// CREATE RESTAURANT
// ==============================

export const createRestaurant = async (restaurantData) => {
  const response = await api.post("/restaurant", restaurantData);

  return response.data;
};

// ==============================
// GET ALL RESTAURANTS
// CUSTOMER SIDE
// ==============================

export const getRestaurants = async () => {
  const response = await api.get("/restaurant");

  return response.data;
};

// ==============================
// GET LOGGED-IN OWNER'S RESTAURANTS
// RESTAURANT SIDE
// ==============================

export const getMyRestaurants = async () => {
  const response = await api.get("/restaurant/my-restaurants");

  return response.data;
};

// ==============================
// GET ONE RESTAURANT
// ==============================

export const getRestaurant = async (id) => {
  const response = await api.get(`/restaurant/${id}`);

  return response.data;
};

// ==============================
// UPDATE RESTAURANT
// ==============================

export const updateRestaurant = async (id, restaurantData) => {
  const response = await api.put(`/restaurant/${id}`, restaurantData);

  return response.data;
};

// ==============================
// DELETE RESTAURANT
// ==============================

export const deleteRestaurant = async (id) => {
  const response = await api.delete(`/restaurant/${id}`);

  return response.data;
};
