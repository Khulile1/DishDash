// ======================================
// IMPORTS
// ======================================

import { jwtDecode } from "jwt-decode";

import ProtectedRoute from "../../components/common/ProtectedRoute";

import Restaurants from "../customer/RestaurantsPage";

import PublicRestaurantsPage from "./PublicRestaurantsPage";

// ======================================
// GET ROLE
// ======================================

const getCurrentRole = () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return "";
    }

    const decoded = jwtDecode(token);

    if (decoded?.exp && Number(decoded.exp) * 1000 <= Date.now()) {
      return "";
    }

    const role = decoded?.role || decoded?.user?.role || "";

    return String(role).trim().toLowerCase();
  } catch (error) {
    console.error("Could not read role:", error);

    return "";
  }
};

// ======================================
// PAGE
// ======================================

function RestaurantsEntryPage() {
  const role = getCurrentRole();

  // ======================================
  // CUSTOMER
  // ======================================

  if (role === "customer") {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <Restaurants />
      </ProtectedRoute>
    );
  }

  // ======================================
  // PUBLIC
  // ======================================

  return <PublicRestaurantsPage />;
}

export default RestaurantsEntryPage;
