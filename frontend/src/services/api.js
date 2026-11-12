// ======================================
// IMPORTS
// ======================================

import axios from "axios";

// ======================================
// API INSTANCE
// ======================================

const api = axios.create({
  baseURL: "https://dish-dash-backend-ogtn.onrender.com/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================
// LOADING EVENTS
// ======================================

const startGlobalLoader = () => {
  window.dispatchEvent(new Event("api-loading-start"));
};

const stopGlobalLoader = () => {
  window.dispatchEvent(new Event("api-loading-end"));
};

// ======================================
// REQUEST INTERCEPTOR
// ======================================

// Runs before every API request
api.interceptors.request.use(
  (config) => {
    // ======================================
    // START TRUCK LOADER
    // ======================================

    // Allows specific requests to skip
    // the loader if needed later.
    if (!config.skipGlobalLoader) {
      startGlobalLoader();

      // Mark this request so we know
      // that it started a loader.
      config._usesGlobalLoader = true;
    }

    // ======================================
    // GET JWT TOKEN
    // ======================================

    const token = localStorage.getItem("token");

    // ======================================
    // ADD JWT
    // ======================================

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    // If request setup itself fails
    // there may not be a backend response.
    return Promise.reject(error);
  },
);

// ======================================
// RESPONSE INTERCEPTOR
// ======================================

// Runs after every successful
// or failed API response
api.interceptors.response.use(
  // ======================================
  // SUCCESS
  // ======================================

  (response) => {
    // Stop loader only if this
    // request started one
    if (response.config?._usesGlobalLoader) {
      stopGlobalLoader();
    }

    return response;
  },

  // ======================================
  // ERROR
  // ======================================

  (error) => {
    // ======================================
    // STOP TRUCK LOADER
    // ======================================

    if (error.config?._usesGlobalLoader) {
      stopGlobalLoader();
    }

    // ======================================
    // UNAUTHORIZED
    // ======================================

    if (error.response?.status === 401) {
      // Remove expired or
      // invalid login information
      localStorage.removeItem("token");

      localStorage.removeItem("user");

      // ======================================
      // REDIRECT TO LOGIN
      // ======================================

      // Prevent endless redirect
      // if we are already on login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ======================================
// EXPORT
// ======================================

export default api;
