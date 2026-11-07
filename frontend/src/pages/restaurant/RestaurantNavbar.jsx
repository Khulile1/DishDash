// ======================================
// IMPORTS
// ======================================

import { useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Store,
  User,
  Utensils,
  X,
} from "lucide-react";

import { logoutUser } from "../../services/authService";
import logo from "../../assets/logo.png";
import "../../styles/RestaurantNavbar.css";

// ======================================
// RESTAURANT NAVBAR
// ======================================

function RestaurantNavbar() {
  const navigate = useNavigate();

  // Controls mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ======================================
  // CLOSE MOBILE MENU
  // ======================================

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // ======================================
  // NAV LINK CLASS
  // ======================================

  const getNavClass = ({ isActive }) => {
    return isActive
      ? "restaurant-navbar-link active"
      : "restaurant-navbar-link";
  };

  // ======================================
  // LOGOUT
  // ======================================

  const handleLogout = () => {
    // Remove token and user
    logoutUser();

    // Close mobile menu
    closeMenu();

    // Return to login
    navigate("/login", {
      replace: true,
    });
  };

  // ======================================
  // NAVBAR
  // ======================================

  return (
    <header className="restaurant-navbar">
      <div className="restaurant-navbar-shell">
        {/* ==============================
            LOGO
        ============================== */}

        <NavLink
          to="/restaurant"
          className="restaurant-navbar-logo"
          onClick={closeMenu}
        >
          <img src={logo} alt="Dish Dash" />
        </NavLink>

        {/* ==============================
            NAVIGATION
        ============================== */}

        <nav
          className={
            isMenuOpen
              ? "restaurant-navbar-links is-open"
              : "restaurant-navbar-links"
          }
        >
          {/* DASHBOARD */}
          <NavLink
            to="/restaurant"
            end
            className={getNavClass}
            onClick={closeMenu}
          >
            <LayoutDashboard size={18} />

            <span>Dashboard</span>
          </NavLink>

          {/* MENU */}
          <NavLink
            to="/restaurant/menu"
            className={getNavClass}
            onClick={closeMenu}
          >
            <Utensils size={18} />

            <span>Menu</span>
          </NavLink>

          {/* INVENTORY */}
          <NavLink
            to="/restaurant/inventory"
            className={getNavClass}
            onClick={closeMenu}
          >
            <Package size={18} />

            <span>Inventory</span>
          </NavLink>

          {/* ORDERS */}
          <NavLink
            to="/restaurant/orders"
            className={getNavClass}
            onClick={closeMenu}
          >
            <ClipboardList size={18} />

            <span>Orders</span>
          </NavLink>

          {/* RESTAURANT PROFILE */}
          <NavLink
            to="/restaurant/profile"
            className={getNavClass}
            onClick={closeMenu}
          >
            <Store size={18} />

            <span>Restaurant</span>
          </NavLink>

          {/* ANALYTICS */}
          <NavLink
            to="/restaurant/analytics"
            className={getNavClass}
            onClick={closeMenu}
          >
            <BarChart3 size={18} />

            <span>Analytics</span>
          </NavLink>
        </nav>

        {/* ==============================
            RIGHT SIDE ACTIONS
        ============================== */}

        <div className="restaurant-navbar-actions">
          {/* LOGOUT */}
          <button
            type="button"
            className="restaurant-navbar-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />

            <span>Logout</span>
          </button>

          {/* USER PROFILE */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "restaurant-navbar-profile active"
                : "restaurant-navbar-profile"
            }
            aria-label="Open user profile"
            title="Profile"
            onClick={closeMenu}
          >
            <User size={20} />
          </NavLink>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="restaurant-navbar-mobile-button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X size={21} /> : <MenuIcon size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}

// ======================================
// EXPORT
// ======================================

export default RestaurantNavbar;
