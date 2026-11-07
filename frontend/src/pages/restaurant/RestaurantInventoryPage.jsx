// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Minus,
  Package,
  PackageX,
  Plus,
  Search,
  Store,
  Utensils,
} from "lucide-react";

import { jwtDecode } from "jwt-decode";

import { getRestaurants } from "../../services/restaurantService";

import {
  getMenuItems,
  updateMenuItemStock,
  increaseMenuItemStock,
  decreaseMenuItemStock,
} from "../../services/menuItemService";

// RestaurantNavbar is in the same folder
import RestaurantNavbar from "./RestaurantNavbar";

import "../../styles/RestaurantInventoryPage.css";

// ======================================
// RESTAURANT INVENTORY PAGE
// ======================================

function RestaurantInventoryPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // RESTAURANTS
  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  // ======================================
  // MENU ITEMS
  // ======================================

  const [menuItems, setMenuItems] = useState([]);

  // ======================================
  // SEARCH / FILTER
  // ======================================

  const [searchTerm, setSearchTerm] = useState("");

  const [stockFilter, setStockFilter] = useState("all");

  // ======================================
  // STOCK INPUT DRAFTS
  // ======================================

  const [stockDrafts, setStockDrafts] = useState({});

  const [thresholdDrafts, setThresholdDrafts] = useState({});

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ======================================
  // GET BACKEND ERROR MESSAGE
  // ======================================

  const getErrorMessage = (error, fallbackMessage) => {
    console.error("REQUEST ERROR:", error);

    console.error("STATUS:", error.response?.status);

    console.error("BACKEND DATA:", error.response?.data);

    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage
    );
  };

  // ======================================
  // GET LOGGED-IN USER ID
  // ======================================

  const getLoggedInUserId = () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return null;
      }

      const decoded = jwtDecode(token);

      return decoded.id || decoded._id || decoded.userId || null;
    } catch (error) {
      console.error("Could not decode token:", error);

      return null;
    }
  };

  // ======================================
  // GET RESTAURANT ID FROM MENU ITEM
  // ======================================

  const getMenuItemRestaurantId = (item) => {
    if (item?.restaurant_id && typeof item.restaurant_id === "object") {
      return String(item.restaurant_id._id || "");
    }

    return String(item?.restaurant_id || "");
  };

  // ======================================
  // LOAD INVENTORY
  // ======================================

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const ownerId = getLoggedInUserId();

      if (!ownerId) {
        setError("Could not identify the logged-in restaurant account.");

        return;
      }

      // ======================================
      // LOAD RESTAURANTS + MENU ITEMS
      // ======================================

      const [restaurantResponse, menuResponse] = await Promise.all([
        getRestaurants(),
        getMenuItems(),
      ]);

      // ======================================
      // NORMALISE RESTAURANTS
      // ======================================

      const restaurantList = Array.isArray(restaurantResponse)
        ? restaurantResponse
        : Array.isArray(restaurantResponse?.restaurants)
          ? restaurantResponse.restaurants
          : [];

      // ======================================
      // ONLY RESTAURANTS OWNED BY USER
      // ======================================

      const ownedRestaurants = restaurantList.filter((restaurant) => {
        const restaurantOwnerId =
          typeof restaurant.owner_id === "object"
            ? restaurant.owner_id?._id || restaurant.owner_id?.id
            : restaurant.owner_id;

        return String(restaurantOwnerId || "") === String(ownerId);
      });

      setRestaurants(ownedRestaurants);

      // ======================================
      // SELECT FIRST RESTAURANT
      // ======================================

      if (ownedRestaurants.length > 0) {
        setSelectedRestaurantId((current) => {
          const stillExists = ownedRestaurants.some(
            (restaurant) => String(restaurant._id) === String(current),
          );

          return stillExists ? current : ownedRestaurants[0]._id;
        });
      } else {
        setSelectedRestaurantId("");
      }

      // ======================================
      // NORMALISE MENU ITEMS
      // ======================================

      const itemList = Array.isArray(menuResponse)
        ? menuResponse
        : Array.isArray(menuResponse?.menuItems)
          ? menuResponse.menuItems
          : [];

      setMenuItems(itemList);

      // ======================================
      // PREPARE INPUT VALUES
      // ======================================

      const stockValues = {};

      const thresholdValues = {};

      itemList.forEach((item) => {
        stockValues[item._id] = String(item.stock_quantity ?? 0);

        thresholdValues[item._id] = String(item.low_stock_threshold ?? 5);
      });

      setStockDrafts(stockValues);

      setThresholdDrafts(thresholdValues);
    } catch (error) {
      setError(getErrorMessage(error, "Could not load inventory."));
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    loadInventory();
  }, []);

  // ======================================
  // SELECTED RESTAURANT
  // ======================================

  const selectedRestaurant = restaurants.find(
    (restaurant) => String(restaurant._id) === String(selectedRestaurantId),
  );

  // ======================================
  // ITEMS FOR SELECTED RESTAURANT
  // ======================================

  const restaurantItems = useMemo(() => {
    if (!selectedRestaurantId) {
      return [];
    }

    return menuItems.filter(
      (item) => getMenuItemRestaurantId(item) === String(selectedRestaurantId),
    );
  }, [menuItems, selectedRestaurantId]);

  // ======================================
  // STOCK STATUS
  // ======================================

  const getStockStatus = (item) => {
    if (!item.track_stock) {
      return {
        key: "not-tracked",

        label: "Not tracked",

        className:
          "restaurant-inventory-status restaurant-inventory-status--not-tracked",
      };
    }

    const quantity = Number(item.stock_quantity || 0);

    const threshold = Number(item.low_stock_threshold ?? 5);

    if (quantity <= 0) {
      return {
        key: "out",

        label: "Out of stock",

        className:
          "restaurant-inventory-status restaurant-inventory-status--out",
      };
    }

    if (quantity <= threshold) {
      return {
        key: "low",

        label: "Low stock",

        className:
          "restaurant-inventory-status restaurant-inventory-status--low",
      };
    }

    return {
      key: "good",

      label: "In stock",

      className:
        "restaurant-inventory-status restaurant-inventory-status--good",
    };
  };

  // ======================================
  // FILTERED ITEMS
  // ======================================

  const visibleItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return restaurantItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (stockFilter === "all") {
        return true;
      }

      return getStockStatus(item).key === stockFilter;
    });
  }, [restaurantItems, searchTerm, stockFilter]);

  // ======================================
  // INVENTORY STATS
  // ======================================

  const totalUnits = restaurantItems.reduce(
    (total, item) =>
      total + (item.track_stock ? Number(item.stock_quantity || 0) : 0),
    0,
  );

  const lowStockCount = restaurantItems.filter(
    (item) => getStockStatus(item).key === "low",
  ).length;

  const outOfStockCount = restaurantItems.filter(
    (item) => getStockStatus(item).key === "out",
  ).length;

  // ======================================
  // UPDATE ITEM LOCALLY
  // ======================================

  const replaceMenuItem = (updatedItem) => {
    if (!updatedItem?._id) {
      return;
    }

    setMenuItems((currentItems) =>
      currentItems.map((item) =>
        item._id === updatedItem._id
          ? {
              ...item,
              ...updatedItem,
            }
          : item,
      ),
    );

    setStockDrafts((current) => ({
      ...current,

      [updatedItem._id]: String(updatedItem.stock_quantity ?? 0),
    }));

    setThresholdDrafts((current) => ({
      ...current,

      [updatedItem._id]: String(updatedItem.low_stock_threshold ?? 5),
    }));
  };

  // ======================================
  // GET UPDATED ITEM FROM RESPONSE
  // ======================================

  const getUpdatedItem = (response) => {
    return response?.menuItem || response?.item || response;
  };

  // ======================================
  // INCREASE STOCK
  // ======================================

  const handleIncreaseStock = async (item) => {
    try {
      setUpdatingItemId(item._id);

      setError("");
      setSuccess("");

      const data = await increaseMenuItemStock(item._id, 1);

      replaceMenuItem(getUpdatedItem(data));

      setSuccess(`${item.name} stock increased.`);
    } catch (error) {
      setError(getErrorMessage(error, "Could not increase stock."));
    } finally {
      setUpdatingItemId("");
    }
  };

  // ======================================
  // DECREASE STOCK
  // ======================================

  const handleDecreaseStock = async (item) => {
    try {
      setUpdatingItemId(item._id);

      setError("");
      setSuccess("");

      const data = await decreaseMenuItemStock(item._id, 1);

      replaceMenuItem(getUpdatedItem(data));

      setSuccess(`${item.name} stock decreased.`);
    } catch (error) {
      setError(getErrorMessage(error, "Could not decrease stock."));
    } finally {
      setUpdatingItemId("");
    }
  };

  // ======================================
  // SET EXACT STOCK
  // ======================================

  const handleSaveStock = async (item) => {
    const rawValue = stockDrafts[item._id];

    const quantity = Number(rawValue);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Stock quantity must be a whole number of 0 or more.");

      setStockDrafts((current) => ({
        ...current,

        [item._id]: String(item.stock_quantity ?? 0),
      }));

      return;
    }

    if (quantity === Number(item.stock_quantity || 0) && item.track_stock) {
      return;
    }

    try {
      setUpdatingItemId(item._id);

      setError("");
      setSuccess("");

      const data = await updateMenuItemStock(item._id, {
        track_stock: true,

        stock_quantity: quantity,

        low_stock_threshold: Number(item.low_stock_threshold ?? 5),
      });

      replaceMenuItem(getUpdatedItem(data));

      setSuccess(`${item.name} stock updated.`);
    } catch (error) {
      setError(getErrorMessage(error, "Could not update stock."));
    } finally {
      setUpdatingItemId("");
    }
  };

  // ======================================
  // SAVE LOW STOCK THRESHOLD
  // ======================================

  const handleSaveThreshold = async (item) => {
    const threshold = Number(thresholdDrafts[item._id]);

    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Low stock alert must be a whole number of 0 or more.");

      setThresholdDrafts((current) => ({
        ...current,

        [item._id]: String(item.low_stock_threshold ?? 5),
      }));

      return;
    }

    if (threshold === Number(item.low_stock_threshold ?? 5)) {
      return;
    }

    try {
      setUpdatingItemId(item._id);

      setError("");
      setSuccess("");

      const data = await updateMenuItemStock(item._id, {
        track_stock: item.track_stock,

        stock_quantity: Number(item.stock_quantity || 0),

        low_stock_threshold: threshold,
      });

      replaceMenuItem(getUpdatedItem(data));

      setSuccess(`${item.name} low-stock alert updated.`);
    } catch (error) {
      setError(getErrorMessage(error, "Could not update the low-stock alert."));
    } finally {
      setUpdatingItemId("");
    }
  };

  // ======================================
  // TOGGLE STOCK TRACKING
  // ======================================

  const handleToggleTracking = async (item) => {
    try {
      setUpdatingItemId(item._id);

      setError("");
      setSuccess("");

      const newTrackingValue = !item.track_stock;

      console.log("Changing stock tracking:", {
        id: item._id,

        current: item.track_stock,

        newValue: newTrackingValue,

        stock: item.stock_quantity,

        threshold: item.low_stock_threshold,
      });

      const data = await updateMenuItemStock(item._id, {
        track_stock: newTrackingValue,

        stock_quantity: Number(item.stock_quantity || 0),

        low_stock_threshold: Number(item.low_stock_threshold ?? 5),
      });

      console.log("Tracking response:", data);

      replaceMenuItem(getUpdatedItem(data));

      setSuccess(
        newTrackingValue
          ? `Inventory tracking enabled for ${item.name}.`
          : `Inventory tracking disabled for ${item.name}.`,
      );
    } catch (error) {
      setError(getErrorMessage(error, "Could not change inventory tracking."));
    } finally {
      setUpdatingItemId("");
    }
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-inventory-layout">
      {/* ======================================
          RESTAURANT NAVBAR
      ====================================== */}

      <RestaurantNavbar />

      {/* ======================================
          MAIN PAGE
      ====================================== */}

      <main className="restaurant-inventory-page">
        <div className="restaurant-inventory-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="restaurant-inventory-back"
            onClick={() => navigate("/restaurant")}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="restaurant-inventory-header">
            <div>
              <span className="restaurant-inventory-eyebrow">
                <Boxes size={16} />
                Stock Management
              </span>

              <h1>Inventory Manager</h1>

              <p>
                Manage the number of food items available for customers to
                order.
              </p>
            </div>

            {selectedRestaurant && (
              <div className="restaurant-inventory-header-count">
                <strong>{restaurantItems.length}</strong>

                <span>
                  {restaurantItems.length === 1 ? "Menu Item" : "Menu Items"}
                </span>
              </div>
            )}
          </section>

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <div className="restaurant-inventory-message">
              <span>Loading inventory...</span>
            </div>
          )}

          {/* ======================================
              ERROR
          ====================================== */}

          {error && (
            <div className="restaurant-inventory-message restaurant-inventory-message--error">
              <AlertTriangle size={18} />

              <span>{error}</span>
            </div>
          )}

          {/* ======================================
              SUCCESS
          ====================================== */}

          {success && (
            <div className="restaurant-inventory-message restaurant-inventory-message--success">
              <CheckCircle2 size={18} />

              <span>{success}</span>
            </div>
          )}

          {/* ======================================
              CONTENT
          ====================================== */}

          {!loading && (
            <>
              {/* ======================================
                  TOOLBAR
              ====================================== */}

              <section className="restaurant-inventory-toolbar">
                {/* RESTAURANT */}

                <div className="restaurant-inventory-restaurant-selector">
                  <label htmlFor="inventory-restaurant">Restaurant</label>

                  <select
                    id="inventory-restaurant"
                    value={selectedRestaurantId}
                    onChange={(event) => {
                      setSelectedRestaurantId(event.target.value);

                      setError("");
                      setSuccess("");
                    }}
                  >
                    {restaurants.length === 0 && (
                      <option value="">No restaurants available</option>
                    )}

                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SEARCH */}

                <div className="restaurant-inventory-search">
                  <Search size={18} />

                  <input
                    type="search"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                {/* FILTER */}

                <div className="restaurant-inventory-filter">
                  <label htmlFor="stock-filter">Stock Status</label>

                  <select
                    id="stock-filter"
                    value={stockFilter}
                    onChange={(event) => setStockFilter(event.target.value)}
                  >
                    <option value="all">All items</option>

                    <option value="good">In stock</option>

                    <option value="low">Low stock</option>

                    <option value="out">Out of stock</option>

                    <option value="not-tracked">Not tracked</option>
                  </select>
                </div>
              </section>

              {/* ======================================
                  NO RESTAURANT
              ====================================== */}

              {restaurants.length === 0 && (
                <section className="restaurant-inventory-empty">
                  <Store size={34} />

                  <h2>No restaurant found</h2>

                  <p>Create a restaurant before managing inventory.</p>

                  <button
                    type="button"
                    onClick={() => navigate("/restaurant/profile")}
                  >
                    Add Restaurant
                  </button>
                </section>
              )}

              {/* ======================================
                  SELECTED RESTAURANT INVENTORY
              ====================================== */}

              {selectedRestaurant && (
                <>
                  {/* ======================================
                      STATS
                  ====================================== */}

                  <section className="restaurant-inventory-stats">
                    <article className="restaurant-inventory-stat">
                      <div className="restaurant-inventory-stat-icon">
                        <Package size={23} />
                      </div>

                      <span>Menu Items</span>

                      <strong>{restaurantItems.length}</strong>
                    </article>

                    <article className="restaurant-inventory-stat">
                      <div className="restaurant-inventory-stat-icon">
                        <Boxes size={23} />
                      </div>

                      <span>Total Units</span>

                      <strong>{totalUnits}</strong>
                    </article>

                    <article className="restaurant-inventory-stat restaurant-inventory-stat--warning">
                      <div className="restaurant-inventory-stat-icon">
                        <AlertTriangle size={23} />
                      </div>

                      <span>Low Stock</span>

                      <strong>{lowStockCount}</strong>
                    </article>

                    <article className="restaurant-inventory-stat restaurant-inventory-stat--danger">
                      <div className="restaurant-inventory-stat-icon">
                        <PackageX size={23} />
                      </div>

                      <span>Out of Stock</span>

                      <strong>{outOfStockCount}</strong>
                    </article>
                  </section>

                  {/* ======================================
                      LIST HEADING
                  ====================================== */}

                  <div className="restaurant-inventory-list-heading">
                    <div>
                      <h2>{selectedRestaurant.name} Inventory</h2>

                      <p>Increase, decrease or set exact stock quantities.</p>
                    </div>

                    <span>{visibleItems.length} shown</span>
                  </div>

                  {/* ======================================
                      EMPTY MENU
                  ====================================== */}

                  {restaurantItems.length === 0 && (
                    <section className="restaurant-inventory-empty">
                      <Utensils size={34} />

                      <h2>No menu items yet</h2>

                      <p>Add menu items before managing their stock.</p>

                      <button
                        type="button"
                        onClick={() => navigate("/restaurant/menu")}
                      >
                        Manage Menu
                      </button>
                    </section>
                  )}

                  {/* ======================================
                      NO FILTER RESULTS
                  ====================================== */}

                  {restaurantItems.length > 0 && visibleItems.length === 0 && (
                    <section className="restaurant-inventory-empty">
                      <Search size={32} />

                      <h2>No matching inventory</h2>

                      <p>Try another search or stock filter.</p>
                    </section>
                  )}

                  {/* ======================================
                      INVENTORY GRID
                  ====================================== */}

                  {visibleItems.length > 0 && (
                    <section className="restaurant-inventory-grid">
                      {visibleItems.map((item) => {
                        const status = getStockStatus(item);

                        const itemUpdating = updatingItemId === item._id;

                        return (
                          <article
                            key={item._id}
                            className="restaurant-inventory-card"
                          >
                            {/* IMAGE */}

                            <div className="restaurant-inventory-card-image">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} />
                              ) : (
                                <Package size={35} />
                              )}

                              <span className={status.className}>
                                {status.label}
                              </span>
                            </div>

                            {/* BODY */}

                            <div className="restaurant-inventory-card-body">
                              <span className="restaurant-inventory-category">
                                {item.category || "Menu Item"}
                              </span>

                              <h3>{item.name}</h3>

                              {/* ======================================
                                    TRACKING OFF
                                ====================================== */}

                              {!item.track_stock && (
                                <div className="restaurant-inventory-tracking-disabled">
                                  <Package size={20} />

                                  <div>
                                    <strong>Stock tracking is off</strong>

                                    <p>
                                      Enable it to manage this item's quantity.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={itemUpdating}
                                    onClick={() => handleToggleTracking(item)}
                                  >
                                    {itemUpdating ? "Enabling..." : "Enable"}
                                  </button>
                                </div>
                              )}

                              {/* ======================================
                                    TRACKING ON
                                ====================================== */}

                              {item.track_stock && (
                                <>
                                  {/* CURRENT STOCK */}

                                  <div className="restaurant-inventory-current-stock">
                                    <span>Current Stock</span>

                                    <strong>
                                      {Number(item.stock_quantity || 0)}
                                    </strong>

                                    <small>units</small>
                                  </div>

                                  {/* ======================================
                                        STOCK CONTROLS
                                    ====================================== */}

                                  <div className="restaurant-inventory-stock-controls">
                                    {/* MINUS */}

                                    <button
                                      type="button"
                                      className="restaurant-inventory-quantity-button"
                                      disabled={
                                        itemUpdating ||
                                        Number(item.stock_quantity || 0) <= 0
                                      }
                                      onClick={() => handleDecreaseStock(item)}
                                      aria-label={`Decrease ${item.name} stock`}
                                    >
                                      <Minus size={18} />
                                    </button>

                                    {/* EXACT QUANTITY */}

                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={stockDrafts[item._id] ?? "0"}
                                      disabled={itemUpdating}
                                      onChange={(event) =>
                                        setStockDrafts((current) => ({
                                          ...current,

                                          [item._id]: event.target.value,
                                        }))
                                      }
                                      onBlur={() => handleSaveStock(item)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();

                                          event.currentTarget.blur();
                                        }
                                      }}
                                    />

                                    {/* PLUS */}

                                    <button
                                      type="button"
                                      className="restaurant-inventory-quantity-button"
                                      disabled={itemUpdating}
                                      onClick={() => handleIncreaseStock(item)}
                                      aria-label={`Increase ${item.name} stock`}
                                    >
                                      <Plus size={18} />
                                    </button>
                                  </div>

                                  {/* ======================================
                                        LOW STOCK ALERT
                                    ====================================== */}

                                  <div className="restaurant-inventory-threshold">
                                    <label htmlFor={`threshold-${item._id}`}>
                                      Low stock alert
                                    </label>

                                    <div>
                                      <input
                                        id={`threshold-${item._id}`}
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={thresholdDrafts[item._id] ?? "5"}
                                        disabled={itemUpdating}
                                        onChange={(event) =>
                                          setThresholdDrafts((current) => ({
                                            ...current,

                                            [item._id]: event.target.value,
                                          }))
                                        }
                                        onBlur={() => handleSaveThreshold(item)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();

                                            event.currentTarget.blur();
                                          }
                                        }}
                                      />

                                      <span>units</span>
                                    </div>
                                  </div>

                                  {/* ======================================
                                        DISABLE TRACKING
                                    ====================================== */}

                                  <button
                                    type="button"
                                    className="restaurant-inventory-disable-tracking"
                                    disabled={itemUpdating}
                                    onClick={() => handleToggleTracking(item)}
                                  >
                                    {itemUpdating
                                      ? "Updating..."
                                      : "Disable stock tracking"}
                                  </button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default RestaurantInventoryPage;
