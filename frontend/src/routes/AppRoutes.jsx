// ==============================
// IMPORTS
// ==============================

import { Routes, Route } from "react-router-dom";

// Customer pages
import Restaurants from "../pages/customer/Restaurants";

function AppRoutes() {
  return (
    // ==============================
    // APPLICATION ROUTES
    // ==============================

    <Routes>
      {/* ==============================
          CUSTOMER ROUTES
      ============================== */}

      <Route path="/restaurants" element={<Restaurants />} />
    </Routes>
  );
}

export default AppRoutes;
