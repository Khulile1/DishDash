// ======================================
// GEOAPIFY ROUTING SERVICE
// ======================================

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

// ======================================
// CHECK API KEY
// ======================================

const ensureApiKey = () => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }
};

// ======================================
// VALIDATE COORDINATES
// ======================================

const validateCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

// ======================================
// CALCULATE ONE DRIVING ROUTE
// ======================================

const calculateDrivingRoute = async ({ origin, destination }) => {
  ensureApiKey();

  // ======================================
  // VALIDATE
  // ======================================

  if (!validateCoordinate(origin?.latitude, origin?.longitude)) {
    throw new Error("Invalid origin coordinates.");
  }

  if (!validateCoordinate(destination?.latitude, destination?.longitude)) {
    throw new Error("Invalid destination coordinates.");
  }

  // ======================================
  // WAYPOINTS
  // ======================================

  const waypoints =
    `${origin.latitude},${origin.longitude}|` +
    `${destination.latitude},${destination.longitude}`;

  // ======================================
  // PARAMETERS
  // ======================================

  const params = new URLSearchParams({
    waypoints,

    mode: "drive",

    type: "balanced",

    traffic: "free_flow",

    units: "metric",

    format: "geojson",

    apiKey: GEOAPIFY_API_KEY,
  });

  const url = `https://api.geoapify.com/v1/routing?${params.toString()}`;

  // ======================================
  // CALL GEOAPIFY
  // ======================================

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();

    console.error("GEOAPIFY ROUTE ERROR:", response.status, body);

    throw new Error("Geoapify could not calculate the route.");
  }

  const data = await response.json();

  const route = data.features?.[0];

  if (!route) {
    throw new Error("No route was returned by Geoapify.");
  }

  // ======================================
  // VALUES
  // ======================================

  const distanceMeters = Number(route.properties?.distance || 0);

  const durationSeconds = Number(route.properties?.time || 0);

  // ======================================
  // RETURN
  // ======================================

  return {
    distanceMeters,

    distanceKm: Number((distanceMeters / 1000).toFixed(1)),

    durationSeconds,

    durationMinutes: Math.ceil(durationSeconds / 60),

    origin: {
      latitude: Number(origin.latitude),

      longitude: Number(origin.longitude),
    },

    destination: {
      latitude: Number(destination.latitude),

      longitude: Number(destination.longitude),
    },

    routeGeoJson: data,
  };
};

// ======================================
// CALCULATE ROUTES TO ALL RESTAURANTS
// ======================================

const calculateDrivingMatrix = async ({ origin, destinations }) => {
  ensureApiKey();

  // ======================================
  // VALIDATE ORIGIN
  // ======================================

  if (!validateCoordinate(origin?.latitude, origin?.longitude)) {
    throw new Error("Invalid origin coordinates.");
  }

  // ======================================
  // VALIDATE DESTINATIONS
  // ======================================

  if (!Array.isArray(destinations) || destinations.length === 0) {
    return [];
  }

  const validDestinations = destinations.filter((destination) =>
    validateCoordinate(destination.latitude, destination.longitude),
  );

  if (validDestinations.length === 0) {
    return [];
  }

  // ======================================
  // GEOAPIFY MATRIX BODY
  // ======================================
  //
  // IMPORTANT:
  //
  // Matrix coordinates use:
  //
  // [longitude, latitude]
  //
  // NOT:
  //
  // [latitude, longitude]
  //
  // ======================================

  const body = {
    mode: "drive",

    type: "balanced",

    traffic: "free_flow",

    units: "metric",

    sources: [
      {
        location: [Number(origin.longitude), Number(origin.latitude)],
      },
    ],

    targets: validDestinations.map((destination) => ({
      location: [Number(destination.longitude), Number(destination.latitude)],
    })),
  };

  // ======================================
  // URL
  // ======================================

  const url =
    "https://api.geoapify.com/v1/routematrix" +
    `?apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`;

  // ======================================
  // CALL GEOAPIFY
  // ======================================

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("GEOAPIFY MATRIX ERROR:", response.status, errorBody);

    throw new Error("Geoapify could not calculate restaurant travel times.");
  }

  const data = await response.json();

  // ======================================
  // ONE CUSTOMER = FIRST MATRIX ROW
  // ======================================

  const matrixRow = Array.isArray(data.sources_to_targets?.[0])
    ? data.sources_to_targets[0]
    : [];

  // ======================================
  // BUILD ONE RESULT PER RESTAURANT
  // ======================================

  const results = validDestinations.map((destination, index) => {
    // ======================================
    // FIND MATCHING MATRIX CELL
    // ======================================

    const matrixCell =
      matrixRow.find((cell) => Number(cell?.target_index) === index) ||
      matrixRow[index] ||
      null;

    // ======================================
    // NO ROUTE
    // ======================================

    if (!matrixCell || matrixCell.distance == null || matrixCell.time == null) {
      return {
        restaurantId: String(destination.restaurantId),

        restaurantName: destination.restaurantName || "",

        reachable: false,

        distanceMeters: null,

        distanceKm: null,

        durationSeconds: null,

        durationMinutes: null,
      };
    }

    // ======================================
    // DISTANCE
    // ======================================

    const distanceMeters = Number(matrixCell.distance);

    // ======================================
    // TIME
    // ======================================

    const durationSeconds = Number(matrixCell.time);

    // ======================================
    // RESULT
    // ======================================

    return {
      restaurantId: String(destination.restaurantId),

      restaurantName: destination.restaurantName || "",

      reachable: true,

      distanceMeters,

      distanceKm: Number((distanceMeters / 1000).toFixed(1)),

      durationSeconds,

      durationMinutes: Math.ceil(durationSeconds / 60),
    };
  });

  // ======================================
  // DEBUG
  // ======================================

  console.log("ROUTE MATRIX RESTAURANTS:", results);

  return results;
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  calculateDrivingRoute,
  calculateDrivingMatrix,
};
