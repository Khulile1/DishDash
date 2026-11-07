// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Utensils,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import MenuItemCard from "../../components/cards/MenuItemCard";
import CartCard from "../../components/cards/CartCard";

import { getRestaurants } from "../../services/restaurantService";
import { getMenuItems } from "../../services/menuItemService";

import useCart from "../../hooks/useCart";

import "../../styles/CustomerMenuPage.css";

// ======================================
// MENU CATEGORY HELPERS
// ======================================

const getMenuCategoryName = (item) => {
  const category = String(item?.category || "Other").trim();

  return category || "Other";
};

const normalizeMenuCategory = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// ======================================
// CUSTOMER MENU PAGE
// ======================================

function CustomerMenuPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  // ======================================
  // RESTAURANTS
  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  // ======================================
  // MENU ITEMS
  // ======================================

  const [menuItems, setMenuItems] = useState([]);

  // ======================================
  // SHARED CART
  // ======================================

  const { cart, setCart, removeOne, removeItem, cartQuantity } = useCart();

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // PREVIEW STATE
  // ======================================

  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [itemPreviewOpen, setItemPreviewOpen] = useState(false);

  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);

  // Used to update restaurant
  // open/closed status each minute.

  const [, setStatusTick] = useState(0);

  // ======================================
  // TIME TO MINUTES
  // ======================================

  const getTimeInMinutes = (timeValue) => {
    const [hours, minutes] = String(timeValue || "")
      .split(":")
      .map(Number);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  };

  // ======================================
  // CURRENT SOUTH AFRICA TIME
  // ======================================

  const getSouthAfricaCurrentMinutes = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg",

      hour: "2-digit",

      minute: "2-digit",

      hour12: false,
    }).formatToParts(new Date());

    const hours = Number(parts.find((part) => part.type === "hour")?.value);

    const minutes = Number(parts.find((part) => part.type === "minute")?.value);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  };

  // ======================================
  // RESTAURANT OPEN STATE
  // ======================================

  const getRestaurantOpenState = (restaurant) => {
    if (!restaurant) {
      return null;
    }

    const opening = getTimeInMinutes(restaurant.opening_time);

    const closing = getTimeInMinutes(restaurant.closing_time);

    const current = getSouthAfricaCurrentMinutes();

    if (opening !== null && closing !== null && current !== null) {
      // Same opening and closing
      // means 24 hours.

      if (opening === closing) {
        return true;
      }

      // Same-day hours.

      if (opening < closing) {
        return current >= opening && current < closing;
      }

      // Overnight hours.

      return current >= opening || current < closing;
    }

    // Backend virtual fallback.

    if (typeof restaurant.is_open === "boolean") {
      return restaurant.is_open;
    }

    return null;
  };

  // ======================================
  // OPERATING HOURS
  // ======================================

  const formatOperatingHours = (restaurant) => {
    const opening = restaurant?.opening_time;

    const closing = restaurant?.closing_time;

    if (!opening || !closing) {
      return "";
    }

    if (opening === closing) {
      return "Open 24 hours";
    }

    return `${opening} – ${closing}`;
  };

  // ======================================
  // LOAD CUSTOMER MENU
  // ======================================

  const loadCustomerMenu = async () => {
    try {
      setLoading(true);

      setError("");

      const [restaurantData, menuData] = await Promise.all([
        getRestaurants(),

        getMenuItems(),
      ]);

      // ======================================
      // NORMALISE RESTAURANTS
      // ======================================

      const restaurantList = Array.isArray(restaurantData)
        ? restaurantData
        : Array.isArray(restaurantData?.restaurants)
          ? restaurantData.restaurants
          : [];

      // ======================================
      // NORMALISE MENU ITEMS
      // ======================================

      const menuList = Array.isArray(menuData)
        ? menuData
        : Array.isArray(menuData?.menuItems)
          ? menuData.menuItems
          : [];

      setRestaurants(restaurantList);

      setMenuItems(menuList);
    } catch (error) {
      console.error("Failed to load customer menu:", error);

      setError(
        error.response?.data?.message ||
          "Could not load the menu. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    loadCustomerMenu();
  }, []);

  // ======================================
  // REFRESH OPEN / CLOSED
  // ======================================

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setStatusTick((current) => current + 1);
      },

      60000,
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ======================================
  // CLEAR SUCCESS MESSAGE
  // ======================================

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => {
        setSuccess("");
      },

      2500,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  // ======================================
  // BACK HOME
  // ======================================

  const handleBack = () => {
    navigate("/home");
  };

  // ======================================
  // MENU ITEM RESTAURANT ID
  // ======================================

  const getMenuItemRestaurantId = (menuItem) => {
    if (menuItem?.restaurant_id && typeof menuItem.restaurant_id === "object") {
      return String(menuItem.restaurant_id._id || "");
    }

    return String(menuItem?.restaurant_id || "");
  };

  // ======================================
  // STOCK AVAILABLE
  // ======================================

  const hasAvailableStock = (item) => {
    if (!item.track_stock) {
      return true;
    }

    return Number(item.stock_quantity || 0) > 0;
  };

  // ======================================
  // ITEM CAN BE ORDERED
  // ======================================

  const isItemOrderable = (item) => {
    const isAvailable = item.available !== false;

    const hasStock = hasAvailableStock(item);

    return isAvailable && hasStock;
  };

  // ======================================
  // RESTAURANT MENU
  // ======================================

  const getRestaurantMenu = (restaurantId) => {
    return menuItems.filter((item) => {
      const itemRestaurantId = getMenuItemRestaurantId(item);

      const belongsToRestaurant = itemRestaurantId === String(restaurantId);

      return belongsToRestaurant && isItemOrderable(item);
    });
  };

  // ======================================
  // ITEM QUANTITY IN CART
  // ======================================

  const getItemQuantity = (menuItemId) => {
    const cartItem = cart.find(
      (item) => String(item._id) === String(menuItemId),
    );

    return Number(cartItem?.quantity || 0);
  };

  // ======================================
  // AVAILABLE STOCK
  // ======================================

  const getAvailableStock = (menuItem) => {
    if (!menuItem.track_stock) {
      return null;
    }

    return Math.max(
      0,

      Number(menuItem.stock_quantity || 0),
    );
  };

  // ======================================
  // STOCK LIMIT
  // ======================================

  const hasReachedStockLimit = (menuItem) => {
    if (!menuItem.track_stock) {
      return false;
    }

    const quantity = getItemQuantity(menuItem._id);

    const availableStock = getAvailableStock(menuItem);

    return quantity >= availableStock;
  };

  // ======================================
  // VISIT ITEM PAGE
  // ======================================

  const handleViewItemDetails = (menuItemId) => {
    navigate(`/menu-items/${menuItemId}`);
  };

  // ======================================
  // ADD ITEM TO CART
  // ======================================

  const handleAddToCart = (menuItem, restaurant) => {
    setError("");

    setSuccess("");

    const restaurantOpenState = getRestaurantOpenState(restaurant);

    if (restaurantOpenState === false) {
      setError(
        `${
          restaurant?.name || "This restaurant"
        } is currently closed. You can still view the item details, but ordering is unavailable.`,
      );

      return;
    }

    if (menuItem.available === false) {
      setError(`${menuItem.name} is currently unavailable.`);

      return;
    }

    const existingItem = cart.find(
      (item) => String(item._id) === String(menuItem._id),
    );

    const currentQuantity = Number(existingItem?.quantity || 0);

    if (menuItem.track_stock) {
      const availableStock = getAvailableStock(menuItem);

      if (availableStock <= 0) {
        setError(`${menuItem.name} is currently unavailable.`);

        return;
      }

      if (currentQuantity >= availableStock) {
        setError(`You can't add more of ${menuItem.name} right now.`);

        return;
      }
    }

    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map((item) =>
        String(item._id) === String(menuItem._id)
          ? {
              ...item,

              track_stock: menuItem.track_stock,

              stock_quantity: menuItem.stock_quantity,

              low_stock_threshold: menuItem.low_stock_threshold,

              available: menuItem.available,

              quantity: Number(item.quantity || 1) + 1,
            }
          : item,
      );
    } else {
      updatedCart = [
        ...cart,

        {
          ...menuItem,

          quantity: 1,

          restaurant_id: getMenuItemRestaurantId(menuItem),

          restaurant_name: restaurant?.name || "",
        },
      ];
    }

    setCart(updatedCart);

    setSuccess(`${menuItem.name} added to cart.`);
  };

  // ======================================
  // RESTAURANT FOR MENU ITEM
  // ======================================

  const getRestaurantForMenuItem = (menuItem) => {
    if (!menuItem) {
      return null;
    }

    const restaurantId = getMenuItemRestaurantId(menuItem);

    return (
      restaurants.find(
        (restaurant) => String(restaurant._id) === String(restaurantId),
      ) || null
    );
  };

  // ======================================
  // ITEM PREVIEW
  // ======================================

  const handleOpenItemPreview = (menuItem) => {
    setSelectedMenuItem(menuItem);

    setItemPreviewOpen(true);
  };

  const handleCloseItemPreview = () => {
    setItemPreviewOpen(false);
  };

  // ======================================
  // CART PREVIEW
  // ======================================

  const handleOpenCartPreview = () => {
    setCartPreviewOpen(true);
  };

  const handleCloseCartPreview = () => {
    setCartPreviewOpen(false);
  };

  // ======================================
  // REMOVE ONE FROM CART
  // ======================================

  const handleRemoveFromCart = (menuItem) => {
    if (!menuItem) {
      return;
    }

    removeOne(menuItem);
  };

  // ======================================
  // REMOVE COMPLETELY
  // ======================================

  const handleRemoveItemCompletely = (menuItem) => {
    if (!menuItem) {
      return;
    }

    removeItem(menuItem);
  };

  // ======================================
  // FORMAT RESTAURANT ADDRESS
  // ======================================

  const formatRestaurantAddress = (restaurant) => {
    if (!restaurant) {
      return "";
    }

    if (restaurant.formatted_address) {
      return restaurant.formatted_address;
    }

    const structuredAddress = [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
      restaurant.country,
    ]
      .filter(Boolean)
      .join(", ");

    if (structuredAddress) {
      return structuredAddress;
    }

    if (typeof restaurant.address === "string") {
      return restaurant.address;
    }

    return "";
  };

  // ======================================
  // AVAILABLE MENU ITEMS
  // ======================================

  const availableMenuItems = menuItems.filter((item) => isItemOrderable(item));

  // ======================================
  // GLOBAL MENU CATEGORIES
  // ======================================
  //
  // Categories are generated from the
  // existing MenuItem.category values.
  //
  // This means categories such as:
  //
  // Burgers
  // Pizza
  // Chicken
  // Drinks
  // Desserts
  //
  // appear automatically.
  // ======================================

  const menuCategories = [
    ...new Map(
      availableMenuItems.map((item) => {
        const label = getMenuCategoryName(item);

        return [normalizeMenuCategory(label), label];
      }),
    ).values(),
  ].sort((categoryA, categoryB) =>
    categoryA.localeCompare(categoryB, undefined, {
      sensitivity: "base",
    }),
  );

  // ======================================
  // SELECTED CATEGORY
  // ======================================

  const requestedCategory = String(
    searchParams.get("category") || "all",
  ).trim();

  const matchedCategory = menuCategories.find(
    (category) =>
      normalizeMenuCategory(category) ===
      normalizeMenuCategory(requestedCategory),
  );

  const selectedCategory =
    normalizeMenuCategory(requestedCategory) === "all"
      ? "all"
      : matchedCategory || "all";

  // ======================================
  // FILTERED ITEMS
  // ======================================

  const filteredAvailableMenuItems =
    selectedCategory === "all"
      ? availableMenuItems
      : availableMenuItems.filter(
          (item) =>
            normalizeMenuCategory(getMenuCategoryName(item)) ===
            normalizeMenuCategory(selectedCategory),
        );

  // ======================================
  // RESTAURANTS VISIBLE FOR CATEGORY
  // ======================================

  const visibleRestaurantCount =
    selectedCategory === "all"
      ? restaurants.length
      : restaurants.filter((restaurant) =>
          getRestaurantMenu(restaurant._id).some(
            (item) =>
              normalizeMenuCategory(getMenuCategoryName(item)) ===
              normalizeMenuCategory(selectedCategory),
          ),
        ).length;

  // ======================================
  // CHANGE CATEGORY
  // ======================================

  const handleCategoryChange = (categoryValue) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (categoryValue === "all") {
      nextSearchParams.delete("category");
    } else {
      nextSearchParams.set("category", categoryValue);
    }

    setSearchParams(nextSearchParams);
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="customer-menu-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="customer-menu-page">
        <div className="customer-menu-container">
          {/* ======================================
              TOP ACTIONS
          ====================================== */}

          <div className="customer-menu-top-actions">
            <button
              type="button"
              className="customer-menu-back"
              onClick={handleBack}
            >
              <ArrowLeft size={18} />

              <span>Back to Home</span>
            </button>

            <button
              type="button"
              className="customer-menu-cart-preview-button"
              onClick={handleOpenCartPreview}
            >
              <ShoppingCart size={18} />

              <span>View Cart</span>

              {cartQuantity > 0 && (
                <span className="customer-menu-cart-preview-count">
                  {cartQuantity}
                </span>
              )}
            </button>
          </div>

          {/* ======================================
              PAGE HEADER
          ====================================== */}

          <section className="customer-menu-header">
            <div className="customer-menu-header-content">
              <span className="customer-menu-eyebrow">
                <Utensils size={16} />
                Explore the menu
              </span>

              <h1>
                {selectedCategory === "all" ? "Our Menu" : selectedCategory}
              </h1>

              <p>
                {selectedCategory === "all"
                  ? "Browse available meals from our restaurants and choose what you would like to order."
                  : `Browse available ${selectedCategory} from our restaurants.`}
              </p>
            </div>

            {!loading && !error && (
              <div className="customer-menu-summary">
                <div>
                  <strong>{visibleRestaurantCount}</strong>

                  <span>
                    {visibleRestaurantCount === 1
                      ? "Restaurant"
                      : "Restaurants"}
                  </span>
                </div>

                <div className="customer-menu-summary-divider" />

                <div>
                  <strong>{filteredAvailableMenuItems.length}</strong>

                  <span>
                    {filteredAvailableMenuItems.length === 1
                      ? "Menu Item"
                      : "Menu Items"}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ======================================
            CATEGORY PILLS
        ====================================== */}

          {!loading && !error && (
            <section
              className="customer-menu-category-filter-section"
              aria-label="Menu categories"
            >
              <div className="customer-menu-category-filter-container">
                <div className="customer-menu-category-filter-scroll">
                  {/* ALL */}

                  <button
                    type="button"
                    className={`customer-menu-category-filter-pill${
                      selectedCategory === "all"
                        ? " customer-menu-category-filter-pill--active"
                        : ""
                    }`}
                    onClick={() => handleCategoryChange("all")}
                    aria-pressed={selectedCategory === "all"}
                  >
                    All
                  </button>

                  {/* DYNAMIC CATEGORIES */}

                  {menuCategories.map((category) => {
                    const isActive =
                      normalizeMenuCategory(selectedCategory) ===
                      normalizeMenuCategory(category);

                    return (
                      <button
                        key={category}
                        type="button"
                        className={`customer-menu-category-filter-pill${
                          isActive
                            ? " customer-menu-category-filter-pill--active"
                            : ""
                        }`}
                        onClick={() => handleCategoryChange(category)}
                        aria-pressed={isActive}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <section className="customer-menu-state">
              <div className="customer-menu-loader" />

              <h2>Loading menu</h2>

              <p>Getting the latest restaurants and menu items for you.</p>
            </section>
          )}

          {/* ======================================
              ERROR
          ====================================== */}

          {!loading && error && (
            <section className="customer-menu-state customer-menu-state--error">
              <div className="customer-menu-state-icon">
                <Utensils size={28} />
              </div>

              <h2>Could not load menu</h2>

              <p>{error}</p>

              <button
                type="button"
                className="customer-menu-retry"
                onClick={loadCustomerMenu}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          )}

          {/* ======================================
              SUCCESS
          ====================================== */}

          {!loading && success && (
            <div className="customer-menu-message customer-menu-message--success">
              <CheckCircle2 size={18} />

              <span>{success}</span>
            </div>
          )}

          {/* ======================================
              EMPTY RESTAURANTS
          ====================================== */}

          {!loading && !error && restaurants.length === 0 && (
            <section className="customer-menu-state">
              <div className="customer-menu-state-icon">
                <Store size={28} />
              </div>

              <h2>No restaurants available</h2>

              <p>There are currently no restaurants to display.</p>
            </section>
          )}

          {/* ======================================
              EMPTY CATEGORY
          ====================================== */}

          {!loading &&
            !error &&
            restaurants.length > 0 &&
            selectedCategory !== "all" &&
            filteredAvailableMenuItems.length === 0 && (
              <section className="customer-menu-state">
                <div className="customer-menu-state-icon">
                  <Utensils size={28} />
                </div>

                <h2>No {selectedCategory} available</h2>

                <p>
                  There are currently no available menu items in this category.
                </p>

                <button
                  type="button"
                  className="customer-menu-retry"
                  onClick={() => handleCategoryChange("all")}
                >
                  View All Menu Items
                </button>
              </section>
            )}

          {/* ======================================
              RESTAURANTS
          ====================================== */}

          {!loading &&
            !error &&
            restaurants.map((restaurant) => {
              // ======================================
              // RESTAURANT MENU
              // ======================================

              const restaurantMenu = getRestaurantMenu(restaurant._id);

              // ======================================
              // FILTER RESTAURANT MENU
              // ======================================

              const visibleRestaurantMenu =
                selectedCategory === "all"
                  ? restaurantMenu
                  : restaurantMenu.filter(
                      (item) =>
                        normalizeMenuCategory(getMenuCategoryName(item)) ===
                        normalizeMenuCategory(selectedCategory),
                    );

              // Hide restaurants that do not
              // contain the selected category.

              if (
                selectedCategory !== "all" &&
                visibleRestaurantMenu.length === 0
              ) {
                return null;
              }

              // ======================================
              // RESTAURANT CATEGORIES
              // ======================================

              const categories = [
                ...new Set(
                  visibleRestaurantMenu.map((item) =>
                    getMenuCategoryName(item),
                  ),
                ),
              ];

              const restaurantAddress = formatRestaurantAddress(restaurant);

              const isOpen = getRestaurantOpenState(restaurant);

              const operatingHours = formatOperatingHours(restaurant);

              return (
                <section
                  key={restaurant._id}
                  className="customer-menu-restaurant"
                >
                  {/* ======================================
                        RESTAURANT HEADER
                    ====================================== */}

                  <div className="customer-menu-restaurant-header mobile-page-header">
                    <div className="customer-menu-restaurant-info">
                      <span className="customer-menu-restaurant-label">
                        <Store size={15} />
                        Restaurant
                      </span>

                      <h2>{restaurant.name}</h2>

                      {restaurant.description && (
                        <p className="customer-menu-restaurant-description">
                          {restaurant.description}
                        </p>
                      )}

                      {restaurantAddress && (
                        <div className="customer-menu-restaurant-address">
                          <MapPin size={16} />

                          <span>{restaurantAddress}</span>
                        </div>
                      )}

                      {typeof isOpen === "boolean" && (
                        <div
                          className={`customer-menu-restaurant-status ${
                            isOpen
                              ? "customer-menu-restaurant-status--open"
                              : "customer-menu-restaurant-status--closed"
                          }`}
                        >
                          <span className="customer-menu-restaurant-status-dot" />

                          <div>
                            <strong>
                              {isOpen ? "Open now" : "Closed now"}
                            </strong>

                            {operatingHours && <span>{operatingHours}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="customer-menu-restaurant-actions">
                      <span className="customer-menu-item-count">
                        {visibleRestaurantMenu.length}{" "}
                        {visibleRestaurantMenu.length === 1 ? "item" : "items"}
                      </span>

                      <button
                        type="button"
                        className={`customer-menu-view-restaurant${
                          isOpen === false
                            ? " customer-menu-view-restaurant--closed"
                            : ""
                        }`}
                        onClick={() =>
                          navigate(`/restaurants/${restaurant._id}`)
                        }
                      >
                        {isOpen === false
                          ? "Closed — View for Testing"
                          : "View Restaurant"}
                      </button>
                    </div>
                  </div>

                  {/* ======================================
                        NO MENU ITEMS
                    ====================================== */}

                  {visibleRestaurantMenu.length === 0 && (
                    <div className="customer-menu-empty">
                      <div className="customer-menu-empty-icon">
                        <Utensils size={24} />
                      </div>

                      <div>
                        <h3>No available menu items</h3>

                        <p>
                          This restaurant currently has no available menu items.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ======================================
                        CATEGORY GROUPS
                    ====================================== */}

                  {categories.map((category) => {
                    const categoryItems = visibleRestaurantMenu.filter(
                      (item) =>
                        normalizeMenuCategory(getMenuCategoryName(item)) ===
                        normalizeMenuCategory(category),
                    );

                    return (
                      <div key={category} className="customer-menu-category">
                        {/* CATEGORY HEADING */}

                        <div className="customer-menu-category-heading">
                          <div>
                            <h3>{category}</h3>

                            <span>
                              {categoryItems.length}{" "}
                              {categoryItems.length === 1 ? "item" : "items"}
                            </span>
                          </div>

                          <div className="customer-menu-category-line" />
                        </div>

                        {/* ======================================
                                ITEM GRID
                            ====================================== */}

                        <div className="customer-menu-grid">
                          {categoryItems.map((item) => {
                            const quantity = getItemQuantity(item._id);

                            const stockLimitReached =
                              hasReachedStockLimit(item);

                            const orderingBlocked = isOpen === false;

                            return (
                              <article
                                key={item._id}
                                className="customer-menu-card customer-menu-card--previewable"
                                role="button"
                                tabIndex={0}
                                aria-label={`Preview ${item.name}`}
                                onClick={() => handleOpenItemPreview(item)}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();

                                    handleOpenItemPreview(item);
                                  }
                                }}
                              >
                                {/* ITEM IMAGE */}

                                <div className="customer-menu-image-wrapper">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="customer-menu-image"
                                    />
                                  ) : (
                                    <div className="customer-menu-image-placeholder">
                                      <Utensils size={30} />

                                      <span>No image</span>
                                    </div>
                                  )}

                                  {quantity > 0 && (
                                    <span className="customer-menu-in-cart-badge">
                                      {quantity} in cart
                                    </span>
                                  )}
                                </div>

                                {/* ITEM CONTENT */}

                                <div className="customer-menu-card-content">
                                  <div className="customer-menu-card-top">
                                    <div>
                                      <span className="customer-menu-card-category">
                                        {getMenuCategoryName(item)}
                                      </span>

                                      <h3>{item.name}</h3>
                                    </div>

                                    <strong className="customer-menu-price">
                                      R{Number(item.price || 0).toFixed(2)}
                                    </strong>
                                  </div>

                                  <p className="customer-menu-description">
                                    {item.description ||
                                      "A delicious option from this restaurant."}
                                  </p>

                                  {/* EXTRA INFO */}

                                  <div className="customer-menu-item-extra">
                                    <div className="customer-menu-item-extra-row">
                                      <Store size={15} />

                                      <span>Restaurant</span>

                                      <strong>{restaurant.name}</strong>
                                    </div>

                                    <div className="customer-menu-item-extra-row">
                                      <ShoppingCart size={15} />

                                      <span>Cart</span>

                                      <strong>
                                        {quantity > 0
                                          ? `${quantity} ${
                                              quantity === 1 ? "item" : "items"
                                            } added`
                                          : "Not added yet"}
                                      </strong>
                                    </div>
                                  </div>

                                  {/* ACTIONS */}

                                  <div className="customer-menu-card-actions">
                                    <button
                                      type="button"
                                      className="customer-menu-details-button"
                                      onClick={(event) => {
                                        event.stopPropagation();

                                        handleViewItemDetails(item._id);
                                      }}
                                    >
                                      <Eye size={17} />

                                      <span>Visit Page</span>
                                    </button>

                                    <button
                                      type="button"
                                      className={`customer-menu-add-button${
                                        stockLimitReached || orderingBlocked
                                          ? " customer-menu-add-button--disabled"
                                          : ""
                                      }${
                                        orderingBlocked
                                          ? " customer-menu-add-button--closed"
                                          : ""
                                      }`}
                                      disabled={
                                        stockLimitReached || orderingBlocked
                                      }
                                      onClick={(event) => {
                                        event.stopPropagation();

                                        handleAddToCart(item, restaurant);
                                      }}
                                    >
                                      {orderingBlocked ? (
                                        <>
                                          <Clock3 size={17} />

                                          <span>Restaurant Closed</span>
                                        </>
                                      ) : stockLimitReached ? (
                                        <>
                                          <CheckCircle2 size={17} />

                                          <span>Can't Add More</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={17} />

                                          <span>
                                            {quantity > 0
                                              ? `Add Another (${quantity})`
                                              : "Add to Cart"}
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </div>
      </main>

      {/* ======================================
          MENU ITEM PREVIEW
      ====================================== */}

      <MenuItemCard
        isOpen={itemPreviewOpen && Boolean(selectedMenuItem)}
        item={selectedMenuItem}
        restaurant={getRestaurantForMenuItem(selectedMenuItem)}
        restaurantItems={
          selectedMenuItem
            ? getRestaurantMenu(getMenuItemRestaurantId(selectedMenuItem))
            : []
        }
        cartItems={cart}
        onClose={handleCloseItemPreview}
        onVisitItem={(menuItem) => {
          handleCloseItemPreview();

          navigate(`/menu-items/${menuItem._id}`);
        }}
        onVisitRelatedItem={(menuItem) => {
          setSelectedMenuItem(menuItem);
        }}
        onViewCart={() => {
          handleCloseItemPreview();

          handleOpenCartPreview();
        }}
        onAddItem={(menuItem) => {
          const itemRestaurant = getRestaurantForMenuItem(menuItem);

          handleAddToCart(menuItem, itemRestaurant);
        }}
        onRemoveItem={handleRemoveFromCart}
      />

      {/* ======================================
          CART PREVIEW
      ====================================== */}

      <CartCard
        isOpen={cartPreviewOpen}
        cartItems={cart}
        onClose={handleCloseCartPreview}
        onContinueToCart={() => {
          handleCloseCartPreview();

          navigate("/cart");
        }}
        onAddItem={(menuItem) => {
          const itemRestaurant = getRestaurantForMenuItem(menuItem);

          handleAddToCart(menuItem, itemRestaurant);
        }}
        onRemoveItem={handleRemoveFromCart}
        onRemoveItemCompletely={handleRemoveItemCompletely}
        onVisitItem={(menuItem) => {
          handleCloseCartPreview();

          setSelectedMenuItem(menuItem);

          setItemPreviewOpen(true);
        }}
      />

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

export default CustomerMenuPage;
