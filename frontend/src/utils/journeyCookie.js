// ======================================
// JOURNEY COOKIE SETTINGS
// ======================================

// Name used to identify the cookie
const JOURNEY_COOKIE_NAME = "localBiteJourney";

// Prevent the cookie from becoming too large
const MAX_JOURNEY_ROUTES = 15;

// ======================================
// GET ONE COOKIE
// ======================================

const getCookieValue = (cookieName) => {
  // Encode the cookie name before searching
  const encodedName = `${encodeURIComponent(cookieName)}=`;

  // Find the matching cookie
  const matchingCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(encodedName));

  // Return null when the cookie does not exist
  if (!matchingCookie) {
    return null;
  }

  // Return the decoded cookie value
  return decodeURIComponent(matchingCookie.substring(encodedName.length));
};

// ======================================
// GET USER JOURNEY
// ======================================

export const getJourney = () => {
  try {
    // Read the journey cookie
    const savedJourney = getCookieValue(JOURNEY_COOKIE_NAME);

    // Return an empty journey when no
    // cookie has been created yet
    if (!savedJourney) {
      return [];
    }

    // Convert the JSON string back
    // into a JavaScript array
    const journey = JSON.parse(savedJourney);

    // Make sure the stored value is an array
    return Array.isArray(journey) ? journey : [];
  } catch (error) {
    // Return an empty journey when the
    // cookie contains invalid information
    console.error("Failed to read user journey:", error);

    return [];
  }
};

// ======================================
// SAVE USER JOURNEY
// ======================================

const saveJourney = (journey) => {
  // Only keep the most recent routes
  const limitedJourney = journey.slice(-MAX_JOURNEY_ROUTES);

  // Convert the journey array into JSON
  const cookieValue = encodeURIComponent(JSON.stringify(limitedJourney));

  // Create a session cookie
  document.cookie =
    `${encodeURIComponent(JOURNEY_COOKIE_NAME)}=${cookieValue}; ` +
    "Path=/; SameSite=Lax";
};

// ======================================
// RECORD CURRENT ROUTE
// ======================================

export const recordRoute = (route) => {
  // Get the existing route journey
  const journey = getJourney();

  // Get the most recently saved route
  const latestRoute = journey[journey.length - 1];

  // Prevent the same route from being
  // added repeatedly during re-renders
  if (latestRoute === route) {
    return;
  }

  // Add the new route
  journey.push(route);

  // Save the updated route journey
  saveJourney(journey);
};

// ======================================
// GET PREVIOUS ROUTE
// ======================================

export const takePreviousRoute = (
  currentRoute,
  fallbackRoute = "/restaurants",
) => {
  // Get the existing route journey
  const journey = getJourney();

  // Find the current page inside
  // the saved journey
  const currentRouteIndex = journey.lastIndexOf(currentRoute);

  // Remove the current page and any
  // routes that may appear after it
  if (currentRouteIndex !== -1) {
    journey.splice(currentRouteIndex);
  }

  // Remove and return the previous route
  const previousRoute = journey.pop() || fallbackRoute;

  // Save the shortened journey
  saveJourney(journey);

  return previousRoute;
};

// ======================================
// CLEAR USER JOURNEY
// ======================================

export const clearJourney = () => {
  // Expire the cookie immediately
  document.cookie =
    `${encodeURIComponent(JOURNEY_COOKIE_NAME)}=; ` +
    "Max-Age=0; Path=/; SameSite=Lax";
};
