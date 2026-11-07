import {
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";

import "../../styles/PreviewCards.css";
// ======================================
// RESTAURANT CARD
// ======================================

function RestaurantCard({
  isOpen,
  restaurant,
  menuItems = [],
  cartItems = [],
  onClose,
  onVisitRestaurant,
  onVisitItem,
  onViewCart,
  onGoToCart,
  onAddItem,
  onRemoveItem,
}) {
  // ======================================
  // DO NOT RENDER WHEN CLOSED
  // ======================================

  if (!isOpen || !restaurant) {
    return null;
  }

  // ======================================
  // MAXIMUM 5 MENU ITEMS
  // ======================================

  const limitedMenuItems = menuItems.slice(0, 5);

  // ======================================
  // FORMAT PRICE
  // ======================================

  const formatPrice = (price) => {
    const numericPrice = Number(price || 0);

    return `R${numericPrice.toFixed(2)}`;
  };

  // ======================================
  // FORMAT ADDRESS
  // ======================================

  const restaurantAddress =
    restaurant.formatted_address ||
    [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
    ]
      .filter(Boolean)
      .join(", ");

  // ======================================
  // GET CART ITEM
  // ======================================

  const getCartItem = (menuItem) => {
    return (
      cartItems.find((item) => String(item._id) === String(menuItem._id)) ||
      null
    );
  };

  // ======================================
  // GET QUANTITY
  // ======================================

  const getQuantity = (menuItem) => {
    const cartItem = getCartItem(menuItem);

    return Number(cartItem?.quantity || 0);
  };

  // ======================================
  // CHECK IF MORE CAN BE ADDED
  // ======================================

  const canAddMore = (menuItem) => {
    if (menuItem.available === false) {
      return false;
    }

    if (!menuItem.track_stock) {
      return true;
    }

    const stock = Math.max(0, Number(menuItem.stock_quantity || 0));

    const quantity = getQuantity(menuItem);

    return quantity < stock;
  };

  // ======================================
  // CART TOTAL QUANTITY
  // ======================================

  const cartQuantity = cartItems.reduce(
    (total, item) => total + Math.max(1, Number(item.quantity || 1)),
    0,
  );

  // ======================================
  // OPENING HOURS
  // ======================================

  const operatingHours =
    restaurant.opening_time && restaurant.closing_time
      ? `${restaurant.opening_time} – ${restaurant.closing_time}`
      : "";

  // ======================================
  // PREVENT OVERLAY CLOSE
  // ======================================

  const handleCardClick = (event) => {
    event.stopPropagation();
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="preview-card-overlay" onClick={onClose} role="presentation">
      <section
        className="preview-card"
        onClick={handleCardClick}
        role="dialog"
        aria-modal="true"
        aria-label={`${restaurant.name} preview`}
      >
        {/* ======================================
            HERO
        ====================================== */}

        <div className="preview-card-hero">
          {restaurant.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="preview-card-hero-image"
              decoding="async"
            />
          ) : (
            <div className="preview-card-hero-placeholder">
              <Store size={64} />
            </div>
          )}

          <div className="preview-card-hero-overlay" />

          {/* CLOSE */}

          <button
            type="button"
            className="preview-card-close-floating"
            onClick={onClose}
            aria-label="Close restaurant preview"
          >
            <X size={20} />
          </button>

          {/* HERO CONTENT */}

          <div className="preview-card-hero-content">
            <span className="preview-card-eyebrow preview-card-eyebrow--hero">
              <Store size={14} />
              Restaurant
            </span>

            <h2>{restaurant.name}</h2>

            {restaurant.description && <p>{restaurant.description}</p>}

            <div className="preview-card-hero-meta">
              {restaurantAddress && (
                <span>
                  <MapPin size={14} />
                  {restaurantAddress}
                </span>
              )}

              {operatingHours && (
                <span>
                  <Clock3 size={14} />
                  {operatingHours}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================
            BODY
        ====================================== */}

        <div className="preview-card-body">
          {/* ======================================
              SECTION HEADING
          ====================================== */}

          <div className="preview-card-section-heading">
            <div>
              <span>Popular dishes</span>

              <h3>Menu preview</h3>
            </div>

            <small>
              Showing {limitedMenuItems.length}{" "}
              {limitedMenuItems.length === 1 ? "item" : "items"}
            </small>
          </div>

          {/* ======================================
              EMPTY MENU
          ====================================== */}

          {limitedMenuItems.length === 0 && (
            <div className="preview-card-empty">
              <Store size={30} />

              <strong>No menu items available</strong>

              <span>
                This restaurant currently has no available menu items.
              </span>
            </div>
          )}

          {/* ======================================
              MENU ITEMS
          ====================================== */}

          {limitedMenuItems.length > 0 && (
            <div className="preview-card-item-grid">
              {limitedMenuItems.map((menuItem) => {
                const quantity = getQuantity(menuItem);

                const canAdd = canAddMore(menuItem);

                return (
                  <article key={menuItem._id} className="preview-card-item">
                    {/* ======================================
                        ITEM MAIN
                    ====================================== */}

                    <button
                      type="button"
                      className="preview-card-item-main"
                      onClick={() => onVisitItem?.(menuItem)}
                    >
                      {/* IMAGE */}

                      <div className="preview-card-item-image">
                        {menuItem.image_url ? (
                          <img
                            src={menuItem.image_url}
                            alt={menuItem.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Store size={28} />
                        )}
                      </div>

                      {/* TEXT */}

                      <div className="preview-card-item-copy">
                        <strong>{menuItem.name}</strong>

                        <span>{formatPrice(menuItem.price)}</span>
                      </div>
                    </button>

                    {/* ======================================
                        QUANTITY CONTROLS
                    ====================================== */}

                    <div className="preview-card-item-controls">
                      {/* REMOVE */}

                      <button
                        type="button"
                        className="preview-card-quantity-button"
                        onClick={() => onRemoveItem?.(menuItem)}
                        disabled={quantity <= 0}
                        aria-label={`Remove ${menuItem.name}`}
                      >
                        <Minus size={16} />
                      </button>

                      {/* QUANTITY */}

                      <span className="preview-card-item-quantity">
                        {quantity}
                      </span>

                      {/* ADD */}

                      <button
                        type="button"
                        className="preview-card-quantity-button preview-card-quantity-button--add"
                        onClick={() => onAddItem?.(menuItem)}
                        disabled={!canAdd}
                        aria-label={`Add ${menuItem.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================
            FOOTER
        ====================================== */}

        <footer className="preview-card-footer">
          {/* VIEW CART */}

          <button
            type="button"
            className="preview-card-button preview-card-button--secondary"
            onClick={onViewCart}
          >
            <ShoppingCart size={17} />

            <span>
              View Cart
              {cartQuantity > 0 ? ` (${cartQuantity})` : ""}
            </span>
          </button>

          {/* RESTAURANT PAGE */}

          <button
            type="button"
            className="preview-card-button preview-card-button--outline"
            onClick={() => onVisitRestaurant?.(restaurant)}
          >
            <Store size={17} />
            View Full Menu
          </button>

          {/* GO TO CART */}

          <button
            type="button"
            className="preview-card-button preview-card-button--primary"
            onClick={onGoToCart}
          >
            <ShoppingCart size={17} />
            Go to Cart
          </button>
        </footer>
      </section>
    </div>
  );
}

export default RestaurantCard;
