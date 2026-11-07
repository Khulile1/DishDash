import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  // No token -> Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    console.log("USER ROLE:", decoded.role);
    console.log("ALLOWED ROLES:", allowedRoles);

    // Check token expiry
    if (
      decoded.exp &&
      decoded.exp * 1000 <= Date.now()
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return <Navigate to="/login" replace />;
    }

    // Check role
    if (
      allowedRoles &&
      !allowedRoles.includes(decoded.role)
    ) {
      // Customer tried to access restaurant page
      if (decoded.role === "customer") {
        return <Navigate to="/home" replace />;
      }

      // Restaurant tried to access customer page
      if (decoded.role === "restaurant") {
        return <Navigate to="/restaurant" replace />;
      }

      // Any unknown role
      return <Navigate to="/unauthorized" replace />;
    }

    // Correct role
    return children;

  } catch (error) {
    console.error("TOKEN ERROR:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;