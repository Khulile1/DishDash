// ======================================
// IMPORTS
// ======================================

import api from "./api";

// ======================================
// SEARCH ADDRESSES
// ======================================

export const searchAddresses = async (text) => {
  const response = await api.get("/maps/autocomplete", {
    params: {
      text,
    },
  });

  return response.data;
};

// ======================================
// VERIFY SELECTED ADDRESS
// REVERSE GEOCODING
// ======================================

export const reverseAddress = async ({ latitude, longitude }) => {
  const response = await api.get("/maps/reverse", {
    params: {
      latitude,
      longitude,
    },
  });

  return response.data;
};

// ======================================
// GET DRIVING ROUTE
// LEGACY MAP ROUTE
// ======================================
//
// Restaurant driving distance now uses
// routingService.js.
//
// Keep this temporarily if another page
// still uses /maps/route.
//

export const getDrivingRoute = async ({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
}) => {
  const response = await api.post("/maps/route", {
    fromLatitude,
    fromLongitude,
    toLatitude,
    toLongitude,
  });

  return response.data;
};
