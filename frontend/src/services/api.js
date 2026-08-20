// Import Axios so the frontend can send HTTP requests to the backend
import axios from "axios";

// Create a reusable Axios instance for the Local Bite backend
const api = axios.create({
  // Base URL for all backend API requests
  // Example:
  // api.get("/restaurants")
  // becomes:
  // http://localhost:5324/api/restaurants
  baseURL: "http://localhost:5324/api",

  // Tell the backend that we are sending JSON data
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor runs BEFORE every request is sent to the backend
api.interceptors.request.use((config) => {
  // Get the JWT token saved in the browser after login
  const token = localStorage.getItem("token");

  // If the user has a token, add it to the request
  if (token) {
    // Send the token in the Authorization header
    // Example:
    // Authorization: Bearer eyJhbGciOiJIUzI1Ni...
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Return the request configuration so Axios can send the request
  return config;
});

// Export the configured Axios instance
// Other files can now import and use "api"
export default api;