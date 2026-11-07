// ======================================
// IMPORTS
// ======================================

import { useLocation, useNavigate } from "react-router-dom";

import { takePreviousRoute } from "../../utils/journeyCookie";

// ======================================
// BACK BUTTON COMPONENT
// ======================================

const BackButton = ({ fallbackRoute = "/restaurants", label = "Back" }) => {
  // React Router navigation tools
  const navigate = useNavigate();
  const location = useLocation();

  // ======================================
  // HANDLE BACK BUTTON
  // ======================================

  const handleBack = () => {
    // Build the complete current URL
    const currentRoute =
      `${location.pathname}` + `${location.search}` + `${location.hash}`;

    // Get the previous page from the
    // journey cookie
    const previousRoute = takePreviousRoute(currentRoute, fallbackRoute);

    // Go to the previous page without
    // adding another history entry
    navigate(previousRoute, {
      replace: true,
    });
  };

  // ======================================
  // RETURN BUTTON
  // ======================================

  return (
    <button type="button" className="btn btn-primary" onClick={handleBack}>
      {label}
    </button>
  );
};

// ======================================
// EXPORT COMPONENT
// ======================================

export default BackButton;
