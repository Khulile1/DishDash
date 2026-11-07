// ======================================
// IMPORTS
// ======================================

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { recordRoute } from "../../utils/journeyCookie";

// ======================================
// JOURNEY TRACKER
// ======================================

const JourneyTracker = () => {
  // Get the user's current route
  const location = useLocation();

  // ======================================
  // RECORD ROUTE CHANGES
  // ======================================

  useEffect(() => {
    // Build the complete frontend route
    const currentRoute =
      `${location.pathname}` + `${location.search}` + `${location.hash}`;

    // Save the route in the journey cookie
    recordRoute(currentRoute);
  }, [location.pathname, location.search, location.hash]);

  // This component does not display
  // anything on the screen
  return null;
};

// ======================================
// EXPORT COMPONENT
// ======================================

export default JourneyTracker;
