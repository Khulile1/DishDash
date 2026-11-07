// ==============================
// IMPORTS
// ==============================

import api from "./api";

// ==============================
// CREATE MENU ITEM
// RESTAURANT OWNER
// ==============================

export const createMenuItem = async (menuItemData) => {
  const response = await api.post("/menuItems", menuItemData);

  return response.data;
};

// ==============================
// GET ALL MENU ITEMS
// CUSTOMER SIDE
// ==============================

export const getMenuItems = async () => {
  const response = await api.get("/menuItems");

  return response.data;
};

// ==============================
// GET LOGGED-IN OWNER'S
// SELECTED RESTAURANT MENU
// ==============================

export const getMyMenuItems = async (restaurantId) => {
  const response = await api.get("/menuItems/my-menu", {
    params: {
      restaurant_id: restaurantId,
    },
  });

  return response.data;
};

// ==============================
// GET ONE MENU ITEM
// ==============================

export const getMenuItem = async (id) => {
  const response = await api.get(`/menuItems/${id}`);

  return response.data;
};

// ==============================
// UPDATE MENU ITEM
// RESTAURANT OWNER
// ==============================

export const updateMenuItem = async (id, menuItemData) => {
  const response = await api.put(`/menuItems/${id}`, menuItemData);

  return response.data;
};

// ==============================
// DELETE MENU ITEM
// RESTAURANT OWNER
// ==============================

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menuItems/${id}`);

  return response.data;
};

// ==============================
// UPDATE STOCK
// ==============================

export const updateMenuItemStock = async (id, stockData) => {
  const response = await api.patch(`/menuItems/${id}/stock`, stockData);

  return response.data;
};

// ==============================
// INCREASE STOCK
// ==============================

export const increaseMenuItemStock = async (id, amount = 1) => {
  const response = await api.patch(`/menuItems/${id}/stock/increase`, {
    amount,
  });

  return response.data;
};

// ==============================
// DECREASE STOCK
// ==============================

export const decreaseMenuItemStock = async (id, amount = 1) => {
  const response = await api.patch(`/menuItems/${id}/stock/decrease`, {
    amount,
  });

  return response.data;
};
