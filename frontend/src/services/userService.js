// Import the configured Axios instance
import api from "./api";


// ==============================
// CREATE USER
// ==============================

export const createUser = async (userData) => {
  const response = await api.post(
    "/user",
    userData
  );

  return response.data;
};


// ==============================
// GET ALL USERS
// ==============================

export const getUsers = async () => {
  const response = await api.get(
    "/user"
  );

  return response.data;
};


// ==============================
// GET ONE USER
// ==============================

export const getUser = async (id) => {
  const response = await api.get(
    `/user/${id}`
  );

  return response.data;
};


// ==============================
// UPDATE USER
// ==============================

export const updateUser = async (
  id,
  userData
) => {
  const response = await api.put(
    `/user/${id}`,
    userData
  );

  return response.data;
};


// ==============================
// DELETE USER
// ==============================

export const deleteUser = async (id) => {
  const response = await api.delete(
    `/user/${id}`
  );

  return response.data;
};