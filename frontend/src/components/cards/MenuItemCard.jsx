import { useEffect } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  Utensils,
  X,
} from "lucide-react";

import "../../styles/PreviewCards.css";

function MenuItemCard({
  isOpen,
  item,
  restaurant,
  restaurantItems = [],
  cartItems = [],
  onClose,
  onVisitItem,
  onVisitRelatedItem,
  onViewCart,
  onGoToCart,
  onAddItem,
  onRemoveItem,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const getCartQuantity = (itemId) => {
    const cartItem = cartItems.find(
      (cartItem) => String(cartItem._id) === String(itemId),
    );

    return Number(cartItem?.quantity || 0);
  };

  const canAddMore = (menuItem) => {
    if (!menuItem || menuItem.available === false) {
      return false;
    }

    if (!menuItem.track_stock) {
      return true;
    }

    const stock = Math.max(0, Number(menuItem.stock_quantity || 0));
    const quantity = getCartQuantity(menuItem._id);

    return quantity < stock;
  };

  // restaurantItems is already capped at 5 by Restaurants.jsx.
  // Remove the currently selected item so this card renders at most 4 related items.
  const relatedItems = restaurantItems.filter(
    (restaurantItem) => String(restaurantItem._id) !== String(item._id),
  );

  const selectedQuantity = getCartQuantity(item._id);
  const canAddSelected = canAddMore(item);

  return (
    <div
      className="preview-card-overlay preview-card-overlay--menu-item"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="preview-card preview-card--menu-item"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-card-title"
      >
        <div className="preview-card-hero">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="preview-card-hero-image"
              decoding="async"
            />
          ) : (
            <div className="preview-card-hero-placeholder">
              <Utensils size={44} />
            </div>
          )}

          <div className="preview-card-hero-overlay" />

          <button
            type="button"
            className="preview-card-close-floating"
            onClick={onClose}
            aria-label="Close item preview"
          >
            <X size={20} />
          </button>

          <div className="preview-card-hero-content">
            <span className="preview-card-eyebrow preview-card-eyebrow--hero">
              <Utensils size={15} />
              Item preview
            </span>

            <h2 id="menu-item-card-title">{item.name}</h2>

            <div className="preview-card-item-price-large">
              R{Number(item.price || 0).toFixed(2)}
            </div>

            {item.description && <p>{item.description}</p>}

            {restaurant?.name && (
              <span className="preview-card-restaurant-chip">
                <Store size={14} />
                {restaurant.name}
              </span>
            )}
          </div>
        </div>

        <div className="preview-card-selected-actions">
          <button
            type="button"
            className="preview-card-button preview-card-button--outline"
            onClick={() => onRemoveItem?.(item)}
            disabled={selectedQuantity <= 0}
          >
            <Minus size={17} />
            Remove
          </button>

          <span className="preview-card-selected-quantity">
            {selectedQuantity} in cart
          </span>

          <button
            type="button"
            className="preview-card-button preview-card-button--primary"
            onClick={() => onAddItem?.(item)}
            disabled={!canAddSelected}
          >
            <Plus size={17} />
            {canAddSelected ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>

        <div className="preview-card-body">
          <div className="preview-card-section-heading">
            <div>
              <span>Same restaurant</span>
              <h3>More you may like</h3>
            </div>

            <small>
              {relatedItems.length}{" "}
              {relatedItems.length === 1 ? "item" : "items"}
            </small>
          </div>

          {relatedItems.length === 0 ? (
            <div className="preview-card-empty">
              <Utensils size={30} />
              <strong>No other items to show</strong>
              <span>
                This is currently the only matching item from this restaurant.
              </span>
            </div>
          ) : (
            <div className="preview-card-item-grid">
              {relatedItems.map((relatedItem) => {
                const quantity = getCartQuantity(relatedItem._id);
                const canAdd = canAddMore(relatedItem);

                return (
                  <article key={relatedItem._id} className="preview-card-item">
                    <button
                      type="button"
                      className="preview-card-item-main"
                      onClick={() => onVisitRelatedItem?.(relatedItem)}
                      aria-label={`View ${relatedItem.name}`}
                    >
                      <div className="preview-card-item-image">
                        {relatedItem.image_url ? (
                          <img
                            src={relatedItem.image_url}
                            alt={relatedItem.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Utensils size={24} />
                        )}
                      </div>

                      <div className="preview-card-item-copy">
                        <strong>{relatedItem.name}</strong>
                        <span>
                          R{Number(relatedItem.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </button>

                    <div className="preview-card-item-controls">
                      <button
                        type="button"
                        className="preview-card-quantity-button"
                        onClick={() => onRemoveItem?.(relatedItem)}
                        disabled={quantity <= 0}
                        aria-label={`Remove one ${relatedItem.name}`}
                      >
                        <Minus size={15} />
                      </button>

                      <span className="preview-card-item-quantity">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        className="preview-card-quantity-button preview-card-quantity-button--add"
                        onClick={() => onAddItem?.(relatedItem)}
                        disabled={!canAdd}
                        aria-label={`Add ${relatedItem.name} to cart`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="preview-card-footer">
          <button
            type="button"
            className="preview-card-button preview-card-button--secondary"
            onClick={onClose}
          >
            Close
          </button>

          {onViewCart && (
            <button
              type="button"
              className="preview-card-button preview-card-button--outline"
              onClick={onViewCart}
            >
              <ShoppingCart size={17} />
              View Cart
            </button>
          )}

          {onGoToCart && (
            <button
              type="button"
              className="preview-card-button preview-card-button--outline"
              onClick={onGoToCart}
            >
              Go to Cart
            </button>
          )}

          {onVisitItem && (
            <button
              type="button"
              className="preview-card-button preview-card-button--primary"
              onClick={() => onVisitItem(item)}
            >
              Visit Item Page
              <ArrowRight size={17} />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default MenuItemCard;
