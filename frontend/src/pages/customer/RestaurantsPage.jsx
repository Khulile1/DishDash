// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  Banknote,
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
  ShoppingCart,
  Store,
} from "lucide-react";

import { getRestaurants } from "../../services/restaurantService";

import { getMenuItems } from "../../services/menuItemService";

import { getRestaurantDistances } from "../../services/routingService";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import RestaurantCard from "../../components/cards/RestaurantCard";
import MenuItemCard from "../../components/cards/MenuItemCard";
import CartCard from "../../components/cards/CartCard";

import useCart from "../../hooks/useCart";

import "../../styles/Restaurants.css";

// ======================================
// RESTAURANT CATEGORIES
// ======================================
//
// These values must match Restaurant.category
// in the backend.
//
// "all" is only used by the frontend.
// It is not stored in MongoDB.
// ======================================

const RESTAURANT_CATEGORIES = [
  {
    label: "All",
    value: "all",
  },

  {
    label: "Fast Food",
    value: "fast-food",
  },

  {
    label: "African",
    value: "african",
  },

  {
    label: "Braai & Grill",
    value: "grill",
  },

  {
    label: "Italian",
    value: "italian",
  },

  {
    label: "Seafood",
    value: "seafood",
  },
];

// ======================================
// RESTAURANTS PAGE
// ======================================

