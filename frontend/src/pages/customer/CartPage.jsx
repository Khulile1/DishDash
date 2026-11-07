// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getMenuItems } from "../../services/menuItemService";
import { getDeliveryQuote } from "../../services/routingService";

import {
  getStoredCart,
  saveStoredCart,
} from "../../services/cartStorageService";

import "../../styles/CartPage.css";

// ======================================
// CART PAGE
// ======================================

function CartPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // CART STATE
  // ======================================

  const [cartItems, setCartItems] = useState(() => getStoredCart());

  // ======================================
  // STOCK STATE
  // ======================================

  const [checkingStock, setCheckingStock] = useState(true);
  const [stockError, setStockError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // ======================================
  // DELIVERY / PRICING QUOTE
  // ======================================

  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  // ======================================
  // SAVE CART
  // ======================================

  useEffect(() => {
    saveStoredCart(cartItems);
  }, [cartItems]);

  // ======================================
  // CHECK CURRENT BACKEND INVENTORY
  // ======================================

  const refreshCartInventory = async () => {
    if (cartItems.length === 0) {
      setCheckingStock(false);

      setStockError("");

      return [];
    }

    try {
      setCheckingStock(true);

      setStockError("");

      // ======================================
      // GET LATEST MENU ITEMS
      // ======================================

      const data = await getMenuItems();

      const menuItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.menuItems)
          ? data.menuItems
          : [];

      // ======================================
      // INDEX MENU ITEMS BY ID
      // ======================================

      const menuItemMap = new Map(
        menuItems.map((item) => [String(item._id), item]),
      );

      // ======================================
      // UPDATE CART WITH LATEST INVENTORY
      // ======================================

      const updatedCart = cartItems.map((cartItem) => {
        const latestItem = menuItemMap.get(String(cartItem._id));

        // ======================================
        // ITEM REMOVED FROM MENU
        // ======================================

        if (!latestItem) {
          return {
            ...cartItem,

            available: false,

            inventory_missing: true,
          };
        }

        return {
          ...cartItem,

          price: latestItem.price,

          available: latestItem.available,

          track_stock: latestItem.track_stock,

          stock_quantity: latestItem.stock_quantity,

          low_stock_threshold: latestItem.low_stock_threshold,

          inventory_missing: false,
        };
      });

      setCartItems(updatedCart);

      return updatedCart;
    } catch (error) {
      console.error("Failed to check cart stock:", error);

      setStockError(
        error.response?.data?.message ||
          "Could not confirm current stock levels.",
      );

      return null;
    } finally {
      setCheckingStock(false);
    }
  };

  // ======================================
  // CHECK INVENTORY WHEN PAGE OPENS
  // ======================================

  useEffect(() => {
    refreshCartInventory();
  }, []);

  // ======================================
  // CLEAR CART MESSAGE
  // ======================================

  useEffect(() => {
    if (!cartMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCartMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cartMessage]);

  // ======================================
  // BACK BUTTON
  // ======================================

  const handleBack = () => {
    navigate("/restaurants");
  };

  // ======================================
  // GET STOCK QUANTITY
  // ======================================

  const getAvailableStock = (item) => {
    if (!item.track_stock) {
      return null;
    }

    return Math.max(0, Number(item.stock_quantity || 0));
  };

  // ======================================
  // IS ITEM OUT OF STOCK
  // ======================================

  const isOutOfStock = (item) => {
    if (item.inventory_missing) {
      return true;
    }

    if (item.available === false) {
      return true;
    }

    if (item.track_stock && getAvailableStock(item) <= 0) {
      return true;
    }

    return false;
  };

  // ======================================
  // HAS CART EXCEEDED STOCK
  // ======================================

  const exceedsStock = (item) => {
    if (!item.track_stock) {
      return false;
    }

    return Number(item.quantity || 1) > getAvailableStock(item);
  };

  // ======================================
  // CAN INCREASE QUANTITY
  // ======================================

  const canIncreaseQuantity = (item) => {
    if (isOutOfStock(item)) {
      return false;
    }

    if (!item.track_stock) {
      return true;
    }

    return Number(item.quantity || 1) < getAvailableStock(item);
  };

  // ======================================
  // INCREASE QUANTITY
  // ======================================

  const increaseQuantity = (id) => {
    const item = cartItems.find((cartItem) => cartItem._id === id);

    if (!item) {
      return;
    }

    // ======================================
    // OUT OF STOCK
    // ======================================

    if (isOutOfStock(item)) {
      setCartMessage(`${item.name} is currently out of stock.`);

      return;
    }

    // ======================================
    // STOCK LIMIT
    // ======================================

    if (!canIncreaseQuantity(item)) {
      const stock = getAvailableStock(item);

      setCartMessage(
        `Only ${stock} ${
          stock === 1 ? "portion" : "portions"
        } of ${item.name} ${stock === 1 ? "is" : "are"} currently available.`,
      );

      return;
    }

    // ======================================
    // INCREASE
    // ======================================

    setCartItems((items) =>
      items.map((cartItem) =>
        cartItem._id === id
          ? {
              ...cartItem,

              quantity: (cartItem.quantity || 1) + 1,
            }
          : cartItem,
      ),
    );
  };

  // ======================================
  // DECREASE QUANTITY
  // ======================================

  const decreaseQuantity = (id) => {
    setCartMessage("");

    setCartItems((items) =>
      items.map((item) =>
        item._id === id && (item.quantity || 1) > 1
          ? {
              ...item,

              quantity: (item.quantity || 1) - 1,
            }
          : item,
      ),
    );
  };

  // ======================================
  // REMOVE ITEM
  // ======================================

  const removeItem = (id) => {
    setCartMessage("");

    setCartItems((items) => items.filter((item) => item._id !== id));
  };

  // ======================================
  // CART INVENTORY PROBLEMS
  // ======================================

  const invalidCartItems = cartItems.filter(
    (item) => isOutOfStock(item) || exceedsStock(item),
  );

  const hasStockProblems = invalidCartItems.length > 0;

  // ======================================
  // GET RESTAURANT ID FROM CART ITEM
  // ======================================

  const getCartItemRestaurantId = (item) => {
    const restaurantId = item?.restaurant_id;

    if (restaurantId && typeof restaurantId === "object") {
      return String(restaurantId._id || "");
    }

    return restaurantId ? String(restaurantId) : "";
  };

  // ======================================
  // UNIQUE RESTAURANTS IN CART
  // ======================================

  const restaurantIds = [
    ...new Set(
      cartItems.map((item) => getCartItemRestaurantId(item)).filter(Boolean),
    ),
  ];

  const restaurantIdsKey = restaurantIds.join("|");

  // ======================================
  // CURRENT LIMIT:
  // MAXIMUM 2 RESTAURANTS PER BUNDLE
  // ======================================

  const hasTooManyRestaurants = restaurantIds.length > 2;

  // ======================================
  // SUBTOTAL
  // ======================================

  const subtotal = cartItems.reduce((total, item) => {
    const price = Number(item.price || 0);

    const quantity = Number(item.quantity || 1);

    return total + price * quantity;
  }, 0);

  // ======================================
  // LOAD DELIVERY / SERVICE QUOTE
  // ======================================
  //
  // Cart page:
  //
  // Uses customer's default saved address.
  //
  // Checkout:
  //
  // Recalculates again using the actual
  // delivery address selected there.
  //
  // ======================================

  const loadDeliveryQuote = async () => {
    // ======================================
    // EMPTY CART
    // ======================================

    if (cartItems.length === 0) {
      setDeliveryQuote(null);

      setQuoteError("");

      return;
    }

    // ======================================
    // RESTAURANT INFORMATION MISSING
    // ======================================

    if (restaurantIds.length === 0) {
      setDeliveryQuote(null);

      setQuoteError("Restaurant information is missing from the cart.");

      return;
    }

    // ======================================
    // TOO MANY RESTAURANTS
    // ======================================

    if (hasTooManyRestaurants) {
      setDeliveryQuote(null);

      setQuoteError(
        "A bundled delivery can currently contain a maximum of 2 restaurants.",
      );

      return;
    }

    try {
      setQuoteLoading(true);

      setQuoteError("");

      // ======================================
      // BACKEND DELIVERY QUOTE
      // ======================================

      const quote = await getDeliveryQuote({
        restaurantIds,

        subtotal,
      });

      setDeliveryQuote(quote);
    } catch (error) {
      console.error("Could not calculate cart delivery quote:", error);

      setDeliveryQuote(null);

      setQuoteError(
        error.response?.data?.message ||
          "Delivery pricing will be calculated at checkout.",
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  // ======================================
  // REFRESH QUOTE WHEN CART CHANGES
  // ======================================

  useEffect(() => {
    loadDeliveryQuote();
  }, [restaurantIdsKey, subtotal]);

  // ======================================
  // PRICING FROM BACKEND
  // ======================================

  const pricing = deliveryQuote?.pricing || null;

  const deliveryFee = Number(pricing?.deliveryPrice || 0);

  const serviceFee = Number(pricing?.serviceFee || 0);

  const total = Number(pricing?.total ?? subtotal + deliveryFee + serviceFee);

  const pricingReady =
    Boolean(pricing) &&
    Number.isFinite(deliveryFee) &&
    Number.isFinite(serviceFee) &&
    Number.isFinite(total) &&
    !quoteLoading;

  // ======================================
  // TOTAL CART QUANTITY
  // ======================================

  const cartQuantity = cartItems.reduce((total, item) => {
    return total + (Number(item.quantity) || 1);
  }, 0);

  // ======================================
  // CHECKOUT
  // ======================================

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      return;
    }

    // ======================================
    // CHECK BUNDLE LIMIT
    // ======================================

    if (hasTooManyRestaurants) {
      setCartMessage(
        "A bundled delivery can currently contain a maximum of 2 restaurants.",
      );

      return;
    }

    // ======================================
    // CHECK BACKEND STOCK AGAIN
    // ======================================

    const refreshedCart = await refreshCartInventory();

    // If the backend could not confirm stock,
    // do not continue with stale inventory.
    if (!refreshedCart) {
      setCartMessage(
        "Could not confirm current stock levels. Please retry before checkout.",
      );

      return;
    }

    // ======================================
    // RECHECK REFRESHED CART
    // ======================================

    const hasInvalidItems = refreshedCart.some(
      (item) => isOutOfStock(item) || exceedsStock(item),
    );

    if (hasInvalidItems) {
      setCartMessage(
        "Please fix the stock issues in your cart before continuing to checkout.",
      );

      return;
    }

    navigate("/checkout");
  };

  // ======================================
  // STOCK MESSAGE
  // ======================================

  const getStockMessage = (item) => {
    if (item.inventory_missing) {
      return {
        type: "error",

        text: "This item is no longer on the restaurant menu.",
      };
    }

    if (isOutOfStock(item)) {
      return {
        type: "error",

        text: "Out of stock",
      };
    }

    if (!item.track_stock) {
      return null;
    }

    const stock = getAvailableStock(item);

    const quantity = Number(item.quantity || 1);

    if (quantity > stock) {
      return {
        type: "error",

        text: `Only ${stock} ${
          stock === 1 ? "portion is" : "portions are"
        } currently available.`,
      };
    }

    const threshold = Number(item.low_stock_threshold ?? 5);

    if (stock <= threshold) {
      return {
        type: "warning",

        text: `Only ${stock} left`,
      };
    }

    return {
      type: "normal",

      text: `${stock} available`,
    };
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="cart-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN PAGE
      ====================================== */}

      <main className="cart-page">
        <div className="cart-container">
          {/* ======================================
              BACK BUTTON
          ====================================== */}

          <button
            type="button"
            className="cart-back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />

            <span>Back to Restaurants</span>
          </button>

          {/* ======================================
              PAGE HEADER
          ====================================== */}

          <section className="cart-header mobile-page-header">
            <div className="cart-header-content">
              <span className="cart-eyebrow">
                <ShoppingCart size={16} />
                Your order
              </span>

              <h1>Your Cart</h1>

              <p>
                Review your order, adjust quantities and continue to checkout
                when you are ready.
              </p>
            </div>

            {cartItems.length > 0 && (
              <div className="cart-header-count">
                <strong>{cartQuantity}</strong>

                <span>{cartQuantity === 1 ? "Item" : "Items"}</span>
              </div>
            )}
          </section>

          {/* ======================================
              STOCK CHECK ERROR
          ====================================== */}

          {stockError && (
            <div className="cart-stock-message cart-stock-message--error">
              <AlertTriangle size={18} />

              <span>{stockError}</span>

              <button type="button" onClick={refreshCartInventory}>
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {/* ======================================
              CART MESSAGE
          ====================================== */}

          {cartMessage && (
            <div className="cart-stock-message cart-stock-message--warning">
              <AlertTriangle size={18} />

              <span>{cartMessage}</span>
            </div>
          )}

          {/* ======================================
              INVENTORY PROBLEM
          ====================================== */}

          {!checkingStock && hasStockProblems && (
            <div className="cart-inventory-warning">
              <AlertTriangle size={20} />

              <div>
                <strong>Your cart needs attention</strong>

                <p>
                  One or more items are unavailable or exceed the current
                  restaurant stock.
                </p>
              </div>
            </div>
          )}

          {/* ======================================
              TOO MANY RESTAURANTS
          ====================================== */}

          {hasTooManyRestaurants && (
            <div className="cart-inventory-warning">
              <AlertTriangle size={20} />

              <div>
                <strong>Too many restaurant pickups</strong>

                <p>
                  Bundled delivery currently supports items from a maximum of
                  two restaurants. Remove items from one restaurant before
                  continuing to checkout.
                </p>
              </div>
            </div>
          )}

          {/* ======================================
              EMPTY CART
          ====================================== */}

          {cartItems.length === 0 ? (
            <section className="cart-empty">
              <div className="cart-empty-icon">
                <ShoppingCart size={32} />
              </div>

              <h2>Your cart is empty</h2>

              <p>
                Add something delicious from one of our restaurants to get
                started.
              </p>

              <button
                type="button"
                className="cart-browse-button"
                onClick={() => navigate("/restaurants")}
              >
                <Store size={17} />
                Browse Restaurants
              </button>
            </section>
          ) : (
            <div className="cart-content-grid">
              {/* ======================================
                  CART ITEMS
              ====================================== */}

              <section className="cart-items-section">
                <div className="cart-section-heading">
                  <div>
                    <h2>Order Items</h2>

                    <p>Review and update the items in your cart.</p>
                  </div>

                  <span>
                    {cartQuantity} {cartQuantity === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* ======================================
                    ITEMS
                ====================================== */}

                <div className="cart-items-list">
                  {cartItems.map((item) => {
                    const quantity = item.quantity || 1;

                    const itemTotal = Number(item.price || 0) * quantity;

                    const stockMessage = getStockMessage(item);

                    const increaseDisabled = !canIncreaseQuantity(item);

                    return (
                      <article
                        className={`cart-item-card${
                          isOutOfStock(item) || exceedsStock(item)
                            ? " cart-item-card--stock-problem"
                            : ""
                        }`}
                        key={item._id}
                      >
                        {/* IMAGE */}

                        <div className="cart-item-image-wrapper">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="cart-item-image"
                            />
                          ) : (
                            <div className="cart-item-image-placeholder">
                              <ShoppingCart size={28} />
                            </div>
                          )}
                        </div>

                        {/* ITEM INFORMATION */}

                        <div className="cart-item-content">
                          <div className="cart-item-top">
                            <div>
                              {item.restaurant_name && (
                                <span className="cart-restaurant-name">
                                  {item.restaurant_name}
                                </span>
                              )}

                              <h3>{item.name}</h3>
                            </div>

                            <button
                              type="button"
                              className="cart-remove-icon"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => removeItem(item._id)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>

                          {item.description && (
                            <p className="cart-item-description">
                              {item.description}
                            </p>
                          )}

                          {/* PRICE */}

                          <p className="cart-unit-price">
                            R{Number(item.price || 0).toFixed(2)} each
                          </p>

                          {/* STOCK */}

                          {stockMessage && (
                            <div
                              className={`cart-item-stock cart-item-stock--${stockMessage.type}`}
                            >
                              <Package size={15} />

                              <span>{stockMessage.text}</span>
                            </div>
                          )}

                          {/* BOTTOM CONTROLS */}

                          <div className="cart-item-bottom">
                            {/* QUANTITY */}

                            <div className="cart-quantity-control">
                              <button
                                type="button"
                                aria-label={`Decrease ${item.name} quantity`}
                                onClick={() => decreaseQuantity(item._id)}
                                disabled={quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>

                              <span>{quantity}</span>

                              <button
                                type="button"
                                aria-label={`Increase ${item.name} quantity`}
                                onClick={() => increaseQuantity(item._id)}
                                disabled={increaseDisabled}
                                title={
                                  increaseDisabled && item.track_stock
                                    ? "Maximum available stock reached"
                                    : "Increase quantity"
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            {/* ITEM TOTAL */}

                            <div className="cart-item-total">
                              <span>Item Total</span>

                              <strong>R{itemTotal.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* ======================================
                  ORDER SUMMARY
              ====================================== */}

              <aside className="cart-summary-section">
                <div className="cart-summary-card">
                  <div className="cart-summary-header">
                    <div className="cart-summary-icon">
                      <ShoppingCart size={21} />
                    </div>

                    <div>
                      <h2>Order Summary</h2>

                      <p>Your current total</p>
                    </div>
                  </div>

                  {/* ======================================
                      SUBTOTAL
                  ====================================== */}

                  <div className="cart-summary-row">
                    <span>Subtotal</span>

                    <strong>R{subtotal.toFixed(2)}</strong>
                  </div>

                  {/* ======================================
                      DELIVERY FEE
                  ====================================== */}

                  <div className="cart-summary-row">
                    <span>Delivery Fee</span>

                    <strong>
                      {quoteLoading
                        ? "Calculating..."
                        : pricingReady
                          ? `R${deliveryFee.toFixed(2)}`
                          : "At checkout"}
                    </strong>
                  </div>

                  {/* ======================================
                      SERVICE FEE
                  ====================================== */}

                  <div className="cart-summary-row">
                    <span>
                      Service Fee
                      {pricing?.serviceFeePercentage
                        ? ` (${pricing.serviceFeePercentage}%)`
                        : ""}
                    </span>

                    <strong>
                      {quoteLoading
                        ? "Calculating..."
                        : pricingReady
                          ? `R${serviceFee.toFixed(2)}`
                          : "At checkout"}
                    </strong>
                  </div>

                  {/* ======================================
                      ROUTE
                  ====================================== */}

                  {pricingReady && deliveryQuote?.route && (
                    <div className="cart-summary-row">
                      <span>
                        {deliveryQuote.bundle
                          ? "Bundled delivery route"
                          : "Delivery route"}
                      </span>

                      <strong>
                        {Number(deliveryQuote.route.distanceKm || 0).toFixed(1)}{" "}
                        km
                      </strong>
                    </div>
                  )}

                  {/* ======================================
                      RESTAURANT PICKUPS
                  ====================================== */}

                  {restaurantIds.length > 1 && (
                    <div className="cart-summary-row">
                      <span>Restaurant pickups</span>

                      <strong>{restaurantIds.length}</strong>
                    </div>
                  )}

                  <div className="cart-summary-divider" />

                  {/* ======================================
                      TOTAL
                  ====================================== */}

                  <div className="cart-summary-total">
                    <span>{pricingReady ? "Estimated Total" : "Subtotal"}</span>

                    <strong>
                      R{(pricingReady ? total : subtotal).toFixed(2)}
                    </strong>
                  </div>

                  {/* ======================================
                      QUOTE MESSAGE
                  ====================================== */}

                  {quoteError && !hasTooManyRestaurants && (
                    <p className="cart-summary-note">{quoteError}</p>
                  )}

                  {/* ======================================
                      CHECKOUT BUTTON
                  ====================================== */}

                  <button
                    type="button"
                    className="cart-checkout-button"
                    onClick={handleCheckout}
                    disabled={
                      checkingStock || hasStockProblems || hasTooManyRestaurants
                    }
                  >
                    {checkingStock
                      ? "Checking Stock..."
                      : hasStockProblems
                        ? "Fix Cart Before Checkout"
                        : hasTooManyRestaurants
                          ? "Maximum 2 Restaurants"
                          : "Proceed to Checkout"}
                  </button>

                  <p className="cart-summary-note">
                    Delivery and service fees are estimated using your default
                    saved address and will be recalculated at checkout.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

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

export default CartPage;
