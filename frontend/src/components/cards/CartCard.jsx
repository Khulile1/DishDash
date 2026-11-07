// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo } from "react";

import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";

import "../../styles/PreviewCards.css";

// ======================================
// CART CARD
// ======================================

function CartCard({
  isOpen,

  cartItems = [],

  onClose,

  onContinueToCart,

  onAddItem,

  onRemoveItem,

  onRemoveItemCompletely,

  onVisitItem,
}) {
  // ======================================
  // MODAL BEHAVIOUR
  // ======================================

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // ======================================
    // ESCAPE TO CLOSE
    // ======================================

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    // ======================================
    // STOP BODY SCROLL
    // ======================================

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",

      handleKeyDown,
    );

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener(
        "keydown",

        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  // ======================================
  // TOTAL QUANTITY
  // ======================================

  const totalQuantity = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Math.max(
            1,

            Number(item.quantity || 1),
          ),

        0,
      ),

    [cartItems],
  );

  // ======================================
  // SUBTOTAL
  // ======================================

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Math.max(
              1,

              Number(item.quantity || 1),
            ),

        0,
      ),

    [cartItems],
  );

  // ======================================
  // CLOSED
  // ======================================

  if (!isOpen) {
    return null;
  }

  // ======================================
  // PAGE
  // ======================================

  return (
    <div
      className="preview-card-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="presentation"
    >
      <section
        className="preview-card preview-card--cart"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-card-title"
      >
        {/* ======================================
            HEADER
        ====================================== */}

        <header className="preview-card-header">
          <div>
            <span className="preview-card-eyebrow">
              <ShoppingCart size={15} />
              Cart preview
            </span>

            <h2 id="cart-card-title">Your Cart</h2>

            <p>
              {totalQuantity === 0
                ? "Your cart is currently empty."
                : `${totalQuantity} ${
                    totalQuantity === 1 ? "item" : "items"
                  } ready for checkout.`}
            </p>
          </div>

          <button
            type="button"
            className="preview-card-icon-button"
            onClick={onClose}
            aria-label="Close cart preview"
          >
            <X size={20} />
          </button>
        </header>

        {/* ======================================
            CART ITEMS
        ====================================== */}

        <div className="preview-card-cart-list">
          {cartItems.length === 0 ? (
            <div className="preview-card-empty">
              <ShoppingCart size={30} />

              <strong>Your cart is empty</strong>

              <span>Add something from a restaurant menu to see it here.</span>
            </div>
          ) : (
            cartItems.map((item) => {
              const quantity = Math.max(
                1,

                Number(item.quantity || 1),
              );

              return (
                <article key={item._id} className="preview-card-cart-item">
                  {/* ======================================
                        ITEM
                    ====================================== */}

                  <button
                    type="button"
                    className="preview-card-cart-item-main"
                    onClick={() => onVisitItem?.(item)}
                  >
                    {/* IMAGE */}

                    <div className="preview-card-cart-image">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name || ""}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span>
                          {String(item.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* INFO */}

                    <div className="preview-card-cart-copy">
                      <strong>{item.name}</strong>

                      {item.restaurant_name && (
                        <span>{item.restaurant_name}</span>
                      )}

                      <small>R{Number(item.price || 0).toFixed(2)}</small>
                    </div>
                  </button>

                  {/* ======================================
                        QUANTITY
                    ====================================== */}

                  <div className="preview-card-quantity">
                    <button
                      type="button"
                      onClick={() => onRemoveItem?.(item)}
                      aria-label={`Remove one ${item.name}`}
                      disabled={quantity <= 1}
                    >
                      <Minus size={15} />
                    </button>

                    <strong>{quantity}</strong>

                    <button
                      type="button"
                      onClick={() => onAddItem?.(item)}
                      aria-label={`Add another ${item.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* ======================================
                        DELETE COMPLETELY
                    ====================================== */}

                  {onRemoveItemCompletely && (
                    <button
                      type="button"
                      className="preview-card-remove"
                      onClick={() => onRemoveItemCompletely(item)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* ======================================
            SUBTOTAL
        ====================================== */}

        <div className="preview-card-cart-total">
          <span>Subtotal</span>

          <strong>R{subtotal.toFixed(2)}</strong>
        </div>

        {/* ======================================
            FOOTER
        ====================================== */}

        <footer className="preview-card-footer preview-card-footer--cart">
          <button
            type="button"
            className="preview-card-button preview-card-button--secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="preview-card-button preview-card-button--primary"
            onClick={onContinueToCart}
            disabled={cartItems.length === 0}
          >
            Continue to Cart
            <ArrowRight size={17} />
          </button>
        </footer>
      </section>
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default CartCard;
