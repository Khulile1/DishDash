// ======================================
// GEOAPIFY MAP CONTROLLER
// ======================================

// ======================================
// GET API KEY
// ======================================

const getGeoapifyApiKey = () => {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }

  return apiKey;
};

// ======================================
// VALIDATE COORDINATES
// ======================================

const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lon,
  };
};

// ======================================
// BUILD CLEAN STREET ADDRESS
// ======================================

const buildStreetAddress = (place) => {
  // Prefer the actual house number
  // and street returned by Geoapify.

  const exactStreetAddress = [place.housenumber, place.street]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (exactStreetAddress) {
    return exactStreetAddress;
  }

  // For named buildings / amenities.
  if (place.address_line1) {
    return place.address_line1;
  }

  return "";
};

// ======================================
// IS PRECISE DELIVERY LOCATION
// ======================================

const isPreciseLocation = (place) => {
  // Exact building
  if (place.result_type === "building") {
    return true;
  }

  // Business, school, mall, restaurant,
  // hospital, etc.
  if (place.result_type === "amenity") {
    return true;
  }

  // A street result is only treated as
  // precise if Geoapify also found a
  // house number.
  if (place.result_type === "street" && place.street && place.housenumber) {
    return true;
  }

  return false;
};

// ======================================
// NORMALISE GEOAPIFY PLACE
// ======================================

const normalisePlace = (place) => {
  const latitude = Number(place.lat);

  const longitude = Number(place.lon);

  return {
    formatted: place.formatted || "",

    addressLine1: buildStreetAddress(place),

    addressLine2: place.address_line2 || "",

    street: place.street || "",

    houseNumber: place.housenumber || "",

    suburb: place.suburb || place.district || "",

    city: place.city || place.town || place.county || "",

    province: place.state || "",

    postcode: place.postcode || "",

    country: place.country || "",

    countryCode: place.country_code || "",

    latitude,

    longitude,

    placeId: place.place_id || null,

    // ======================================
    // ACCURACY INFORMATION
    // ======================================

    resultType: place.result_type || "unknown",

    confidence: Number(place.rank?.confidence || 0),

    streetConfidence: Number(place.rank?.confidence_street_level || 0),

    buildingConfidence: Number(place.rank?.confidence_building_level || 0),

    matchType: place.rank?.match_type || null,

    isPrecise: isPreciseLocation(place),
  };
};

// ======================================
// SEARCH / AUTOCOMPLETE ADDRESSES
// ======================================

const autocompleteAddress = async (req, res) => {
  try {
    const apiKey = getGeoapifyApiKey();

    // ======================================
    // GET SEARCH TEXT
    // ======================================

    const text = String(req.query.text || "").trim();

    // ======================================
    // VALIDATE
    // ======================================

    if (text.length < 3) {
      return res.status(400).json({
        message: "Enter at least 3 characters to search for an address.",
      });
    }

    // ======================================
    // GEOAPIFY PARAMETERS
    // ======================================

    const params = new URLSearchParams({
      text,

      format: "json",

      limit: "10",

      lang: "en",

      // South Africa only
      filter: "countrycode:za",

      apiKey,
    });

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;

    // ======================================
    // CALL GEOAPIFY
    // ======================================

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();

      console.error("GEOAPIFY AUTOCOMPLETE ERROR:", response.status, body);

      return res.status(502).json({
        message: "Address search service is currently unavailable.",
      });
    }

    const data = await response.json();

    // ======================================
    // NORMALISE RESULTS
    // ======================================

    const allResults = (data.results || [])
      .map(normalisePlace)
      .filter(
        (place) =>
          Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
      );

    // ======================================
    // PRECISE DELIVERY RESULTS ONLY
    // ======================================

    const preciseResults = allResults.filter((place) => place.isPrecise);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      results: preciseResults,

      totalFound: allResults.length,

      preciseFound: preciseResults.length,
    });
  } catch (error) {
    console.error("AUTOCOMPLETE ADDRESS ERROR:", error);

    return res.status(500).json({
      message: "Server error while searching for addresses.",
    });
  }
};

