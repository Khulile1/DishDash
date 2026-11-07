// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Utensils,
} from "lucide-react";

import { getRestaurant } from "../../services/restaurantService";

import { getMenuItems } from "../../services/menuItemService";

import { getRestaurantRoute } from "../../services/routingService";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import RestaurantRouteMap from "../../components/maps/RestaurantRouteMap";
import MenuItemCard from "../../components/cards/MenuItemCard";
import CartCard from "../../components/cards/CartCard";

import useCart from "../../hooks/useCart";

import "../../styles/CustomerRestaurantMenuPage.css";

// ======================================
// CUSTOMER RESTAURANT MENU PAGE
// ======================================

function CustomerRestaurantMenuPage() {
  // ======================================
  // ROUTER
  // ======================================

  const { restaurantId } = useParams();

  const navigate = useNavigate();

  // ======================================
  // RESTAURANT STATE
  // ======================================

  const [restaurant, setRestaurant] = useState(null);

  // ======================================
  // DRIVING ROUTE
  // ======================================

  const [routeInfo, setRouteInfo] = useState(null);

  const [routeMessage, setRouteMessage] = useState("");

  // ======================================
  // MENU STATE
  // ======================================

  const [menuItems, setMenuItems] = useState([]);

  // ======================================
  // MENU ITEM PREVIEW
  // ======================================

  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [itemPreviewOpen, setItemPreviewOpen] = useState(false);

  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);

  // ======================================
  // SHARED USER CART
  // ======================================
  //
  // CartCard, this restaurant page and
  // CartPage now use the same cart for
  // the currently logged-in user.
  // ======================================

  const { cart, setCart, removeOne, removeItem, cartQuantity } = useCart();

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // CLOSED RESTAURANT ORDERING
  // ======================================

  const BLOCK_ORDERS_WHEN_CLOSED = true;
  //
  // ======================================

  //const BLOCK_ORDERS_WHEN_CLOSED = false;

  // Refresh the Open / Closed state once per minute.
  const [, setStatusTick] = useState(0);

  // ======================================
  // GET MENU ITEM RESTAURANT ID
  // ======================================

  const getMenuItemRestaurantId = (menuItem) => {
    if (menuItem.restaurant_id && typeof menuItem.restaurant_id === "object") {
      return String(menuItem.restaurant_id._id || "");
    }

    return String(menuItem.restaurant_id || "");
  };

  // ======================================
  // RESTAURANT OPEN / CLOSED STATUS
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

  const getRestaurantOpenState = (restaurantData) => {
    if (!restaurantData) {
      return null;
    }

    const opening = getTimeInMinutes(restaurantData.opening_time);

    const closing = getTimeInMinutes(restaurantData.closing_time);

    const current = getSouthAfricaCurrentMinutes();

    if (opening !== null && closing !== null && current !== null) {
      // Same opening and closing time = open 24 hours.
      if (opening === closing) {
        return true;
      }

      // Normal same-day hours.
      if (opening < closing) {
        return current >= opening && current < closing;
      }

      // Overnight hours, e.g. 18:00 - 02:00.
      return current >= opening || current < closing;
    }

    // Fallback to the backend virtual.
    if (typeof restaurantData.is_open === "boolean") {
      return restaurantData.is_open;
    }

    return null;
  };

  const formatOperatingHours = (restaurantData) => {
    const opening = restaurantData?.opening_time;

    const closing = restaurantData?.closing_time;

    if (!opening || !closing) {
      return "";
    }

    if (opening === closing) {
      return "Open 24 hours";
    }

    return `${opening} – ${closing}`;
  };

  const restaurantIsOpen = getRestaurantOpenState(restaurant);

  const restaurantIsClosed = restaurantIsOpen === false;

  const operatingHours = formatOperatingHours(restaurant);

  const orderingBlocked = BLOCK_ORDERS_WHEN_CLOSED && restaurantIsClosed;

  // ======================================
  // HAS STOCK
  // ======================================

  const hasStock = (item) => {
    if (!item.track_stock) {
      return true;
    }

    return Number(item.stock_quantity || 0) > 0;
  };

  // ======================================
  // CAN CUSTOMER ORDER ITEM
  // ======================================

  const isItemOrderable = (item) => {
    return item.available !== false && hasStock(item);
  };

  // ======================================
  // LOAD RESTAURANT MENU
  // ======================================

  const loadRestaurantMenu = async () => {
    try {
      setLoading(true);
      setError("");

      // Route failure must not stop the
      // restaurant/menu from loading.
      const routePromise = getRestaurantRoute(restaurantId).catch(
        (routeError) => {
          console.error("Could not load driving route:", routeError);

          const status = routeError.response?.status;

          if (status === 404) {
            setRouteMessage(
              routeError.response?.data?.message ||
                "Add a delivery address to see driving distance and travel time.",
            );
          } else {
            setRouteMessage("Driving route is temporarily unavailable.");
          }

          return null;
        },
      );

      const [restaurantData, menuData, routeData] = await Promise.all([
        getRestaurant(restaurantId),
        getMenuItems(),
        routePromise,
      ]);

      // ======================================
      // RESTAURANT
      // ======================================

      const selectedRestaurant = restaurantData?.restaurant || restaurantData;

      setRestaurant(selectedRestaurant);

      // ======================================
      // DRIVING ROUTE
      // ======================================

      setRouteInfo(routeData);

      if (routeData) {
        setRouteMessage("");
      }

      // ======================================
      // MENU DATA
      // ======================================

      const allMenuItems = Array.isArray(menuData)
        ? menuData
        : Array.isArray(menuData?.menuItems)
          ? menuData.menuItems
          : [];

      // ======================================
      // FILTER RESTAURANT ITEMS
      // ======================================

      const restaurantMenuItems = allMenuItems.filter(
        (item) => getMenuItemRestaurantId(item) === String(restaurantId),
      );

      // ======================================
      // ONLY ITEMS CUSTOMER CAN ORDER
      // ======================================

      const availableMenuItems = restaurantMenuItems.filter((item) =>
        isItemOrderable(item),
      );

      setMenuItems(availableMenuItems);
    } catch (error) {
      console.error("Failed to load restaurant menu:", error);

      setError(
        error.response?.data?.message || "Could not load this restaurant menu.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantMenu();
    }
  }, [restaurantId]);

  // ======================================
  // REFRESH OPEN / CLOSED STATUS
  // ======================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusTick((current) => current + 1);
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ======================================
  // REFRESH ROUTE WHEN CUSTOMER
  // CHANGES DEFAULT ADDRESS
  // ======================================

  useEffect(() => {
    const handleAddressChanged = async () => {
      if (!restaurantId) {
        return;
      }

      try {
        setRouteMessage("");

        const routeData = await getRestaurantRoute(restaurantId);

        setRouteInfo(routeData);
      } catch (routeError) {
        console.error("Could not refresh driving route:", routeError);

        setRouteInfo(null);

        setRouteMessage(
          routeError.response?.data?.message ||
            "Driving route is temporarily unavailable.",
        );
      }
    };

    window.addEventListener("addressChanged", handleAddressChanged);

    return () => {
      window.removeEventListener("addressChanged", handleAddressChanged);
    };
  }, [restaurantId]);

  // ======================================
  // CLEAR SUCCESS MESSAGE
  // ======================================

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  // ======================================
  // CATEGORIES
  // ======================================

  const categories = [
    ...new Set(menuItems.map((item) => item.category || "Other")),
  ];

  // ======================================
  // GET ITEM QUANTITY IN CART
  // ======================================

  const getItemQuantity = (menuItemId) => {
    const cartItem = cart.find((item) => item._id === menuItemId);

    return cartItem?.quantity || 0;
  };

  // ======================================
  // GET AVAILABLE STOCK
  // ======================================

  const getAvailableStock = (menuItem) => {
    if (!menuItem.track_stock) {
      return null;
    }

    return Math.max(0, Number(menuItem.stock_quantity || 0));
  };

  // ======================================
  // CART HAS REACHED STOCK LIMIT
  // ======================================

  const hasReachedStockLimit = (menuItem) => {
    if (!menuItem.track_stock) {
      return false;
    }

    const cartQuantity = getItemQuantity(menuItem._id);

    const availableStock = getAvailableStock(menuItem);

    return cartQuantity >= availableStock;
  };

  // ======================================
  // ADD ITEM TO CART
  // ======================================

  const handleAddToCart = (menuItem) => {
    setError("");
    setSuccess("");

    // ======================================
    // CLOSED RESTAURANT ORDERING BLOCK
    // ======================================
    //
    // This only blocks ordering when:
    //
    // BLOCK_ORDERS_WHEN_CLOSED = true
    //
    // It remains false while you are testing.
    // ======================================

    if (orderingBlocked) {
      setError(
        `${restaurant?.name || "This restaurant"} is currently closed. You can browse the menu, but ordering is unavailable.`,
      );

      return;
    }

    if (menuItem.available === false) {
      setError(`${menuItem.name} is currently unavailable.`);

      return;
    }

    const existingItem = cart.find((item) => item._id === menuItem._id);

    const currentQuantity = existingItem?.quantity || 0;

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
        item._id === menuItem._id
          ? {
              ...item,
              track_stock: menuItem.track_stock,
              stock_quantity: menuItem.stock_quantity,
              low_stock_threshold: menuItem.low_stock_threshold,
              available: menuItem.available,
              quantity: (item.quantity || 1) + 1,
            }
          : item,
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...menuItem,
          quantity: 1,
          restaurant_id: restaurantId,
          restaurant_name: restaurant?.name || "",
        },
      ];
    }

    setCart(updatedCart);

    const newQuantity = currentQuantity + 1;

    if (menuItem.track_stock) {
      const availableStock = getAvailableStock(menuItem);

      const remainingCapacity = availableStock - newQuantity;

      if (remainingCapacity === 0) {
        setSuccess(`${menuItem.name} added to cart.`);

        return;
      }
    }

    setSuccess(`${menuItem.name} added to cart.`);
  };

  // ======================================
  // REMOVE ONE ITEM FROM CART
  // ======================================

  const handleRemoveFromCart = (menuItem) => {
    if (!menuItem) {
      return;
    }

    setError("");
    setSuccess("");

    removeOne(menuItem);

    setSuccess(`${menuItem.name} updated in cart.`);
  };

  // ======================================
  // REMOVE ITEM COMPLETELY FROM CART
  // ======================================

  const handleRemoveItemCompletely = (menuItem) => {
    if (!menuItem) {
      return;
    }

    removeItem(menuItem);
  };

  // ======================================
  // OPEN MENU ITEM PREVIEW
  // ======================================

  const handleViewItemDetails = (menuItem) => {
    if (!menuItem) {
      return;
    }

    setSelectedMenuItem(menuItem);

    // Keep only one preview open at a time.
    setCartPreviewOpen(false);
    setItemPreviewOpen(true);
  };

  // ======================================
  // VISIT FULL ITEM PAGE
  // ======================================

  const handleVisitItemPage = (menuItem) => {
    if (!menuItem?._id) {
      return;
    }

    setItemPreviewOpen(false);

    navigate(`/menu-items/${menuItem._id}`);
  };

  // ======================================
  // FORMAT RESTAURANT ADDRESS
  // ======================================

  const getRestaurantAddress = (restaurantData) => {
    if (!restaurantData) {
      return "";
    }

    if (restaurantData.formatted_address) {
      return restaurantData.formatted_address;
    }

    return [
      restaurantData.street_address,
      restaurantData.suburb,
      restaurantData.city,
      restaurantData.province,
      restaurantData.postal_code,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const restaurantAddress = getRestaurantAddress(restaurant);

  // ======================================
  // OPEN GOOGLE MAPS ROUTE
  // ======================================
  //
  // Geoapify still uses coordinates for the
  // Dish Dash distance/time calculation and
  // embedded route map.
  //
  // Google Maps uses the SAVED customer and
  // restaurant address strings so that the
  // street number/suburb selected by the user
  // is preserved.
  // ======================================

  const handleViewRoute = () => {
    const originAddress = String(routeInfo?.originAddress || "").trim();

    const destinationAddress = String(
      routeInfo?.destinationAddress || "",
    ).trim();

    if (!originAddress || !destinationAddress) {
      setError("The customer or restaurant street address is not available.");

      return;
    }

    const routeUrl =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${encodeURIComponent(originAddress)}` +
      `&destination=${encodeURIComponent(destinationAddress)}` +
      "&travelmode=driving";

    window.open(routeUrl, "_blank", "noopener,noreferrer");
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-menu-layout">
      <Navbar />

      <main className="restaurant-menu-page">
        <div className="restaurant-menu-container">
          {/* ======================================
              PAGE ACTIONS
          ====================================== */}

          <div className="restaurant-menu-actions">
            <button
              type="button"
              className="restaurant-menu-back-button"
              onClick={() => navigate("/restaurants")}
            >
              <ArrowLeft size={18} />

              <span>Back to Restaurants</span>
            </button>

            <button
              type="button"
              className="restaurant-menu-cart-button"
              onClick={() => setCartPreviewOpen(true)}
            >
              <ShoppingCart size={18} />

              <span>Cart</span>

              {cartQuantity > 0 && (
                <span className="restaurant-menu-cart-count">
                  {cartQuantity}
                </span>
              )}
            </button>
          </div>

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <section className="restaurant-menu-state">
              <div className="restaurant-menu-loader" />

              <h2>Loading restaurant</h2>

              <p>Getting the latest menu items for you.</p>
            </section>
          )}

          {/* ======================================
              LOAD ERROR
          ====================================== */}

          {!loading && error && !restaurant && (
            <section className="restaurant-menu-state restaurant-menu-state--error">
              <div className="restaurant-menu-state-icon">
                <Store size={28} />
              </div>

              <h2>Could not load restaurant</h2>

              <p>{error}</p>

              <button
                type="button"
                className="restaurant-menu-retry-button"
                onClick={loadRestaurantMenu}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          )}

          {/* ======================================
              RESTAURANT CONTENT
          ====================================== */}

          {!loading && restaurant && (
            <>
              {/* ======================================
                  RESTAURANT HEADER
              ====================================== */}

              <section className="restaurant-menu-header mobile-page-header">
                <div className="restaurant-menu-header-content">
                  <span className="restaurant-menu-eyebrow">
                    <Store size={16} />
                    Restaurant Menu
                  </span>

                  <h1>{restaurant.name || "Restaurant"}</h1>

                  {restaurant.description && (
                    <p className="restaurant-menu-header-description">
                      {restaurant.description}
                    </p>
                  )}

                  {restaurantAddress && (
                    <div className="restaurant-menu-address">
                      <MapPin size={17} />

                      <span>{restaurantAddress}</span>
                    </div>
                  )}

                  {typeof restaurantIsOpen === "boolean" && (
                    <div
                      className={`restaurant-menu-live-status ${
                        restaurantIsOpen
                          ? "restaurant-menu-live-status--open"
                          : "restaurant-menu-live-status--closed"
                      }`}
                    >
                      <span className="restaurant-menu-live-status-dot" />

                      <div>
                        <strong>
                          {restaurantIsOpen ? "Open now" : "Closed now"}
                        </strong>

                        {operatingHours && <span>{operatingHours}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="restaurant-menu-header-summary">
                  <div>
                    <strong>{menuItems.length}</strong>

                    <span>
                      {menuItems.length === 1 ? "Menu Item" : "Menu Items"}
                    </span>
                  </div>

                  <div className="restaurant-menu-header-divider" />

                  <div>
                    <strong>{categories.length}</strong>

                    <span>
                      {categories.length === 1 ? "Category" : "Categories"}
                    </span>
                  </div>
                </div>
              </section>

              {/* ======================================
                  CLOSED RESTAURANT NOTICE
              ====================================== */}

              {restaurantIsClosed && (
                <section className="restaurant-menu-closed-notice">
                  <div className="restaurant-menu-closed-notice-icon">
                    <Clock3 size={21} />
                  </div>

                  <div>
                    <strong>Restaurant currently closed</strong>

                    <span>
                      {operatingHours
                        ? `Operating hours: ${operatingHours}.`
                        : "Ordering is currently unavailable outside operating hours."}
                    </span>

                    {!BLOCK_ORDERS_WHEN_CLOSED && (
                      <small>
                        Testing mode is on, so Add to Cart remains enabled.
                      </small>
                    )}
                  </div>
                </section>
              )}

              {/* ======================================
                  DELIVERY ROUTE + MAP
              ====================================== */}

              {routeInfo && (
                <section className="restaurant-menu-route-panel">
                  <div className="restaurant-menu-route-info">
                    <span className="restaurant-menu-route-eyebrow">
                      <Navigation size={15} />
                      Delivery route
                    </span>

                    <h2>From your address to {restaurant.name}</h2>

                    <p>
                      Road distance and estimated driving time for this
                      restaurant.
                    </p>

                    <div className="restaurant-menu-route-metrics">
                      <div className="restaurant-menu-route-metric">
                        <Navigation size={20} />

                        <div>
                          <strong>{routeInfo.distanceKm} km</strong>
                          <span>Driving distance</span>
                        </div>
                      </div>

                      <div className="restaurant-menu-route-metric">
                        <Clock3 size={20} />

                        <div>
                          <strong>{routeInfo.durationMinutes} min</strong>
                          <span>Estimated drive</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="restaurant-menu-route-button restaurant-menu-route-button--large"
                      onClick={handleViewRoute}
                    >
                      <Navigation size={17} />
                      Open in Google Maps
                    </button>
                  </div>

                  <RestaurantRouteMap
                    routeInfo={routeInfo}
                    restaurantName={restaurant.name}
                  />
                </section>
              )}

              {!routeInfo && routeMessage && (
                <section className="restaurant-menu-route-unavailable">
                  <div>
                    <MapPin size={20} />

                    <div>
                      <strong>Route unavailable</strong>
                      <span>{routeMessage}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="restaurant-menu-route-button"
                    onClick={() => navigate("/addresses")}
                  >
                    Manage Address
                  </button>
                </section>
              )}

              {/* ======================================
                  ERROR
              ====================================== */}

              {error && (
                <div className="restaurant-menu-message restaurant-menu-message--error">
                  <span>{error}</span>
                </div>
              )}

              {/* ======================================
                  SUCCESS
              ====================================== */}

              {success && (
                <div className="restaurant-menu-message restaurant-menu-message--success">
                  <CheckCircle2 size={18} />

                  <span>{success}</span>
                </div>
              )}

              {/* ======================================
                  EMPTY MENU
              ====================================== */}

              {menuItems.length === 0 && (
                <section className="restaurant-menu-empty">
                  <div className="restaurant-menu-empty-icon">
                    <Utensils size={28} />
                  </div>

                  <h2>Menu unavailable</h2>

                  <p>This restaurant currently has no available menu items.</p>
                </section>
              )}

              {/* ======================================
                  CATEGORIES
              ====================================== */}

              {categories.map((category) => {
                const categoryItems = menuItems.filter(
                  (item) => (item.category || "Other") === category,
                );

                return (
                  <section key={category} className="restaurant-menu-category">
                    <div className="restaurant-menu-category-heading">
                      <div>
                        <span>Category</span>

                        <h2>{category}</h2>
                      </div>

                      <div className="restaurant-menu-category-meta">
                        {categoryItems.length}{" "}
                        {categoryItems.length === 1 ? "item" : "items"}
                      </div>
                    </div>

                    <div className="restaurant-menu-grid">
                      {categoryItems.map((item) => {
                        const quantity = getItemQuantity(item._id);

                        const stockLimitReached = hasReachedStockLimit(item);

                        return (
                          <article
                            key={item._id}
                            className="restaurant-menu-card"
                          >
                            <div
                              className="restaurant-menu-image-wrapper"
                              role="button"
                              tabIndex={0}
                              aria-label={`Open ${item.name} preview`}
                              onClick={() => handleViewItemDetails(item)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  handleViewItemDetails(item);
                                }
                              }}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="restaurant-menu-image"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="restaurant-menu-image-placeholder">
                                  <Utensils size={30} />

                                  <span>No image</span>
                                </div>
                              )}

                              {quantity > 0 && (
                                <span className="restaurant-menu-in-cart-badge">
                                  {quantity} in cart
                                </span>
                              )}
                            </div>

                            <div className="restaurant-menu-card-content">
                              <span className="restaurant-menu-item-category">
                                {item.category || "Other"}
                              </span>

                              <div className="restaurant-menu-card-title-row">
                                <h3>{item.name}</h3>

                                <strong className="restaurant-menu-price">
                                  R{Number(item.price || 0).toFixed(2)}
                                </strong>
                              </div>

                              <p className="restaurant-menu-item-description">
                                {item.description ||
                                  "A delicious option from this restaurant."}
                              </p>

                              {/* ======================================
                                  EXTRA ITEM INFORMATION
                                  No stock quantities are shown here.
                              ====================================== */}

                              <div className="restaurant-menu-item-extra">
                                <div className="restaurant-menu-item-extra-row">
                                  <Store size={15} />

                                  <span>Restaurant</span>

                                  <strong>
                                    {restaurant?.name || "Dish Dash restaurant"}
                                  </strong>
                                </div>

                                <div className="restaurant-menu-item-extra-row">
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

                              <div className="restaurant-menu-card-actions">
                                {/* ======================================
                                    VIEW ITEM DETAILS
                                ====================================== */}

                                <button
                                  type="button"
                                  className="restaurant-menu-details-button"
                                  onClick={() => handleViewItemDetails(item)}
                                >
                                  <Eye size={17} />

                                  <span>View Details</span>
                                </button>

                                {/* ======================================
                                    ADD TO CART
                                ====================================== */}

                                <button
                                  type="button"
                                  className={`restaurant-menu-add-button${
                                    stockLimitReached || orderingBlocked
                                      ? " restaurant-menu-add-button--disabled"
                                      : ""
                                  }${
                                    orderingBlocked
                                      ? " restaurant-menu-add-button--closed"
                                      : ""
                                  }`}
                                  disabled={
                                    stockLimitReached || orderingBlocked
                                  }
                                  onClick={() => handleAddToCart(item)}
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
                  </section>
                );
              })}
            </>
          )}
        </div>
      </main>

      {/* ======================================
          MENU ITEM PREVIEW CARD
      ====================================== */}

      <MenuItemCard
        isOpen={itemPreviewOpen && Boolean(selectedMenuItem)}
        item={selectedMenuItem}
        restaurant={restaurant}
        restaurantItems={menuItems}
        cartItems={cart}
        onClose={() => {
          setItemPreviewOpen(false);
          setSelectedMenuItem(null);
        }}
        onVisitItem={handleVisitItemPage}
        onVisitRelatedItem={(menuItem) => {
          setSelectedMenuItem(menuItem);
        }}
        onViewCart={() => {
          setItemPreviewOpen(false);
          setCartPreviewOpen(true);
        }}
        onGoToCart={() => {
          setItemPreviewOpen(false);
          setCartPreviewOpen(false);
          navigate("/cart");
        }}
        onAddItem={handleAddToCart}
        onRemoveItem={handleRemoveFromCart}
      />

      {/* ======================================
          CART PREVIEW CARD
      ====================================== */}

      <CartCard
        isOpen={cartPreviewOpen}
        cartItems={cart}
        onClose={() => setCartPreviewOpen(false)}
        onContinueToCart={() => {
          setCartPreviewOpen(false);
          navigate("/cart");
        }}
        onAddItem={(menuItem) => {
          handleAddToCart(menuItem);
        }}
        onRemoveItem={handleRemoveFromCart}
        onRemoveItemCompletely={handleRemoveItemCompletely}
        onVisitItem={(menuItem) => {
          setCartPreviewOpen(false);
          handleViewItemDetails(menuItem);
        }}
      />

      <Footer />
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default CustomerRestaurantMenuPage;
