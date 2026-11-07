// ======================================
// IMPORTS
// ======================================

import { useEffect, useRef, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import {
  House,
  Utensils,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Store,
  Search,
  Heart,
  MapPin,
  User,
  Menu as MenuIcon,
  X,
} from "lucide-react";

import { logoutUser } from "../../services/authService";

import { getAddresses } from "../../services/addressService";

import { searchDishDash } from "../../services/searchService";

import useCart from "../../hooks/useCart";

import logo from "../../assets/logo.png";

import "../../styles/Navbar.css";
import "../../styles/NavbarSearchSuggestions.css";

// ======================================
// NAVBAR
// ======================================

function Navbar() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // SHARED CART
  // ======================================

  const { cartQuantity } = useCart();

  // ======================================
  // SEARCH STATE
  // ======================================

  const [searchTerm, setSearchTerm] = useState("");

  const [suggestions, setSuggestions] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  const [searchError, setSearchError] = useState("");

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ======================================
  // MOBILE MENU
  // ======================================

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ======================================
  // LOCATION
  // ======================================

  const [userLocation, setUserLocation] = useState(null);

  // ======================================
  // SEARCH REFERENCES
  // ======================================

  const desktopSearchButtonRef = useRef(null);

  const mobileSearchButtonRef = useRef(null);

  const searchPopupRef = useRef(null);

  // ======================================
  // CLOSE SEARCH
  // ======================================

  const closeSearch = () => {
    setIsSearchOpen(false);

    setSuggestions([]);

    setSearchError("");

    setIsSearching(false);
  };

  // ======================================
  // CLOSE MENU
  // ======================================

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // ======================================
  // CLOSE EVERYTHING
  // ======================================

  const closeNavigation = () => {
    closeMenu();

    closeSearch();
  };

  // ======================================
  // TOGGLE MOBILE MENU
  // ======================================

  const toggleMenu = () => {
    closeSearch();

    setIsMenuOpen((current) => !current);
  };

  // ======================================
  // TOGGLE SEARCH
  // ======================================

  const toggleSearch = () => {
    // Search and mobile menu should
    // never cover each other.
    setIsMenuOpen(false);

    setIsSearchOpen((current) => {
      const next = !current;

      if (!next) {
        setSuggestions([]);

        setSearchError("");

        setIsSearching(false);
      }

      return next;
    });
  };

  // ======================================
  // NAV LINK CLASS
  // ======================================

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? "navbar-link active" : "navbar-link";
  };

  // ======================================
  // PROFILE CLASS
  // ======================================

  const getProfileClass = ({ isActive }) => {
    return isActive ? "navbar-profile active" : "navbar-profile";
  };

  // ======================================
  // FAVOURITE CLASS
  // ======================================

  const getFavouriteClass = ({ isActive }) => {
    return isActive
      ? "navbar-account-favourite active"
      : "navbar-account-favourite";
  };

  // ======================================
  // MOBILE CART CLASS
  // ======================================

  const getMobileCartClass = ({ isActive }) => {
    return isActive
      ? "navbar-mobile-icon-button navbar-mobile-cart-button active"
      : "navbar-mobile-icon-button navbar-mobile-cart-button";
  };

  // ======================================
  // HANDLE SEARCH
  // ======================================

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      return;
    }

    navigate(`/menu?search=${encodeURIComponent(query)}`);

    closeNavigation();
  };

  // ======================================
  // SEARCH RESULT CLICK
  // ======================================

  const handleSuggestionClick = (suggestion) => {
    if (!suggestion) {
      return;
    }

    // ======================================
    // RESTAURANT
    // ======================================

    if (suggestion.type === "restaurant" && suggestion.id) {
      navigate(`/restaurants/${suggestion.id}`);

      setSearchTerm("");

      closeNavigation();

      return;
    }

    // ======================================
    // MENU ITEM
    // ======================================

    if (suggestion.type === "menuItem" && suggestion.id) {
      navigate(`/menu-items/${suggestion.id}`);

      setSearchTerm("");

      closeNavigation();

      return;
    }

    // ======================================
    // FALLBACK
    // ======================================

    if (suggestion.restaurant_id) {
      navigate(`/restaurants/${suggestion.restaurant_id}`);

      setSearchTerm("");

      closeNavigation();
    }
  };

  // ======================================
  // LOGOUT
  // ======================================

  const handleLogout = () => {
    logoutUser();

    closeNavigation();

    navigate("/login");
  };

  // ======================================
  // LIVE SEARCH
  // ======================================

  useEffect(() => {
    const query = searchTerm.trim();

    if (!isSearchOpen || query.length < 2) {
      setSuggestions([]);

      setSearchError("");

      setIsSearching(false);

      return undefined;
    }

    let isCurrentSearch = true;

    const timer = window.setTimeout(
      async () => {
        try {
          setIsSearching(true);

          setSearchError("");

          const data = await searchDishDash(query, 8);

          if (!isCurrentSearch) {
            return;
          }

          setSuggestions(
            Array.isArray(data?.suggestions) ? data.suggestions : [],
          );
        } catch (error) {
          if (!isCurrentSearch) {
            return;
          }

          console.error("Navbar search error:", error);

          setSuggestions([]);

          setSearchError(
            error.response?.data?.message ||
              "Could not load search suggestions.",
          );
        } finally {
          if (isCurrentSearch) {
            setIsSearching(false);
          }
        }
      },

      300,
    );

    return () => {
      isCurrentSearch = false;

      window.clearTimeout(timer);
    };
  }, [searchTerm, isSearchOpen]);

  // ======================================
  // LOAD LOCATION
  // ======================================

  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const data = await getAddresses();

        const addressList = Array.isArray(data)
          ? data
          : Array.isArray(data?.addresses)
            ? data.addresses
            : [];

        const defaultAddress = addressList.find(
          (address) => address.is_default === true,
        );

        setUserLocation(defaultAddress || addressList[0] || null);
      } catch (error) {
        console.error("Could not load user location:", error);

        setUserLocation(null);
      }
    };

    loadUserLocation();

    // Address page already dispatches this.
    window.addEventListener("addressChanged", loadUserLocation);

    return () => {
      window.removeEventListener("addressChanged", loadUserLocation);
    };
  }, []);

  // ======================================
  // CLICK OUTSIDE SEARCH
  // ======================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedDesktopButton = desktopSearchButtonRef.current?.contains(
        event.target,
      );

      const clickedMobileButton = mobileSearchButtonRef.current?.contains(
        event.target,
      );

      const clickedPopup = searchPopupRef.current?.contains(event.target);

      if (clickedDesktopButton || clickedMobileButton || clickedPopup) {
        return;
      }

      setIsSearchOpen(false);

      setSuggestions([]);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // ======================================
  // ESCAPE
  // ======================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);

        setIsMenuOpen(false);

        setSuggestions([]);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ======================================
  // PAGE
  // ======================================

  return (
    <nav className="navbar">
      <div className="navbar-shell">
        {/* ======================================
            LOGO
        ====================================== */}

        <NavLink
          to="/home"
          className="navbar-logo"
          aria-label="Go to Dish Dash home"
          onClick={closeNavigation}
        >
          <img src={logo} alt="Dish Dash" className="navbar-logo-image" />
        </NavLink>

        {/* ======================================
            LOCATION
        ====================================== */}

        <button
          type="button"
          className="navbar-location-button"
          onClick={() => {
            closeNavigation();

            navigate("/addresses");
          }}
        >
          <MapPin size={18} aria-hidden="true" />

          <div className="navbar-location-text">
            {userLocation ? (
              <>
                <span className="navbar-location-street">
                  {userLocation.street_address}
                </span>

                <span className="navbar-location-suburb">
                  {[userLocation.suburb, userLocation.city]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </>
            ) : (
              <span>Add a location</span>
            )}
          </div>
        </button>

        {/* ======================================
            MOBILE QUICK ACTIONS
        ====================================== */}

        <div className="navbar-mobile-quick-actions">
          {/* CART */}

          <NavLink
            to="/cart"
            className={getMobileCartClass}
            aria-label={`Cart${
              cartQuantity > 0 ? `, ${cartQuantity} items` : ""
            }`}
            title="Cart"
            onClick={closeNavigation}
          >
            <ShoppingCart size={19} aria-hidden="true" />

            {cartQuantity > 0 && (
              <span className="navbar-mobile-cart-badge">
                {cartQuantity > 99 ? "99+" : cartQuantity}
              </span>
            )}
          </NavLink>

          {/* SEARCH */}

          <button
            ref={mobileSearchButtonRef}
            type="button"
            className={`navbar-mobile-icon-button${
              isSearchOpen ? " active" : ""
            }`}
            aria-label={isSearchOpen ? "Close search" : "Search"}
            title="Search"
            aria-expanded={isSearchOpen}
            aria-controls="navbar-search-popup"
            onClick={toggleSearch}
          >
            {isSearchOpen ? (
              <X size={19} aria-hidden="true" />
            ) : (
              <Search size={19} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* ======================================
            MOBILE MENU BUTTON
        ====================================== */}

        <button
          type="button"
          className="navbar-menu-button"
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="navbar-panel"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" />
          ) : (
            <MenuIcon aria-hidden="true" />
          )}
        </button>

        {/* ======================================
            NAVIGATION PANEL
        ====================================== */}

        <div
          id="navbar-panel"
          className={isMenuOpen ? "navbar-panel is-open" : "navbar-panel"}
        >
          {/* ======================================
              LINKS
          ====================================== */}

          <div className="navbar-links">
            {/* HOME */}

            <NavLink
              to="/home"
              end
              className={getNavLinkClass}
              onClick={closeNavigation}
            >
              <House aria-hidden="true" />

              <span>Home</span>
            </NavLink>

            {/* RESTAURANTS */}

            <NavLink
              to="/restaurants"
              className={getNavLinkClass}
              onClick={closeNavigation}
            >
              <Store aria-hidden="true" />

              <span>Restaurants</span>
            </NavLink>

            {/* MENU */}

            <NavLink
              to="/menu"
              className={getNavLinkClass}
              onClick={closeNavigation}
            >
              <Utensils aria-hidden="true" />

              <span>Menu</span>
            </NavLink>

            {/* ======================================
                CART
                Desktop only.
                CSS hides this from mobile menu.
            ====================================== */}

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `${
                  isActive ? "navbar-link active" : "navbar-link"
                } navbar-cart-nav-link`
              }
              onClick={closeNavigation}
            >
              <ShoppingCart aria-hidden="true" />

              <span>Cart</span>
            </NavLink>

            {/* ORDERS */}

            <NavLink
              to="/orders"
              className={getNavLinkClass}
              onClick={closeNavigation}
            >
              <ClipboardList aria-hidden="true" />

              <span>Orders</span>
            </NavLink>
          </div>

          {/* ======================================
              DESKTOP SEARCH
          ====================================== */}

          <div className="navbar-utility-actions">
            <button
              ref={desktopSearchButtonRef}
              type="button"
              className={
                isSearchOpen
                  ? "navbar-icon-button active"
                  : "navbar-icon-button"
              }
              onClick={toggleSearch}
              aria-label="Search"
              title="Search"
              aria-expanded={isSearchOpen}
              aria-controls="navbar-search-popup"
            >
              {isSearchOpen ? (
                <X size={19} aria-hidden="true" />
              ) : (
                <Search size={19} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* ======================================
              ACCOUNT
          ====================================== */}

          <div className="navbar-account">
            {/* ======================================
                FAVOURITES
                Left of logout.
            ====================================== */}

            <NavLink
              to="/favourites"
              className={getFavouriteClass}
              aria-label="Favourites"
              title="Favourites"
              onClick={closeNavigation}
            >
              {({ isActive }) => (
                <Heart
                  size={19}
                  fill={isActive ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              )}
            </NavLink>

            {/* ======================================
                LOGOUT
            ====================================== */}

            <button
              type="button"
              className="navbar-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} aria-hidden="true" />

              <span>Logout</span>
            </button>

            {/* ======================================
                PROFILE
            ====================================== */}

            <NavLink
              to="/profile"
              className={getProfileClass}
              aria-label="Open user profile"
              title="Profile"
              onClick={closeNavigation}
            >
              <User className="navbar-profile-icon" aria-hidden="true" />
            </NavLink>
          </div>
        </div>

        {/* ======================================
            ONE SHARED SEARCH POPUP
        ====================================== */}

        {isSearchOpen && (
          <div ref={searchPopupRef} className="navbar-search-layer">
            <div id="navbar-search-popup" className="navbar-search-popup">
              {/* ======================================
                  SEARCH FORM
              ====================================== */}

              <form
                className="navbar-search"
                role="search"
                onSubmit={handleSearch}
              >
                <Search
                  size={18}
                  className="navbar-search-input-icon"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search food or restaurants..."
                  aria-label="Search dishes or restaurants"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />

                <button
                  type="submit"
                  className="navbar-search-submit"
                  aria-label="Submit search"
                >
                  Search
                </button>
              </form>

              {/* ======================================
                  RESULTS
              ====================================== */}

              {searchTerm.trim().length >= 2 && (
                <div className="navbar-search-suggestions" aria-live="polite">
                  {/* SEARCHING */}

                  {isSearching && (
                    <div className="navbar-search-feedback">Searching...</div>
                  )}

                  {/* ERROR */}

                  {!isSearching && searchError && (
                    <div className="navbar-search-feedback navbar-search-feedback--error">
                      {searchError}
                    </div>
                  )}

                  {/* EMPTY */}

                  {!isSearching && !searchError && suggestions.length === 0 && (
                    <div className="navbar-search-feedback">
                      No restaurants or menu items found.
                    </div>
                  )}

                  {/* RESULTS */}

                  {!isSearching && !searchError && suggestions.length > 0 && (
                    <div className="navbar-search-suggestion-list">
                      {suggestions.map((suggestion) => (
                        <button
                          type="button"
                          className="navbar-search-suggestion"
                          key={`${suggestion.type}-${suggestion.id}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {/* IMAGE */}

                          <div className="navbar-search-suggestion-image">
                            {suggestion.image_url ? (
                              <img
                                src={suggestion.image_url}
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            ) : suggestion.type === "restaurant" ? (
                              <Store size={20} aria-hidden="true" />
                            ) : (
                              <Utensils size={20} aria-hidden="true" />
                            )}
                          </div>

                          {/* CONTENT */}

                          <div className="navbar-search-suggestion-content">
                            <div className="navbar-search-suggestion-title-row">
                              <strong>{suggestion.label}</strong>

                              {suggestion.type === "menuItem" &&
                                suggestion.price !== undefined &&
                                suggestion.price !== null && (
                                  <span className="navbar-search-suggestion-price">
                                    R{Number(suggestion.price).toFixed(2)}
                                  </span>
                                )}
                            </div>

                            {suggestion.subtitle && (
                              <span className="navbar-search-suggestion-subtitle">
                                {suggestion.subtitle}
                              </span>
                            )}

                            <small className="navbar-search-suggestion-type">
                              {suggestion.type === "restaurant"
                                ? "Restaurant"
                                : "Menu item"}
                            </small>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ======================================
// EXPORT
// ======================================

export default Navbar;
