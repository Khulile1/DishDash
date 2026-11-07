// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Package,
  Plus,
  Store,
  Trash2,
  Utensils,
} from "lucide-react";

import {
  createMenuItem,
  getMyMenuItems,
  deleteMenuItem,
  updateMenuItem,
} from "../../services/menuItemService";

import { getMyRestaurants } from "../../services/restaurantService";

import RestaurantNavbar from "./RestaurantNavbar";

import "../../styles/RestaurantMenuPage.css";

// ======================================
// RESTAURANT MENU PAGE
// ======================================

function RestaurantMenuPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // RESTAURANT STATE
  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // ======================================
  // FORM STATE
  // ======================================

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");

  const [category, setCategory] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  // ======================================
  // INVENTORY FORM STATE
  // ======================================

  const [stockQuantity, setStockQuantity] = useState("");

  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // ======================================
  // MENU STATE
  // ======================================

  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loadingItems, setLoadingItems] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // LOAD LOGGED-IN OWNER'S RESTAURANTS
  // ======================================

  const loadRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      setError("");

      const data = await getMyRestaurants();

      console.log("My restaurants response:", data);

      const restaurantList = Array.isArray(data)
        ? data
        : Array.isArray(data?.restaurants)
          ? data.restaurants
          : [];

      setRestaurants(restaurantList);

      // ======================================
      // AUTO SELECT SINGLE RESTAURANT
      // ======================================

      if (restaurantList.length === 1) {
        setSelectedRestaurantId(restaurantList[0]._id);
      }
    } catch (error) {
      console.error("Failed to load my restaurants:", error);

      setError(
        error.response?.data?.message || "Failed to load your restaurants.",
      );
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // ======================================
  // LOAD SELECTED RESTAURANT MENU
  // ======================================

  const loadMenuItems = async (restaurantId) => {
    try {
      if (!restaurantId) {
        setMenuItems([]);
        setLoadingItems(false);
        return;
      }

      setLoadingItems(true);
      setError("");

      const data = await getMyMenuItems(restaurantId);

      console.log("My menu items response:", data);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.menuItems)
          ? data.menuItems
          : [];

      setMenuItems(items);
    } catch (error) {
      console.error("Failed to load menu items:", error);

      setMenuItems([]);

      setError(error.response?.data?.message || "Failed to load menu items.");
    } finally {
      setLoadingItems(false);
    }
  };

  // ======================================
  // LOAD RESTAURANTS WHEN PAGE OPENS
  // ======================================

  useEffect(() => {
    loadRestaurants();
  }, []);

  // ======================================
  // LOAD MENU WHEN RESTAURANT CHANGES
  // ======================================

  useEffect(() => {
    if (selectedRestaurantId) {
      loadMenuItems(selectedRestaurantId);
    } else {
      setMenuItems([]);
      setLoadingItems(false);
    }
  }, [selectedRestaurantId]);

  // ======================================
  // CREATE MENU ITEM
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ======================================
    // RESTAURANT VALIDATION
    // ======================================

    if (!selectedRestaurantId) {
      setError("Please select a restaurant.");

      return;
    }

    // ======================================
    // NAME VALIDATION
    // ======================================

    if (!name.trim()) {
      setError("Menu item name is required.");

      return;
    }

    // ======================================
    // CATEGORY VALIDATION
    // ======================================

    if (!category.trim()) {
      setError("Menu item category is required.");

      return;
    }

    // ======================================
    // DESCRIPTION VALIDATION
    // ======================================

    if (!description.trim()) {
      setError("Menu item description is required.");

      return;
    }

    // ======================================
    // PRICE VALIDATION
    // ======================================

    if (!price || Number(price) <= 0) {
      setError("Please enter a valid price.");

      return;
    }

    // ======================================
    // IMAGE VALIDATION
    // ======================================

    if (!imageUrl.trim()) {
      setError("Menu item image URL is required.");

      return;
    }

    // ======================================
    // STARTING STOCK VALIDATION
    // ======================================

    if (
      stockQuantity === "" ||
      !Number.isInteger(Number(stockQuantity)) ||
      Number(stockQuantity) < 0
    ) {
      setError("Starting stock must be a whole number of 0 or more.");

      return;
    }

    // ======================================
    // LOW STOCK THRESHOLD VALIDATION
    // ======================================

    if (
      lowStockThreshold === "" ||
      !Number.isInteger(Number(lowStockThreshold)) ||
      Number(lowStockThreshold) < 0
    ) {
      setError("Low stock alert must be a whole number of 0 or more.");

      return;
    }

    try {
      setLoading(true);

      // ======================================
      // BUILD MENU ITEM
      // ======================================

      const startingStock = Number(stockQuantity);

      const menuItemData = {
        restaurant_id: selectedRestaurantId,

        name: name.trim(),

        category: category.trim(),

        description: description.trim(),

        price: Number(price),

        image_url: imageUrl.trim(),

        // Inventory
        track_stock: true,

        stock_quantity: startingStock,

        low_stock_threshold: Number(lowStockThreshold),

        // Availability
        available: startingStock > 0,
      };

      console.log("Creating menu item:", menuItemData);

      // ======================================
      // CREATE
      // ======================================

      await createMenuItem(menuItemData);

      // ======================================
      // SUCCESS
      // ======================================

      setSuccess("Menu item added successfully.");

      // ======================================
      // RESET FORM
      // ======================================

      setName("");

      setCategory("");

      setDescription("");

      setPrice("");

      setImageUrl("");

      setStockQuantity("");

      setLowStockThreshold("5");

      // ======================================
      // RELOAD SELECTED RESTAURANT MENU
      // ======================================

      await loadMenuItems(selectedRestaurantId);
    } catch (error) {
      console.error("Create menu item error:", error);

      setError(error.response?.data?.message || "Failed to create menu item.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // DELETE MENU ITEM
  // ======================================

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}" from the menu?`);

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteMenuItem(item._id);

      setMenuItems((items) =>
        items.filter((menuItem) => menuItem._id !== item._id),
      );

      setSuccess(`${item.name} deleted successfully.`);
    } catch (error) {
      console.error("Delete menu item error:", error);

      setError(error.response?.data?.message || "Failed to delete menu item.");
    }
  };

  // ======================================
  // TOGGLE AVAILABILITY
  // ======================================

  const handleAvailability = async (item) => {
    try {
      setError("");
      setSuccess("");

      // ======================================
      // PREVENT ZERO STOCK ITEM
      // FROM BEING ENABLED
      // ======================================

      if (
        item.track_stock &&
        Number(item.stock_quantity || 0) <= 0 &&
        !item.available
      ) {
        setError(
          `${item.name} cannot be marked available because it has no stock.`,
        );

        return;
      }

      const newAvailability = !item.available;

      const data = await updateMenuItem(item._id, {
        available: newAvailability,
      });

      // ======================================
      // USE ACTUAL BACKEND RESPONSE
      // ======================================

      const updatedItem = data?.menuItem || data?.item || data;

      setMenuItems((items) =>
        items.map((menuItem) =>
          menuItem._id === item._id
            ? {
                ...menuItem,
                ...updatedItem,
              }
            : menuItem,
        ),
      );

      setSuccess(
        `${item.name} marked ${
          updatedItem.available ? "available" : "unavailable"
        }.`,
      );
    } catch (error) {
      console.error("Availability update error:", error);

      setError(
        error.response?.data?.message || "Failed to update availability.",
      );
    }
  };

  // ======================================
  // MENU ITEMS
  // ======================================

  // The backend already returns only the menu
  // for the selected restaurant.

  const filteredMenuItems = selectedRestaurantId ? menuItems : [];

  // ======================================
  // SELECTED RESTAURANT
  // ======================================

  const selectedRestaurant = restaurants.find(
    (restaurant) => String(restaurant._id) === String(selectedRestaurantId),
  );

  // ======================================
  // MENU COUNTS
  // ======================================

  const availableCount = filteredMenuItems.filter(
    (item) => item.available !== false,
  ).length;

  const unavailableCount = filteredMenuItems.length - availableCount;

  // ======================================
  // STOCK STATUS
  // ======================================

  const getStockStatus = (item) => {
    if (!item.track_stock) {
      return {
        label: "Stock not tracked",

        className:
          "restaurant-menu-stock-status restaurant-menu-stock-status--off",
      };
    }

    const quantity = Number(item.stock_quantity || 0);

    const threshold = Number(item.low_stock_threshold ?? 5);

    if (quantity <= 0) {
      return {
        label: "Out of stock",

        className:
          "restaurant-menu-stock-status restaurant-menu-stock-status--out",
      };
    }

    if (quantity <= threshold) {
      return {
        label: "Low stock",

        className:
          "restaurant-menu-stock-status restaurant-menu-stock-status--low",
      };
    }

    return {
      label: "In stock",

      className:
        "restaurant-menu-stock-status restaurant-menu-stock-status--good",
    };
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-menu-layout">
      {/* ======================================
          RESTAURANT NAVBAR
      ====================================== */}

      <RestaurantNavbar />

      {/* ======================================
          PAGE
      ====================================== */}

      <main className="restaurant-menu-page">
        <div className="restaurant-menu-container">
          {/* ======================================
              BACK BUTTON
          ====================================== */}

          <button
            type="button"
            className="restaurant-menu-back"
            onClick={() => navigate("/restaurant")}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          {/* ======================================
              PAGE HEADER
          ====================================== */}

          <section className="restaurant-menu-header">
            <div>
              <span className="restaurant-menu-eyebrow">
                <Utensils size={16} />
                Menu Management
              </span>

              <h1>Restaurant Menu</h1>

              <p>
                Add meals, set initial stock levels and keep your restaurant
                menu up to date.
              </p>
            </div>

            {selectedRestaurant && (
              <div className="restaurant-menu-header-count">
                <strong>{filteredMenuItems.length}</strong>

                <span>
                  {filteredMenuItems.length === 1 ? "Menu Item" : "Menu Items"}
                </span>
              </div>
            )}
          </section>

          {/* ======================================
              MESSAGES
          ====================================== */}

          {error && (
            <div className="restaurant-menu-message restaurant-menu-message--error">
              <AlertCircle size={18} />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="restaurant-menu-message restaurant-menu-message--success">
              <CheckCircle2 size={18} />

              <span>{success}</span>
            </div>
          )}

          {/* ======================================
              RESTAURANT SELECTOR
          ====================================== */}

          <section className="restaurant-menu-section">
            <div className="restaurant-menu-section-heading">
              <div className="restaurant-menu-section-icon">
                <Store size={21} />
              </div>

              <div>
                <h2>Select Restaurant</h2>

                <p>Choose the restaurant menu you want to manage.</p>
              </div>
            </div>

            <div className="restaurant-menu-selector">
              <label htmlFor="restaurant-menu-restaurant">Restaurant</label>

              <select
                id="restaurant-menu-restaurant"
                value={selectedRestaurantId}
                onChange={(event) => {
                  setSelectedRestaurantId(event.target.value);

                  setError("");
                  setSuccess("");
                }}
                disabled={loadingRestaurants}
              >
                <option value="">
                  {loadingRestaurants
                    ? "Loading restaurants..."
                    : "Select a restaurant"}
                </option>

                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>

              {selectedRestaurant && (
                <div className="restaurant-menu-selected">
                  <CheckCircle2 size={17} />

                  <span>
                    Managing <strong>{selectedRestaurant.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ======================================
              ADD MENU ITEM
          ====================================== */}

          <section className="restaurant-menu-section">
            <div className="restaurant-menu-section-heading">
              <div className="restaurant-menu-section-icon">
                <Plus size={22} />
              </div>

              <div>
                <h2>Add Menu Item</h2>

                <p>Add a new dish and its starting inventory.</p>
              </div>
            </div>

            {!selectedRestaurantId ? (
              <div className="restaurant-menu-notice">
                <Store size={24} />

                <div>
                  <strong>Select a restaurant first</strong>

                  <p>Choose a restaurant above before adding a menu item.</p>
                </div>
              </div>
            ) : (
              <form className="restaurant-menu-form" onSubmit={handleSubmit}>
                {/* RESTAURANT */}

                <div className="restaurant-menu-field restaurant-menu-field--full">
                  <label>Restaurant</label>

                  <input
                    type="text"
                    value={selectedRestaurant?.name || ""}
                    disabled
                  />
                </div>

                {/* NAME */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-name">Item Name</label>

                  <input
                    id="restaurant-menu-name"
                    type="text"
                    placeholder="Example: Chicken Burger"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>

                {/* CATEGORY */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-category">Category</label>

                  <input
                    id="restaurant-menu-category"
                    type="text"
                    placeholder="Example: Burgers"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                  />
                </div>

                {/* PRICE */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-price">Price</label>

                  <div className="restaurant-menu-price-input">
                    <span>R</span>

                    <input
                      id="restaurant-menu-price"
                      type="number"
                      placeholder="89.99"
                      value={price}
                      min="0"
                      step="0.01"
                      onChange={(event) => setPrice(event.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* IMAGE */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-image">Image URL</label>

                  <input
                    id="restaurant-menu-image"
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    required
                  />
                </div>

                {/* STARTING STOCK */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-stock">Starting Stock</label>

                  <input
                    id="restaurant-menu-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Example: 20"
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    required
                  />

                  <small className="restaurant-menu-field-help">
                    Number of portions currently available to sell.
                  </small>
                </div>

                {/* LOW STOCK */}

                <div className="restaurant-menu-field">
                  <label htmlFor="restaurant-menu-low-stock">
                    Low Stock Alert
                  </label>

                  <input
                    id="restaurant-menu-low-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="5"
                    value={lowStockThreshold}
                    onChange={(event) =>
                      setLowStockThreshold(event.target.value)
                    }
                    required
                  />

                  <small className="restaurant-menu-field-help">
                    The item will show as low stock when it reaches this
                    quantity.
                  </small>
                </div>

                {/* DESCRIPTION */}

                <div className="restaurant-menu-field restaurant-menu-field--full">
                  <label htmlFor="restaurant-menu-description">
                    Description
                  </label>

                  <textarea
                    id="restaurant-menu-description"
                    placeholder="Describe the food..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* IMAGE PREVIEW */}

                {imageUrl.trim() && (
                  <div className="restaurant-menu-image-preview restaurant-menu-field--full">
                    <span>Image Preview</span>

                    <div>
                      <img
                        src={imageUrl}
                        alt="Menu item preview"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SUBMIT */}

                <div className="restaurant-menu-form-actions restaurant-menu-field--full">
                  <button
                    type="submit"
                    className="restaurant-menu-add-button"
                    disabled={loading}
                  >
                    <Plus size={17} />

                    {loading ? "Adding..." : "Add Menu Item"}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ======================================
              MENU OVERVIEW
          ====================================== */}

          <section className="restaurant-menu-list-section">
            <div className="restaurant-menu-list-header">
              <div>
                <span className="restaurant-menu-eyebrow">
                  <Utensils size={15} />
                  Current Menu
                </span>

                <h2>
                  {selectedRestaurant
                    ? `${selectedRestaurant.name} Menu`
                    : "Your Menu"}
                </h2>

                {selectedRestaurant && (
                  <p>
                    {availableCount} available
                    {" · "}
                    {unavailableCount} unavailable
                  </p>
                )}
              </div>
            </div>

            {/* NO RESTAURANT */}

            {!selectedRestaurantId && (
              <div className="restaurant-menu-empty">
                <div className="restaurant-menu-empty-icon">
                  <Store size={28} />
                </div>

                <h3>Select a restaurant</h3>

                <p>Select a restaurant above to view and manage its menu.</p>
              </div>
            )}

            {/* LOADING */}

            {selectedRestaurantId && loadingItems && (
              <div className="restaurant-menu-empty">
                <div className="restaurant-menu-loader" />

                <h3>Loading menu</h3>

                <p>Getting your menu items.</p>
              </div>
            )}

            {/* EMPTY MENU */}

            {selectedRestaurantId &&
              !loadingItems &&
              filteredMenuItems.length === 0 && (
                <div className="restaurant-menu-empty">
                  <div className="restaurant-menu-empty-icon">
                    <Utensils size={28} />
                  </div>

                  <h3>No menu items yet</h3>

                  <p>Add your first menu item using the form above.</p>
                </div>
              )}

            {/* MENU GRID */}

            {selectedRestaurantId &&
              !loadingItems &&
              filteredMenuItems.length > 0 && (
                <div className="restaurant-menu-grid">
                  {filteredMenuItems.map((item) => {
                    const stockStatus = getStockStatus(item);

                    return (
                      <article className="restaurant-menu-card" key={item._id}>
                        {/* IMAGE */}

                        <div className="restaurant-menu-card-image-wrapper">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="restaurant-menu-card-image"
                            />
                          ) : (
                            <div className="restaurant-menu-card-placeholder">
                              <ImageIcon size={30} />

                              <span>No image</span>
                            </div>
                          )}

                          <span
                            className={
                              item.available
                                ? "restaurant-menu-status restaurant-menu-status--available"
                                : "restaurant-menu-status restaurant-menu-status--unavailable"
                            }
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        {/* CONTENT */}

                        <div className="restaurant-menu-card-content">
                          <span className="restaurant-menu-category">
                            {item.category || "Other"}
                          </span>

                          <div className="restaurant-menu-card-title">
                            <h3>{item.name}</h3>

                            <strong>R{Number(item.price).toFixed(2)}</strong>
                          </div>

                          <p className="restaurant-menu-description">
                            {item.description || "No description provided."}
                          </p>

                          {/* STOCK */}

                          <div className="restaurant-menu-stock-info">
                            <div className="restaurant-menu-stock-quantity">
                              <Package size={17} />

                              <span>Stock</span>

                              <strong>
                                {item.track_stock
                                  ? Number(item.stock_quantity || 0)
                                  : "—"}
                              </strong>
                            </div>

                            <span className={stockStatus.className}>
                              {stockStatus.label}
                            </span>
                          </div>

                          {/* ACTIONS */}

                          <div className="restaurant-menu-card-actions">
                            <button
                              type="button"
                              className={
                                item.available
                                  ? "restaurant-menu-availability-button restaurant-menu-availability-button--hide"
                                  : "restaurant-menu-availability-button"
                              }
                              onClick={() => handleAvailability(item)}
                            >
                              {item.available ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}

                              {item.available
                                ? "Mark Unavailable"
                                : "Mark Available"}
                            </button>

                            <button
                              type="button"
                              className="restaurant-menu-delete-button"
                              aria-label={`Delete ${item.name}`}
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default RestaurantMenuPage;
