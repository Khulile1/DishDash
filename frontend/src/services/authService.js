// Import the configured Axios instance
import api from "./api";

// Register a new user
export const registerUser = async (userData) => {
  // Sends:
  // POST http://localhost:5324/api/auth/register
  const response = await api.post("/auth/register", userData);

  // Return the backend response data
  return response.data;
};

// Login an existing user
export const loginUser = async (email, password) => {
  // Sends:
  // POST http://localhost:5324/api/auth/login
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  // Return the backend response data
  return response.data;
};

// Logout the current user
export const logoutUser = () => {
  // Remove the JWT token from browser storage
  localStorage.removeItem("token");

  // Remove saved user information
  localStorage.removeItem("user");
};