// ======================================
// REVERSE GEOCODE COORDINATES
// ======================================
//
// This is important for accuracy.
//
// After the customer chooses a suggestion,
// we can ask Geoapify:
//
// "What precise address is actually at
// these coordinates?"
//
// This helps make the displayed address
// agree with the selected map point.
//
// ======================================

const reverseAddress = async (req, res) => {
  try {
    const apiKey = getGeoapifyApiKey();

    const coordinates = validateCoordinates(
      req.query.latitude,
      req.query.longitude,
    );

    if (!coordinates) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required.",
      });
    }

    // ======================================
    // GEOAPIFY REVERSE URL
    // ======================================

    const params = new URLSearchParams({
      lat: String(coordinates.latitude),

      lon: String(coordinates.longitude),

      format: "json",

      lang: "en",

      apiKey,
    });

    const url = `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`;

    // ======================================
    // CALL GEOAPIFY
    // ======================================

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();

      console.error("GEOAPIFY REVERSE ERROR:", response.status, body);

      return res.status(502).json({
        message: "Could not verify the selected address.",
      });
    }

    const data = await response.json();

    const place = data.results?.[0];

    if (!place) {
      return res.status(404).json({
        message: "No address was found at the selected location.",
      });
    }

    // ======================================
    // NORMALISE VERIFIED ADDRESS
    // ======================================

    const location = normalisePlace(place);

    return res.status(200).json({
      location,
    });
  } catch (error) {
    console.error("REVERSE ADDRESS ERROR:", error);

    return res.status(500).json({
      message: "Server error while verifying address.",
    });
  }
};

// ======================================
// CALCULATE DRIVING ROUTE
// ======================================
//
// Keep this temporarily if anything still
// uses /api/maps/route.
//
// Your new /api/routes service should be
// the main restaurant routing system.
//
// ======================================

const calculateRoute = async (req, res) => {
  try {
    const apiKey = getGeoapifyApiKey();

    const { fromLatitude, fromLongitude, toLatitude, toLongitude } =
      req.body || {};

    // ======================================
    // VALIDATE COORDINATES
    // ======================================

    const origin = validateCoordinates(fromLatitude, fromLongitude);

    const destination = validateCoordinates(toLatitude, toLongitude);

    if (!origin || !destination) {
      return res.status(400).json({
        message: "Valid restaurant and customer coordinates are required.",
      });
    }

    // ======================================
    // WAYPOINTS
    // ======================================

    const waypoints =
      `${origin.latitude},${origin.longitude}|` +
      `${destination.latitude},${destination.longitude}`;

    // ======================================
    // ROUTING PARAMETERS
    // ======================================

    const params = new URLSearchParams({
      waypoints,

      mode: "drive",

      type: "balanced",

      // Stable road-time estimate.
      traffic: "free_flow",

      units: "metric",

      format: "geojson",

      apiKey,
    });

    const url = `https://api.geoapify.com/v1/routing?${params.toString()}`;

    // ======================================
    // CALL GEOAPIFY
    // ======================================

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();

      console.error("GEOAPIFY ROUTING ERROR:", response.status, body);

      return res.status(502).json({
        message: "The route could not be calculated.",
      });
    }

    const routeData = await response.json();

    const route = routeData.features?.[0];

    if (!route) {
      return res.status(404).json({
        message: "No driving route was found between these locations.",
      });
    }

    // ======================================
    // DISTANCE
    // ======================================

    const distanceMeters = Number(route.properties?.distance || 0);

    const distanceKm = Number((distanceMeters / 1000).toFixed(1));

    // ======================================
    // TIME
    // ======================================

    const durationSeconds = Number(route.properties?.time || 0);

    const durationMinutes = Math.ceil(durationSeconds / 60);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      distanceMeters,

      distanceKm,

      durationSeconds,

      durationMinutes,

      origin,

      destination,

      route: routeData,
    });
  } catch (error) {
    console.error("CALCULATE ROUTE ERROR:", error);

    return res.status(500).json({
      message: "Server error while calculating route.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  autocompleteAddress,
  reverseAddress,
  calculateRoute,
};
