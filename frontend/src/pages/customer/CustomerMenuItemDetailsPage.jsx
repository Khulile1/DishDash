// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Utensils,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import CartCard from "../../components/cards/CartCard";

import { getMenuItems } from "../../services/menuItemService";

import { getRestaurants } from "../../services/restaurantService";

import useCart from "../../hooks/useCart";

import "../../styles/CustomerMenuItemDetailsPage.css";

// ======================================
// CUSTOMER MENU ITEM DETAILS PAGE
// ======================================

function CustomerMenuItemDetailsPage() {
  // ======================================
  // ROUTER
  // ======================================

  const { menuItemId } = useParams();

  const navigate = useNavigate();

  // ======================================
  // SHARED CART
  // ======================================
  //
  // IMPORTANT:
  //
  // This is now the SAME cart used by:
  //
  // Restaurant pages
  // CartCard
  // CartPage
  // Checkout
  //
  // It no longer reads/writes:
  //
  // localStorage["cart"]
  //
  // directly.
  // ======================================

  const { cart, setCart, removeOne, removeItem } = useCart();

  // ======================================
  // PAGE STATE
  // ======================================

  const [menuItem, setMenuItem] = useState(null);

  const [restaurant, setRestaurant] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // CART PREVIEW
  // ======================================

  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);

  // ======================================
  // GET MENU ITEM RESTAURANT ID
  // ======================================

  const getMenuItemRestaurantId = (item) => {
    if (!item) {
      return "";
    }

    if (item.restaurant_id && typeof item.restaurant_id === "object") {
      return String(item.restaurant_id._id || "");
    }

    return String(item.restaurant_id || "");
  };

  // ======================================
  // GET RESTAURANT NAME FOR CART ITEM
  // ======================================

  const getCartRestaurantName = (item) => {
    if (!item) {
      return "";
    }

    // Current page restaurant

    if (
      restaurant &&
      String(restaurant._id) === getMenuItemRestaurantId(item)
    ) {
      return restaurant.name || "";
    }

    // Already available on item

    return item.restaurant_name || item.restaurant?.name || "";
  };

  // ======================================
  // LOAD ITEM DETAILS
  // ======================================

  const loadItemDetails = async () => {
    try {
      setLoading(true);

      setError("");

      const [menuData, restaurantData] = await Promise.all([
        getMenuItems(),
        getRestaurants(),
      ]);

      // ======================================
      // MENU ITEMS
      // ======================================

      const menuList = Array.isArray(menuData)
        ? menuData
        : Array.isArray(menuData?.menuItems)
          ? menuData.menuItems
          : [];

      // ======================================
      // RESTAURANTS
      // ======================================

      const restaurantList = Array.isArray(restaurantData)
        ? restaurantData
        : Array.isArray(restaurantData?.restaurants)
          ? restaurantData.restaurants
          : [];

      // ======================================
      // FIND ITEM
      // ======================================

      const selectedItem = menuList.find(
        (item) => String(item._id) === String(menuItemId),
      );

      if (!selectedItem) {
        setMenuItem(null);

        setRestaurant(null);

        setError("This menu item could not be found.");

        return;
      }

      setMenuItem(selectedItem);

      // ======================================
      // FIND RESTAURANT
      // ======================================

      const restaurantId = getMenuItemRestaurantId(selectedItem);

      const selectedRestaurant = restaurantList.find(
        (item) => String(item._id) === String(restaurantId),
      );

      setRestaurant(selectedRestaurant || null);
    } catch (error) {
      console.error("Failed to load menu item:", error);

      setError(
        error.response?.data?.message ||
          "Could not load this menu item. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    if (menuItemId) {
      loadItemDetails();
    }
  }, [menuItemId]);

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
  // CURRENT ITEM IN CART
  // ======================================

  const cartItem = useMemo(() => {
    if (!menuItem) {
      return null;
    }

    return (
      cart.find((item) => String(item._id) === String(menuItem._id)) || null
    );
  }, [cart, menuItem]);

  // ======================================
  // CURRENT ITEM QUANTITY
  // ======================================

  const cartItemQuantity = Number(cartItem?.quantity || 0);

  // ======================================
  // TOTAL CART QUANTITY
  // ======================================

  const totalCartQuantity = cart.reduce(
    (total, item) =>
      total +
      Math.max(
        1,

        Number(item.quantity || 1),
      ),

    0,
  );

  // ======================================
  // STOCK HELPERS
  // ======================================

  const tracksStock = menuItem?.track_stock === true;

  const availableStock = tracksStock
    ? Math.max(
        0,

        Number(menuItem?.stock_quantity || 0),
      )
    : null;

  const isUnavailable = menuItem?.available === false;

  const isOutOfStock = tracksStock && availableStock <= 0;

  const stockLimitReached =
    tracksStock &&
    availableStock !== null &&
    cartItemQuantity >= availableStock;

  const canAddToCart =
    Boolean(menuItem) && !isUnavailable && !isOutOfStock && !stockLimitReached;

  // ======================================
  // ADD CURRENT ITEM TO CART
  // ======================================

  const handleAddToCart = () => {
    if (!menuItem) {
      return;
    }

    setError("");

    setSuccess("");

    // ======================================
    // UNAVAILABLE
    // ======================================

    if (isUnavailable) {
      setError(`${menuItem.name} is currently unavailable.`);

      return;
    }

    // ======================================
    // OUT OF STOCK
    // ======================================

    if (isOutOfStock) {
      setError(`${menuItem.name} is out of stock.`);

      return;
    }

    // ======================================
    // MAXIMUM STOCK
    // ======================================

    if (stockLimitReached) {
      setError(
        `You already have the maximum available quantity of ${menuItem.name} in your cart.`,
      );

      return;
    }

    const restaurantId = getMenuItemRestaurantId(menuItem);

    // ======================================
    // NORMALISED CART ITEM
    // ======================================

    const itemForCart = {
      ...menuItem,

      restaurant_id: restaurantId,

      restaurant_name: restaurant?.name || menuItem?.restaurant_name || "",
    };

    // ======================================
    // UPDATE SHARED CART
    // ======================================

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => String(item._id) === String(menuItem._id),
      );

      // ======================================
      // ALREADY IN CART
      // ======================================

      if (existingItem) {
        return currentCart.map((item) =>
          String(item._id) === String(menuItem._id)
            ? {
                ...item,

                ...itemForCart,

                quantity: Number(item.quantity || 1) + 1,
              }
            : item,
        );
      }

      // ======================================
      // NEW ITEM
      // ======================================

      return [
        ...currentCart,

        {
          ...itemForCart,

          quantity: 1,
        },
      ];
    });

    setSuccess(`${menuItem.name} added to cart.`);
  };

  // ======================================
  // ADD ITEM FROM CART CARD
  // ======================================
  //
  // CartCard might contain items from
  // another restaurant, so this function
  // checks the item's own stock information.
  // ======================================

  const handleCartCardAdd = (item) => {
    if (!item?._id) {
      return;
    }

    setError("");

    // ======================================
    // AVAILABILITY
    // ======================================

    if (item.available === false) {
      setError(`${item.name} is currently unavailable.`);

      return;
    }

    // ======================================
    // STOCK
    // ======================================

    const itemTracksStock = item.track_stock === true;

    const stock = itemTracksStock
      ? Math.max(
          0,

          Number(item.stock_quantity || 0),
        )
      : null;

    const existing = cart.find(
      (cartItem) => String(cartItem._id) === String(item._id),
    );

    const existingQuantity = Number(existing?.quantity || 0);

    if (itemTracksStock && stock <= 0) {
      setError(`${item.name} is out of stock.`);

      return;
    }

    if (itemTracksStock && existingQuantity >= stock) {
      setError(
        `Only ${stock} ${
          stock === 1 ? "portion" : "portions"
        } of ${item.name} ${stock === 1 ? "is" : "are"} currently available.`,
      );

      return;
    }

    // ======================================
    // ADD
    // ======================================

    setCart((currentCart) => {
      const found = currentCart.find(
        (cartItem) => String(cartItem._id) === String(item._id),
      );

      if (found) {
        return currentCart.map((cartItem) =>
          String(cartItem._id) === String(item._id)
            ? {
                ...cartItem,

                quantity: Number(cartItem.quantity || 1) + 1,
              }
            : cartItem,
        );
      }

      return [
        ...currentCart,

        {
          ...item,

          quantity: 1,
        },
      ];
    });
  };

  // ======================================
  // REMOVE ONE FROM CART CARD
  // ======================================

  const handleCartCardRemove = (item) => {
    removeOne(item);
  };

  // ======================================
  // REMOVE COMPLETELY FROM CART CARD
  // ======================================

  const handleCartCardRemoveCompletely = (item) => {
    removeItem(item);
  };

  // ======================================
  // OPEN CART PREVIEW
  // ======================================

  const handleViewCart = () => {
    setCartPreviewOpen(true);
  };

  // ======================================
  // CONTINUE TO FULL CART PAGE
  // ======================================

  const handleContinueToCart = () => {
    setCartPreviewOpen(false);

    navigate("/cart");
  };

  // ======================================
  // VISIT ITEM FROM CART CARD
  // ======================================

  const handleVisitCartItem = (item) => {
    if (!item?._id) {
      return;
    }

    setCartPreviewOpen(false);

    navigate(`/menu-items/${item._id}`);
  };

  // ======================================
  // GO BACK
  // ======================================

  const handleBack = () => {
    const restaurantId = getMenuItemRestaurantId(menuItem);

    if (restaurantId) {
      navigate(`/restaurants/${restaurantId}`);

      return;
    }

    navigate("/menu");
  };

  // ======================================
  // PRICE
  // ======================================

  const formattedPrice = Number(menuItem?.price || 0).toFixed(2);

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="menu-item-details-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN PAGE
      ====================================== */}

      <main className="menu-item-details-page">
        <div className="menu-item-details-container">
          {/* ======================================
              BACK BUTTON
          ====================================== */}

          <button
            type="button"
            className="menu-item-details-back"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />

            <span>
              {restaurant?.name ? `Back to ${restaurant.name}` : "Back to Menu"}
            </span>
          </button>

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <section className="menu-item-details-state">
              <div className="menu-item-details-loader" />

              <h1>Loading item</h1>

              <p>Getting the latest menu item information.</p>
            </section>
          )}

          {/* ======================================
              ERROR / NOT FOUND
          ====================================== */}

          {!loading && error && !menuItem && (
            <section className="menu-item-details-state menu-item-details-state--error">
              <div className="menu-item-details-state-icon">
                <Utensils size={28} />
              </div>

              <h1>Item unavailable</h1>

              <p>{error}</p>

              <div className="menu-item-details-state-actions">
                <button
                  type="button"
                  className="menu-item-details-retry"
                  onClick={loadItemDetails}
                >
                  <RefreshCw size={17} />
                  Try Again
                </button>

                <button
                  type="button"
                  className="menu-item-details-secondary"
                  onClick={() => navigate("/menu")}
                >
                  Browse Menu
                </button>
              </div>
            </section>
          )}

          {/* ======================================
              ITEM DETAILS
          ====================================== */}

          {!loading && menuItem && (
            <>
              <section className="menu-item-details-card">
                {/* ======================================
                      IMAGE
                  ====================================== */}

                <div className="menu-item-details-image-panel">
                  {menuItem.image_url ? (
                    <img
                      src={menuItem.image_url}
                      alt={menuItem.name}
                      className="menu-item-details-image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="menu-item-details-image-placeholder">
                      <Utensils size={46} />

                      <span>No image available</span>
                    </div>
                  )}
                </div>

                {/* ======================================
                      CONTENT
                  ====================================== */}

                <div className="menu-item-details-content">
                  <div className="menu-item-details-heading">
                    <span className="menu-item-details-category">
                      {menuItem.category || "Menu Item"}
                    </span>

                    <h1>{menuItem.name}</h1>

                    {restaurant?.name && (
                      <button
                        type="button"
                        className="menu-item-details-restaurant-link"
                        onClick={() =>
                          navigate(`/restaurants/${restaurant._id}`)
                        }
                      >
                        <Store size={16} />

                        <span>{restaurant.name}</span>
                      </button>
                    )}
                  </div>

                  {/* ======================================
                        PRICE
                    ====================================== */}

                  <strong className="menu-item-details-price">
                    R{formattedPrice}
                  </strong>

                  {/* ======================================
                        DESCRIPTION
                    ====================================== */}

                  <p className="menu-item-details-description">
                    {menuItem.description ||
                      "A delicious option from this restaurant."}
                  </p>

                  {/* ======================================
                        ITEM / ORDER INFORMATION
                    ====================================== */}

                  <div className="menu-item-details-facts">
                    {/* RESTAURANT */}

                    <div className="menu-item-details-fact menu-item-details-fact--wide">
                      <span className="menu-item-details-fact-icon">
                        <Store size={18} />
                      </span>

                      <div>
                        <span>Restaurant</span>

                        <strong>
                          {restaurant?.name ||
                            menuItem?.restaurant_name ||
                            "Dish Dash restaurant"}
                        </strong>
                      </div>
                    </div>

                    {/* CATEGORY */}

                    <div className="menu-item-details-fact">
                      <span className="menu-item-details-fact-icon">
                        <Utensils size={18} />
                      </span>

                      <div>
                        <span>Category</span>

                        <strong>{menuItem.category || "Menu Item"}</strong>
                      </div>
                    </div>

                    {/* CART */}

                    <div className="menu-item-details-fact">
                      <span className="menu-item-details-fact-icon">
                        <ShoppingCart size={18} />
                      </span>

                      <div>
                        <span>Cart</span>

                        <strong>
                          {cartItemQuantity > 0
                            ? `${cartItemQuantity} ${
                                cartItemQuantity === 1 ? "item" : "items"
                              } in cart`
                            : "Not in cart yet"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ======================================
                        NOTE
                    ====================================== */}

                  <div className="menu-item-details-order-note">
                    Add this item to your cart, then continue browsing or view
                    your cart when you are ready.
                  </div>

                  {/* ======================================
                        ERROR MESSAGE
                    ====================================== */}

                  {error && (
                    <div className="menu-item-details-message menu-item-details-message--error">
                      {error}
                    </div>
                  )}

                  {/* ======================================
                        SUCCESS MESSAGE
                    ====================================== */}

                  {success && (
                    <div className="menu-item-details-message menu-item-details-message--success">
                      <CheckCircle2 size={18} />

                      <span>{success}</span>
                    </div>
                  )}

                  {/* ======================================
                        PRIMARY ACTIONS
                    ====================================== */}

                  <div className="menu-item-details-actions">
                    {/* ADD TO CART */}

                    <button
                      type="button"
                      className="menu-item-details-add-button"
                      disabled={!canAddToCart}
                      onClick={handleAddToCart}
                    >
                      {stockLimitReached ? (
                        <>
                          <CheckCircle2 size={18} />
                          Maximum in Cart
                        </>
                      ) : isOutOfStock || isUnavailable ? (
                        "Currently Unavailable"
                      ) : (
                        <>
                          <ShoppingCart size={18} />

                          {cartItemQuantity > 0
                            ? `Add Another (${cartItemQuantity})`
                            : "Add to Cart"}
                        </>
                      )}
                    </button>

                    {/* ======================================
                          VIEW CART PREVIEW
                      ====================================== */}

                    <button
                      type="button"
                      className="menu-item-details-cart-button"
                      onClick={handleViewCart}
                    >
                      <ShoppingCart size={18} />
                      View Cart
                      {totalCartQuantity > 0 && ` (${totalCartQuantity})`}
                    </button>
                  </div>

                  {/* ======================================
                        SMALL QUANTITY PREVIEW
                    ====================================== */}

                  {cartItemQuantity > 0 && (
                    <div className="menu-item-details-quantity-preview">
                      <span>In cart</span>

                      <div>
                        {/* DECREASE */}

                        <button
                          type="button"
                          aria-label="Decrease quantity in cart"
                          onClick={() => removeOne(menuItem)}
                        >
                          <Minus size={16} />
                        </button>

                        {/* QUANTITY */}

                        <strong>{cartItemQuantity}</strong>

                        {/* INCREASE */}

                        <button
                          type="button"
                          aria-label="Increase quantity in cart"
                          disabled={stockLimitReached}
                          onClick={handleAddToCart}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ======================================
          CART PREVIEW CARD
      ====================================== */}

      <CartCard
        isOpen={cartPreviewOpen}
        cartItems={cart}
        onClose={() => setCartPreviewOpen(false)}
        onContinueToCart={handleContinueToCart}
        onAddItem={handleCartCardAdd}
        onRemoveItem={handleCartCardRemove}
        onRemoveItemCompletely={handleCartCardRemoveCompletely}
        onVisitItem={handleVisitCartItem}
      />

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default CustomerMenuItemDetailsPage;
