// ======================================
// IMPORTS
// ======================================

import { useState } from "react";

import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../assets/DishDash.png";

import "../../styles/PublicNavbar.css";

// ======================================
// PUBLIC NAVBAR
// ======================================

function PublicNavbar({ overlay = false }) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // ======================================
  // CLOSE MENU
  // ======================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ======================================
  // NAV CLASS
  // ======================================

  const getLinkClass = ({ isActive }) => {
    return isActive
      ? "public-navbar-link public-navbar-link--active"
      : "public-navbar-link";
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <header
      className={
        overlay ? "public-navbar public-navbar--overlay" : "public-navbar"
      }
    >
      <div className="public-navbar-shell">
        {/* ======================================
            LOGO
        ====================================== */}

        <NavLink
          to="/"
          className="public-navbar-logo"
          aria-label="Dish Dash home"
          onClick={closeMenu}
        >
          <img src={logo} alt="Dish Dash" />
        </NavLink>

        {/* ======================================
            MOBILE BUTTON
        ====================================== */}

        <button
          type="button"
          className="public-navbar-menu-button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* ======================================
            PANEL
        ====================================== */}

        <div
          className={
            menuOpen
              ? "public-navbar-panel public-navbar-panel--open"
              : "public-navbar-panel"
          }
        >
          {/* ======================================
              MAIN LINKS
          ====================================== */}

          <nav className="public-navbar-links" aria-label="Public navigation">
            <NavLink to="/" end className={getLinkClass} onClick={closeMenu}>
              Home
            </NavLink>

            <NavLink
              to="/how-it-works"
              className={getLinkClass}
              onClick={closeMenu}
            >
              How it works
            </NavLink>

            <NavLink
              to="/restaurants"
              className={getLinkClass}
              onClick={closeMenu}
            >
              Restaurants
            </NavLink>
          </nav>

          {/* ======================================
              AUTH
          ====================================== */}

          <div className="public-navbar-actions">
            <button
              type="button"
              className="public-navbar-login"
              onClick={() => {
                closeMenu();
                navigate("/login");
              }}
            >
              Log in
            </button>

            <button
              type="button"
              className="public-navbar-order"
              onClick={() => {
                closeMenu();
                navigate("/register");
              }}
            >
              Order Now
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