function Restaurants() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  // ======================================
  // SELECTED CATEGORY
  // ======================================

  const requestedCategory = String(searchParams.get("category") || "all")
    .trim()
    .toLowerCase();

  const selectedCategory = RESTAURANT_CATEGORIES.some(
    (category) => category.value === requestedCategory,
  )
    ? requestedCategory
    : "all";

  // ======================================
  // RESTAURANTS
  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  // ======================================
  // MENU ITEMS
  // ======================================

  const [menuItems, setMenuItems] = useState([]);

  // ======================================
  // SHARED USER CART
  // ======================================
  //
  // Restaurants, preview cards and
  // CartPage all use the same cart for
  // the currently logged-in user.
  // ======================================

  const { cart, setCart, removeOne, removeItem, cartQuantity } = useCart();

  // ======================================
  // PREVIEW CARDS
  // ======================================

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [restaurantPreviewOpen, setRestaurantPreviewOpen] = useState(false);

  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [itemPreviewOpen, setItemPreviewOpen] = useState(false);

  // ======================================
  // ROUTING / DRIVE TIME
  // ======================================
  //
  // Keyed by restaurant ID:
  //
  // {
  //   "restaurantId": {
  //     restaurantId: "...",
  //     distanceKm: 8.7,
  //     durationMinutes: 14,
  //     deliveryPrice: 10.44,
  //     reachable: true
  //   }
  // }
  // ======================================

  const [restaurantDistances, setRestaurantDistances] = useState({});

  const [distanceMessage, setDistanceMessage] = useState("");

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Refresh live Open / Closed status
  // once per minute.

  const [, setStatusTick] = useState(0);

  // ======================================
  // FORMAT RESTAURANT ADDRESS
  // ======================================

  const formatRestaurantAddress = (restaurant) => {
    if (!restaurant) {
      return "";
    }

    // Prefer complete Geoapify address.

    if (restaurant.formatted_address) {
      return restaurant.formatted_address;
    }

    return [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ======================================
  // OPEN / CLOSED STATUS
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
  // SOUTH AFRICA CURRENT TIME
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
      // Same opening and closing time
      // means open 24 hours.

      if (opening === closing) {
        return true;
      }

      // Normal same-day hours.

      if (opening < closing) {
        return current >= opening && current < closing;
      }

      // Overnight:
      // 18:00 - 02:00

      return current >= opening || current < closing;
    }

    // Fallback to backend virtual.

    if (typeof restaurant.is_open === "boolean") {
      return restaurant.is_open;
    }

    return null;
  };

  // ======================================
  // FORMAT OPERATING HOURS
  // ======================================

  const formatOperatingHours = (restaurant) => {
    const opening = restaurant?.opening_time;

    const closing = restaurant?.closing_time;

    if (!opening || !closing) {
      return "";
    }

    if (opening === closing) {
      return "24 hours";
    }

    return `${opening} – ${closing}`;
  };

  // ======================================
  // BUILD DISTANCE LOOKUP
  // ======================================

  const buildDistanceLookup = (distanceData, restaurantList = []) => {
    const lookup = {};

    let distances = [];

    if (Array.isArray(distanceData)) {
      distances = distanceData;
    } else if (Array.isArray(distanceData?.distances)) {
      distances = distanceData.distances;
    } else if (Array.isArray(distanceData?.distances?.distances)) {
      distances = distanceData.distances.distances;
    }

    distances.forEach((item, index) => {
      // Prefer restaurant ID supplied
      // by routing API.
      //
      // Otherwise fall back to the
      // restaurant at the same index.

      const restaurantId =
        item?.restaurantId ||
        item?.restaurant_id ||
        item?.id ||
        restaurantList[index]?._id;

      if (!restaurantId) {
        return;
      }

      const distanceMeters =
        item?.distanceMeters ?? item?.distance_meters ?? item?.distance ?? null;

      const durationSeconds =
        item?.durationSeconds ?? item?.duration_seconds ?? item?.time ?? null;

      const distanceKmRaw =
        item?.distanceKm ??
        item?.distance_km ??
        (Number.isFinite(Number(distanceMeters))
          ? Number(distanceMeters) / 1000
          : null);

      const durationMinutesRaw =
        item?.durationMinutes ??
        item?.duration_minutes ??
        (Number.isFinite(Number(durationSeconds))
          ? Math.ceil(Number(durationSeconds) / 60)
          : null);

      const deliveryPriceRaw =
        item?.deliveryPrice ?? item?.delivery_price ?? null;

      lookup[String(restaurantId)] = {
        ...item,

        restaurantId: String(restaurantId),

        reachable: item?.reachable !== false,

        distanceKm: Number.isFinite(Number(distanceKmRaw))
          ? Number(Number(distanceKmRaw).toFixed(1))
          : null,

        durationMinutes: Number.isFinite(Number(durationMinutesRaw))
          ? Number(durationMinutesRaw)
          : null,

        deliveryPrice: Number.isFinite(Number(deliveryPriceRaw))
          ? Number(Number(deliveryPriceRaw).toFixed(2))
          : null,
      };
    });

    return lookup;
  };

  // ======================================
  // SORT RESTAURANTS BY DRIVE TIME
  // ======================================

  const sortRestaurantsByDriveTime = (restaurantList, routeLookup) => {
    return [...restaurantList].sort((restaurantA, restaurantB) => {
      const routeA = routeLookup[String(restaurantA._id)];

      const routeB = routeLookup[String(restaurantB._id)];

      const minutesA =
        routeA?.reachable && Number.isFinite(Number(routeA.durationMinutes))
          ? Number(routeA.durationMinutes)
          : Number.POSITIVE_INFINITY;

      const minutesB =
        routeB?.reachable && Number.isFinite(Number(routeB.durationMinutes))
          ? Number(routeB.durationMinutes)
          : Number.POSITIVE_INFINITY;

      if (minutesA !== minutesB) {
        return minutesA - minutesB;
      }

      const distanceA = Number(routeA?.distanceKm);

      const distanceB = Number(routeB?.distanceKm);

      if (Number.isFinite(distanceA) && Number.isFinite(distanceB)) {
        return distanceA - distanceB;
      }

      return 0;
    });
  };

  // ======================================
  // LOAD RESTAURANTS + DRIVE TIMES
  // ======================================

  const loadRestaurants = async () => {
    try {
      setLoading(true);

      setError("");

      setDistanceMessage("");

      // ======================================
      // GET RESTAURANTS + MENU
      // ======================================

      const [restaurantData, menuData] = await Promise.all([
        getRestaurants(),

        getMenuItems(),
      ]);

      const restaurantList = Array.isArray(restaurantData)
        ? restaurantData
        : Array.isArray(restaurantData?.restaurants)
          ? restaurantData.restaurants
          : [];

      const menuList = Array.isArray(menuData)
        ? menuData
        : Array.isArray(menuData?.menuItems)
          ? menuData.menuItems
          : [];

      setMenuItems(menuList);

      // ======================================
      // GET REAL DRIVING TIMES
      // ======================================

      let distanceLookup = {};

      try {
        const distanceData = await getRestaurantDistances();

        distanceLookup = buildDistanceLookup(distanceData, restaurantList);

        setRestaurantDistances(distanceLookup);
      } catch (distanceError) {
        console.error("Could not load restaurant drive times:", distanceError);

        setRestaurantDistances({});

        const status = distanceError.response?.status;

        if (status === 404) {
          setDistanceMessage(
            distanceError.response?.data?.message ||
              "Add a delivery address to see estimated drive time.",
          );
        } else {
          setDistanceMessage("Drive times are temporarily unavailable.");
        }
      }

      // ======================================
      // SHORTEST DRIVE TIME FIRST
      // ======================================

      const sortedRestaurants = sortRestaurantsByDriveTime(
        restaurantList,
        distanceLookup,
      );

      setRestaurants(sortedRestaurants);
    } catch (error) {
      console.error("Error loading restaurants:", error);

      setError(
        error.response?.data?.message ||
          "Could not load restaurants. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    loadRestaurants();
  }, []);

  // ======================================
  // REFRESH OPEN / CLOSED STATUS
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
  // REFRESH WHEN DELIVERY ADDRESS CHANGES
  // ======================================

  useEffect(() => {
    const handleAddressChanged = () => {
      loadRestaurants();
    };

    window.addEventListener("addressChanged", handleAddressChanged);

    return () => {
      window.removeEventListener("addressChanged", handleAddressChanged);
    };
  }, []);

  // ======================================
  // FILTER RESTAURANTS
  // ======================================

  const filteredRestaurants =
    selectedCategory === "all"
      ? restaurants
      : restaurants.filter(
          (restaurant) =>
            String(restaurant.category || "")
              .trim()
              .toLowerCase() === selectedCategory,
        );

  // ======================================
  // SELECTED CATEGORY LABEL
  // ======================================

  const selectedCategoryLabel =
    RESTAURANT_CATEGORIES.find(
      (category) => category.value === selectedCategory,
    )?.label || "All";

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
  // BACK TO HOME
  // ======================================

  const handleBack = () => {
    navigate("/home");
  };

  // ======================================
  // OPEN RESTAURANT
  // ======================================

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);

    setRestaurantPreviewOpen(true);
  };

  // ======================================
  // VISIT RESTAURANT PAGE DIRECTLY
  // ======================================

  const handleVisitRestaurant = (restaurant) => {
    if (!restaurant?._id) {
      return;
    }

    navigate(`/restaurants/${restaurant._id}`);
  };

  // ======================================
  // GET MENU ITEM RESTAURANT ID
  // ======================================

  const getMenuItemRestaurantId = (menuItem) => {
    if (menuItem?.restaurant_id && typeof menuItem.restaurant_id === "object") {
      return String(menuItem.restaurant_id._id || "");
    }

    return String(menuItem?.restaurant_id || "");
  };

  // ======================================
  // GET RESTAURANT MENU
  // ======================================

  const getRestaurantMenu = (restaurantId) => {
    return menuItems
      .filter((item) => {
        const belongsToRestaurant =
          getMenuItemRestaurantId(item) === String(restaurantId);

        const available = item.available !== false;

        const hasStock =
          !item.track_stock || Number(item.stock_quantity || 0) > 0;

        return belongsToRestaurant && available && hasStock;
      })
      .slice(0, 5);
  };

  // ======================================
  // GET RESTAURANT FOR MENU ITEM
  // ======================================

  const getRestaurantForMenuItem = (menuItem) => {
    const restaurantId = getMenuItemRestaurantId(menuItem);

    return (
      restaurants.find(
        (restaurant) => String(restaurant._id) === String(restaurantId),
      ) || null
    );
  };

  // ======================================
  // OPEN MENU ITEM PREVIEW
  // ======================================

  const handleOpenMenuItemPreview = (menuItem) => {
    if (!menuItem) {
      return;
    }

    setSelectedMenuItem(menuItem);

    // Keep only one preview card open.

    setRestaurantPreviewOpen(false);

    setCartPreviewOpen(false);

    setItemPreviewOpen(true);
  };

  // ======================================
  // ADD ITEM TO CART
  // ======================================

  const handleAddToCart = (menuItem, restaurantData) => {
    if (!menuItem) {
      return;
    }

    if (restaurantData && getRestaurantOpenState(restaurantData) === false) {
      return;
    }

    if (menuItem.available === false) {
      return;
    }

    const existingItem = cart.find(
      (item) => String(item._id) === String(menuItem._id),
    );

    const currentQuantity = Number(existingItem?.quantity || 0);

    if (menuItem.track_stock) {
      const availableStock = Math.max(
        0,

        Number(menuItem.stock_quantity || 0),
      );

      if (availableStock <= 0 || currentQuantity >= availableStock) {
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

          restaurant_name: restaurantData?.name || "",
        },
      ];
    }

    setCart(updatedCart);
  };

  // ======================================
  // REMOVE ONE ITEM FROM CART
  // ======================================

  const handleRemoveFromCart = (menuItem) => {
    if (!menuItem) {
      return;
    }

    removeOne(menuItem);
  };

  // ======================================
  // REMOVE ITEM COMPLETELY
  // ======================================

  const handleRemoveItemCompletely = (menuItem) => {
    if (!menuItem) {
      return;
    }

    removeItem(menuItem);
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurants-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="restaurants-page">
        <div className="restaurants-container">
          {/* ======================================
              TOP PAGE ACTIONS
          ====================================== */}

          <div className="restaurants-top-actions">
            <button
              type="button"
              className="restaurants-back-button"
              onClick={handleBack}
            >
              <ArrowLeft size={18} />

              <span>Back to Home</span>
            </button>

            <button
              type="button"
              className="restaurants-cart-preview-button"
              onClick={() => setCartPreviewOpen(true)}
            >
              <ShoppingCart size={18} />

              <span>View Cart</span>

              {cartQuantity > 0 && (
                <span className="restaurants-cart-preview-count">
                  {cartQuantity}
                </span>
              )}
            </button>
          </div>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="restaurants-header mobile-page-header">
            <div className="restaurants-header-content">
              <span className="restaurants-eyebrow">
                <Store size={16} />
                Explore restaurants
              </span>

              <h1>
                {selectedCategory === "all"
                  ? "Restaurants"
                  : `${selectedCategoryLabel} Restaurants`}
              </h1>

              <p>
                Discover restaurants and compare estimated driving time from
                your delivery address.
              </p>

              {distanceMessage && (
                <button
                  type="button"
                  className="restaurants-add-location"
                  onClick={() => navigate("/addresses")}
                >
                  <MapPin size={16} />

                  {distanceMessage}
                </button>
              )}
            </div>

            {!loading && !error && filteredRestaurants.length > 0 && (
              <div className="restaurants-count">
                <strong>{filteredRestaurants.length}</strong>

                <span>
                  {filteredRestaurants.length === 1
                    ? "Restaurant"
                    : "Restaurants"}
                </span>
              </div>
            )}
          </section>
          {/* ======================================
            CATEGORY PILLS
        ====================================== */}

          <section
            className="restaurants-category-section"
            aria-label="Restaurant categories"
          >
            <div className="restaurants-category-container">
              <div className="restaurants-category-scroll">
                {RESTAURANT_CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category.value;

                  return (
                    <button
                      key={category.value}
                      type="button"
                      className={`restaurants-category-pill${
                        isActive ? " restaurants-category-pill--active" : ""
                      }`}
                      onClick={() => handleCategoryChange(category.value)}
                      aria-pressed={isActive}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <section className="restaurants-state">
              <div className="restaurants-loader" />

              <h2>Loading restaurants</h2>

              <p>
                Finding restaurants and calculating estimated drive time from
                your delivery address.
              </p>
            </section>
          )}

          {/* ======================================
              ERROR
          ====================================== */}

          {!loading && error && (
            <section className="restaurants-state restaurants-state--error">
              <div className="restaurants-state-icon">
                <Store size={28} />
              </div>

              <h2>Unable to load restaurants</h2>

              <p>{error}</p>

              <button
                type="button"
                className="restaurants-retry-button"
                onClick={loadRestaurants}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          )}

          {/* ======================================
              NO RESTAURANTS AT ALL
          ====================================== */}

          {!loading && !error && restaurants.length === 0 && (
            <section className="restaurants-state">
              <div className="restaurants-state-icon">
                <Store size={28} />
              </div>

              <h2>No restaurants yet</h2>

              <p>There are currently no restaurants available.</p>
            </section>
          )}

          {/* ======================================
              CATEGORY HAS NO RESTAURANTS
          ====================================== */}

          {!loading &&
            !error &&
            restaurants.length > 0 &&
            filteredRestaurants.length === 0 && (
              <section className="restaurants-state">
                <div className="restaurants-state-icon">
                  <Store size={28} />
                </div>

                <h2>No {selectedCategoryLabel} restaurants yet</h2>

                <p>
                  There are currently no restaurants in this category. Try
                  another category.
                </p>

                <button
                  type="button"
                  className="restaurants-retry-button"
                  onClick={() => handleCategoryChange("all")}
                >
                  View All Restaurants
                </button>
              </section>
            )}

          {/* ======================================
              RESTAURANT GRID
          ====================================== */}

          {!loading && !error && filteredRestaurants.length > 0 && (
            <section className="restaurants-grid">
              {filteredRestaurants.map((restaurant, index) => {
                const routeInfo =
                  restaurantDistances[String(restaurant._id)] || null;

                const restaurantAddress = formatRestaurantAddress(restaurant);

                // Some routing responses contain
                // distance/time without an explicit
                // reachable=true flag.

                const hasRouteData =
                  routeInfo &&
                  Number.isFinite(Number(routeInfo.durationMinutes)) &&
                  Number.isFinite(Number(routeInfo.distanceKm));

                const hasDeliveryPrice =
                  routeInfo && Number.isFinite(Number(routeInfo.deliveryPrice));

                // Since restaurants are already
                // ordered by route time, the first
                // item in the filtered list is also
                // the closest restaurant in that
                // selected category.

                const isClosest = index === 0 && hasRouteData;

                const isOpen = getRestaurantOpenState(restaurant);

                const isClosed = isOpen === false;

                const operatingHours = formatOperatingHours(restaurant);

                return (
                  <article
                    key={restaurant._id}
                    className={`restaurants-card${
                      isClosed ? " restaurants-card--closed" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      isClosed
                        ? `${restaurant.name} is currently closed`
                        : `View ${restaurant.name}`
                    }
                    onClick={() => handleRestaurantClick(restaurant)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();

                        handleRestaurantClick(restaurant);
                      }
                    }}
                  >
                    {/* ======================================
                            IMAGE
                        ====================================== */}

                    <div className="restaurants-card-image-wrapper">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="restaurants-card-image"
                        />
                      ) : (
                        <div className="restaurants-image-placeholder">
                          <Store size={34} />

                          <span>No image available</span>
                        </div>
                      )}

                      {/* ======================================
                              OPEN / CLOSED
                          ====================================== */}

                      {typeof isOpen === "boolean" && (
                        <span
                          className={
                            isOpen
                              ? "restaurants-status restaurants-status--open"
                              : "restaurants-status restaurants-status--closed"
                          }
                        >
                          {isOpen ? "Open" : "Closed"}
                        </span>
                      )}

                      {/* ======================================
                              HOURS
                          ====================================== */}

                      {operatingHours && (
                        <span className="restaurants-hours-badge">
                          <Clock3 size={13} />

                          <span>{operatingHours}</span>
                        </span>
                      )}

                      {/* ======================================
                              CLOSEST
                          ====================================== */}

                      {isClosest && (
                        <span className="restaurants-nearest-badge">
                          <Sparkles size={13} />
                          Closest
                        </span>
                      )}
                    </div>

                    {/* ======================================
                            CONTENT
                        ====================================== */}

                    <div className="restaurants-card-content">
                      {/* CATEGORY */}

                      {restaurant.category && (
                        <span className="restaurants-card-category">
                          {RESTAURANT_CATEGORIES.find(
                            (category) =>
                              category.value === restaurant.category,
                          )?.label || restaurant.category}
                        </span>
                      )}

                      <h2>{restaurant.name}</h2>

                      <p className="restaurants-description">
                        {restaurant.description ||
                          "View this restaurant's menu and discover what's available."}
                      </p>

                      {/* ======================================
                              ADDRESS
                          ====================================== */}

                      {restaurantAddress && (
                        <div className="restaurants-address">
                          <MapPin size={16} />

                          <span>{restaurantAddress}</span>
                        </div>
                      )}

                      {/* ======================================
                              DRIVE TIME + DISTANCE + DELIVERY
                          ====================================== */}

                      {hasRouteData && (
                        <div className="restaurants-route-summary">
                          <div className="restaurants-route-chip restaurants-route-chip--time">
                            <Clock3 size={16} />

                            <strong>{routeInfo.durationMinutes} min</strong>
                          </div>

                          <div className="restaurants-route-chip">
                            <Navigation size={16} />

                            <strong>{routeInfo.distanceKm} km</strong>
                          </div>

                          {hasDeliveryPrice && (
                            <div className="restaurants-route-chip restaurants-route-chip--delivery">
                              <Banknote size={16} />

                              <strong>
                                R{Number(routeInfo.deliveryPrice).toFixed(2)}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ======================================
                              ROUTE UNAVAILABLE
                          ====================================== */}

                      {routeInfo &&
                        !hasRouteData &&
                        routeInfo.reachable === false && (
                          <div className="restaurants-route-unavailable">
                            <MapPin size={16} />
                            Route unavailable
                          </div>
                        )}

                      {!hasRouteData &&
                        (!routeInfo || routeInfo.reachable !== false) &&
                        distanceMessage && (
                          <div className="restaurants-route-unavailable">
                            <MapPin size={16} />
                            Travel info unavailable
                          </div>
                        )}

                      {/* ======================================
                              VIEW BUTTON
                          ====================================== */}

                      <button
                        type="button"
                        className={`restaurants-view-button${
                          isClosed ? " restaurants-view-button--closed" : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();

                          handleVisitRestaurant(restaurant);
                        }}
                      >
                        Visit Page
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      {/* ======================================
          RESTAURANT PREVIEW CARD
      ====================================== */}

      <RestaurantCard
        isOpen={restaurantPreviewOpen && Boolean(selectedRestaurant)}
        restaurant={selectedRestaurant}
        menuItems={
          selectedRestaurant ? getRestaurantMenu(selectedRestaurant._id) : []
        }
        cartItems={cart}
        onClose={() => setRestaurantPreviewOpen(false)}
        onVisitRestaurant={(restaurant) => {
          setRestaurantPreviewOpen(false);

          handleVisitRestaurant(restaurant);
        }}
        onVisitItem={handleOpenMenuItemPreview}
        onViewCart={() => {
          setRestaurantPreviewOpen(false);

          setCartPreviewOpen(true);
        }}
        onGoToCart={() => {
          setRestaurantPreviewOpen(false);

          navigate("/cart");
        }}
        onAddItem={(menuItem) => handleAddToCart(menuItem, selectedRestaurant)}
        onRemoveItem={handleRemoveFromCart}
      />

      {/* ======================================
          MENU ITEM PREVIEW CARD
      ====================================== */}

      <MenuItemCard
        isOpen={itemPreviewOpen && Boolean(selectedMenuItem)}
        item={selectedMenuItem}
        restaurant={
          selectedMenuItem ? getRestaurantForMenuItem(selectedMenuItem) : null
        }
        restaurantItems={
          selectedMenuItem
            ? getRestaurantMenu(getMenuItemRestaurantId(selectedMenuItem))
            : []
        }
        cartItems={cart}
        onClose={() => {
          setItemPreviewOpen(false);

          setSelectedMenuItem(null);
        }}
        onVisitItem={(menuItem) => {
          setItemPreviewOpen(false);

          navigate(`/menu-items/${menuItem._id}`);
        }}
        onVisitRelatedItem={(menuItem) => {
          setSelectedMenuItem(menuItem);
        }}
        onViewCart={() => {
          setItemPreviewOpen(false);

          setCartPreviewOpen(true);
        }}
        onGoToCart={() => {
          setItemPreviewOpen(false);

          navigate("/cart");
        }}
        onAddItem={(menuItem) => {
          const itemRestaurant = getRestaurantForMenuItem(menuItem);

          handleAddToCart(menuItem, itemRestaurant);
        }}
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
          const itemRestaurant = getRestaurantForMenuItem(menuItem);

          handleAddToCart(menuItem, itemRestaurant);
        }}
        onRemoveItem={handleRemoveFromCart}
        onRemoveItemCompletely={handleRemoveItemCompletely}
        onVisitItem={handleOpenMenuItemPreview}
      />

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

export default Restaurants;
