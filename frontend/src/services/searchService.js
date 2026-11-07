// ==============================
// IMPORTS
// ==============================

import api from "./api";

// ==============================
// GLOBAL SEARCH
// ==============================

export const searchDishDash = async (query, limit = 6) => {
  const response = await api.get("/search", {
    params: {
      q: query,
      limit,
    },
  });

  return response.data;
};
