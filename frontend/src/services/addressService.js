import api from "./api";

// ======================================
// CREATE ADDRESS
// ======================================

export const createAddress = async (addressData) => {
  const response = await api.post("/addresses", addressData);

  return response.data;
};

// ======================================
// GET ALL USER ADDRESSES
// ======================================

export const getAddresses = async () => {
  const response = await api.get("/addresses");

  return response.data;
};

// ======================================
// GET ONE ADDRESS
// ======================================

export const getAddress = async (id) => {
  const response = await api.get(`/addresses/${id}`);

  return response.data;
};

// ======================================
// UPDATE ADDRESS
// ======================================

export const updateAddress = async (id, addressData) => {
  const response = await api.put(`/addresses/${id}`, addressData);

  return response.data;
};

// ======================================
// SET DEFAULT ADDRESS
// ======================================

export const setDefaultAddress = async (id) => {
  const response = await api.put(`/addresses/${id}`, {
    is_default: true,
  });

  return response.data;
};

// ======================================
// DELETE ADDRESS
// ======================================

export const deleteAddress = async (id) => {
  const response = await api.delete(`/addresses/${id}`);

  return response.data;
};
