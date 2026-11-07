// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  Pencil,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { confirmOrder } from "../../services/orderService";

import {
  clearStoredCart,
  removeLegacyCart,
} from "../../services/cartStorageService";

import "../../styles/OrderConfirmationPage.css";

// ======================================
// STORAGE KEYS
// ======================================

const PENDING_CONFIRMATION_KEY = "pendingOrderConfirmation";

const PENDING_EDIT_KEY = "pendingOrderEdit";

// ======================================
// READ SAVED CONFIRMATION
// ======================================

const readPendingConfirmation = () => {
  try {
    const saved = localStorage.getItem(PENDING_CONFIRMATION_KEY);

    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to read pending order confirmation:", error);

    return null;
  }
};

// ======================================
// SAVE CONFIRMATION
// ======================================

const saveConfirmationSnapshot = (confirmation) => {
  try {
    localStorage.setItem(
      PENDING_CONFIRMATION_KEY,
      JSON.stringify(confirmation),
    );
  } catch (error) {
    console.error("Failed to save order confirmation:", error);
  }
};

// ======================================
// ORDER CONFIRMATION PAGE
// ======================================

function OrderConfirmationPage() {
  // ======================================
  // ROUTER
  // ======================================

  const navigate = useNavigate();

  const location = useLocation();

  const { orderId } = useParams();

  // ======================================
  // PREVENT DUPLICATE CONFIRM CALLS
  // ======================================

  const finalisingRef = useRef(false);

  // ======================================
  // CONFIRMATION SNAPSHOT
  // ======================================

  const confirmation = useMemo(() => {
    const stateConfirmation = location.state?.confirmation;

    if (
      stateConfirmation &&
      String(stateConfirmation.orderId) === String(orderId)
    ) {
      return stateConfirmation;
    }

    const saved = readPendingConfirmation();

    if (saved && String(saved.orderId) === String(orderId)) {
      return saved;
    }

    return null;
  }, [location.state, orderId]);

  // ======================================
  // COUNTDOWN
  // ======================================

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!confirmation?.editDeadline) {
      return 0;
    }

    return Math.max(
      0,
      Math.ceil((Number(confirmation.editDeadline) - Date.now()) / 1000),
    );
  });

  // ======================================
  // EDIT WINDOW
  // ======================================

  const [editWindowOpen, setEditWindowOpen] = useState(() => {
    if (!confirmation?.editDeadline) {
      return false;
    }

    if (
      confirmation?.status === "awaiting_payment" ||
      confirmation?.status === "confirmed"
    ) {
      return false;
    }

    return Number(confirmation.editDeadline) > Date.now();
  });

  // ======================================
  // PAYMENT TRANSITION STATE
  // ======================================

  const [paymentReady, setPaymentReady] = useState(
    confirmation?.status === "awaiting_payment",
  );

  const [finalising, setFinalising] = useState(false);

  const [confirmationError, setConfirmationError] = useState("");

  // ======================================
  // FORMAT CURRENCY
  // ======================================

  const formatCurrency = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "R0.00";
    }

    return `R${value.toFixed(2)}`;
  };

  // ======================================
  // CLEAR CHECKOUT STORAGE
  // ======================================

  const clearCheckoutState = () => {
    // Clear only the currently logged-in customer's cart.
    clearStoredCart();

    // Remove the old shared cart if it still exists.
    removeLegacyCart();

    // Refresh Navbar/cart listeners in the same browser tab.
    window.dispatchEvent(new CustomEvent("dishdash-cart-changed"));

    // Pre-order checkout data is no longer needed once
    // the order is locked and ready for actual payment.
    localStorage.removeItem("checkoutPaymentDetails");

    localStorage.removeItem("checkoutOrderTotal");

    localStorage.removeItem(PENDING_EDIT_KEY);
  };

  // ======================================
  // UPDATE LOCAL CONFIRMATION SNAPSHOT
  // ======================================

  const markSnapshotAwaitingPayment = (backendOrder) => {
    if (!confirmation) {
      return;
    }

    const paymentSnapshot = {
      ...confirmation,

      status: "awaiting_payment",

      backendOrder: backendOrder || confirmation.backendOrder,
    };

    saveConfirmationSnapshot(paymentSnapshot);
  };

  // ======================================
  // MOVE ORDER TO PAYMENT
  // ======================================
  //
  // The backend endpoint is still called
  // confirmOrder for compatibility, but
  // after 10 seconds it now changes:
  //
  // pending_confirmation
  //        ↓
  // awaiting_payment
  //
  // It does NOT mark the order as paid.
  // ======================================

  const finaliseOrder = async () => {
    const targetOrderId = confirmation?.orderId || orderId;

    if (!targetOrderId) {
      return;
    }

    if (finalisingRef.current) {
      return;
    }

    finalisingRef.current = true;

    setFinalising(true);

    setConfirmationError("");

    setEditWindowOpen(false);

    setRemainingSeconds(0);

    try {
      const response = await confirmOrder(targetOrderId);

      const backendOrder =
        response?.order || response?.updatedOrder || response;

      const backendStatus = backendOrder?.status;

      // If the order is already paid/confirmed,
      // do not send the customer back to payment.
      if (
        response?.paymentRequired === false &&
        backendStatus === "confirmed"
      ) {
        clearCheckoutState();

        localStorage.removeItem(PENDING_CONFIRMATION_KEY);

        navigate(`/orders/${targetOrderId}`, {
          replace: true,
        });

        return;
      }

      setPaymentReady(true);

      markSnapshotAwaitingPayment(backendOrder);

      clearCheckoutState();

      navigate(`/orders/${targetOrderId}/payment`, {
        replace: true,

        state: {
          order: backendOrder,
          orderId: targetOrderId,
          fromOrderConfirmation: true,
        },
      });
    } catch (error) {
      console.error("Failed to move order to payment:", error);

      setConfirmationError(
        error.response?.data?.message ||
          "The edit window has ended, but we could not continue to payment. Please retry.",
      );
    } finally {
      finalisingRef.current = false;

      setFinalising(false);
    }
  };

  // ======================================
  // 10 SECOND COUNTDOWN
  // ======================================

  useEffect(() => {
    if (!confirmation?.editDeadline) {
      return undefined;
    }

    // If the page is revisited after the
    // backend already moved the order to
    // awaiting_payment, continue straight
    // to the payment gateway.
    if (confirmation?.status === "awaiting_payment") {
      setEditWindowOpen(false);

      setRemainingSeconds(0);

      setPaymentReady(true);

      navigate(`/orders/${confirmation.orderId || orderId}/payment`, {
        replace: true,

        state: {
          order: confirmation.backendOrder || null,
          orderId: confirmation.orderId || orderId,
          fromOrderConfirmation: true,
        },
      });

      return undefined;
    }

    if (confirmation?.status === "confirmed") {
      setEditWindowOpen(false);

      setRemainingSeconds(0);

      navigate(`/orders/${confirmation.orderId || orderId}`, {
        replace: true,
      });

      return undefined;
    }

    const updateCountdown = () => {
      const millisecondsLeft = Number(confirmation.editDeadline) - Date.now();

      // ======================================
      // TIME FINISHED
      // ======================================

      if (millisecondsLeft <= 0) {
        setRemainingSeconds(0);

        setEditWindowOpen(false);

        finaliseOrder();

        return false;
      }

      // ======================================
      // UPDATE TIMER
      // ======================================

      setRemainingSeconds(Math.ceil(millisecondsLeft / 1000));

      setEditWindowOpen(true);

      return true;
    };

    const stillRunning = updateCountdown();

    if (!stillRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const keepRunning = updateCountdown();

      if (!keepRunning) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    confirmation?.editDeadline,
    confirmation?.status,
    confirmation?.orderId,
    orderId,
  ]);

  // ======================================
  // EDIT ORDER
  // ======================================

  const handleEditOrder = () => {
    if (
      !confirmation ||
      !editWindowOpen ||
      remainingSeconds <= 0 ||
      finalising
    ) {
      return;
    }

    try {
      localStorage.setItem(
        PENDING_EDIT_KEY,

        JSON.stringify({
          orderId: confirmation.orderId,

          orderNumber: confirmation.orderNumber,

          startedAt: confirmation.createdAt,

          editDeadline: confirmation.editDeadline,

          snapshot: confirmation,
        }),
      );
    } catch (error) {
      console.error("Failed to save order edit context:", error);
    }

    navigate("/cart", {
      state: {
        editingOrder: true,

        orderId: confirmation.orderId,

        editDeadline: confirmation.editDeadline,
      },
    });
  };

  // ======================================
  // RETRY PAYMENT TRANSITION
  // ======================================

  const handleRetryConfirmation = async () => {
    await finaliseOrder();
  };

  // ======================================
  // NO CONFIRMATION
  // ======================================

  if (!confirmation) {
    return (
      <div className="order-confirmation-layout">
        <Navbar />

        <main className="order-confirmation-page">
          <section className="order-confirmation-missing">
            <PackageCheck size={38} />

            <h1>Order confirmation unavailable</h1>

            <p>We could not find the order details for this confirmation.</p>

            <button type="button" onClick={() => navigate("/orders")}>
              View My Orders
            </button>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // ======================================
  // DATA
  // ======================================

  const cartItems = Array.isArray(confirmation.cart) ? confirmation.cart : [];

  const restaurants = Array.isArray(confirmation.restaurants)
    ? confirmation.restaurants
    : [];

  const pricing = confirmation.pricing || {};

  const delivery = confirmation.delivery || {};

  const payment = confirmation.payment || {};

  // ======================================
  // TOTAL ITEMS
  // ======================================

  const totalItems = cartItems.reduce(
    (total, item) => total + Math.max(1, Number(item.quantity || 1)),
    0,
  );

  // ======================================
  // STATUS
  // ======================================

  const isReadyForPayment =
    paymentReady || confirmation.status === "awaiting_payment";

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="order-confirmation-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="order-confirmation-page">
        <div className="order-confirmation-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="order-confirmation-back"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft size={18} />
            My Orders
          </button>

          {/* ======================================
              ORDER STATUS
          ====================================== */}

          <section
            className={`order-confirmation-status ${
              confirmationError
                ? "order-confirmation-status--error"
                : editWindowOpen
                  ? "order-confirmation-status--editing"
                  : finalising
                    ? "order-confirmation-status--processing"
                    : "order-confirmation-status--ready"
            }`}
          >
            <div className="order-confirmation-status-icon">
              {editWindowOpen ? (
                <Clock3 size={30} />
              ) : (
                <CheckCircle2 size={30} />
              )}
            </div>

            <div className="order-confirmation-status-copy">
              <span>
                {editWindowOpen
                  ? "Order started"
                  : finalising
                    ? "Preparing payment"
                    : isReadyForPayment
                      ? "Ready for payment"
                      : "Edit window ended"}
              </span>

              <h1>
                {editWindowOpen
                  ? "Review your order"
                  : finalising
                    ? "Taking you to payment"
                    : isReadyForPayment
                      ? "Your order is locked"
                      : "Continue to payment"}
              </h1>

              <p>
                {editWindowOpen
                  ? `You have ${remainingSeconds} ${
                      remainingSeconds === 1 ? "second" : "seconds"
                    } to make changes.`
                  : finalising
                    ? "The edit window has ended. Your order is being prepared for payment."
                    : isReadyForPayment
                      ? "Your order is locked and ready for payment."
                      : "The edit window has ended. Continue to payment to complete your order."}
              </p>
            </div>

            {/* ======================================
                COUNTDOWN
            ====================================== */}

            {editWindowOpen && (
              <div className="order-confirmation-countdown">
                <strong>{remainingSeconds}</strong>

                <span>seconds</span>
              </div>
            )}
          </section>

          {/* ======================================
              CONFIRMATION ERROR
          ====================================== */}

          {confirmationError && (
            <section className="order-confirmation-card">
              <div className="order-confirmation-card-heading">
                <RefreshCw size={20} />

                <div>
                  <h3>Could not continue to payment</h3>

                  <p>{confirmationError}</p>
                </div>
              </div>

              <button
                type="button"
                className="order-confirmation-secondary"
                onClick={handleRetryConfirmation}
                disabled={finalising}
              >
                <RefreshCw size={17} />

                {finalising ? "Retrying..." : "Continue to Payment"}
              </button>
            </section>
          )}

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="order-confirmation-header">
            <div>
              <span className="order-confirmation-eyebrow">
                <ReceiptText size={16} />
                Order Confirmation
              </span>

              <h2>Order #{confirmation.orderNumber}</h2>

              <p>These details were captured when your order was created.</p>
            </div>

            <div className="order-confirmation-header-summary">
              <div>
                <strong>{totalItems}</strong>

                <span>{totalItems === 1 ? "Item" : "Items"}</span>
              </div>

              <div>
                <strong>{formatCurrency(pricing.total)}</strong>

                <span>Total</span>
              </div>
            </div>
          </section>

          {/* ======================================
              CONTENT
          ====================================== */}

          <div className="order-confirmation-grid">
            {/* ======================================
                MAIN COLUMN
            ====================================== */}

            <div className="order-confirmation-main">
              {/* ======================================
                  ORDER ITEMS
              ====================================== */}

              <section className="order-confirmation-card">
                <div className="order-confirmation-card-heading">
                  <ShoppingBag size={20} />

                  <div>
                    <h3>Order Items</h3>

                    <p>Everything captured from your cart.</p>
                  </div>
                </div>

                <div className="order-confirmation-items">
                  {cartItems.map((item) => {
                    const quantity = Math.max(
                      1,

                      Number(item.quantity || 1),
                    );

                    return (
                      <article
                        key={item._id}
                        className="order-confirmation-item"
                      >
                        {/* IMAGE */}

                        <div className="order-confirmation-item-image">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ShoppingBag size={23} />
                          )}
                        </div>

                        {/* ITEM INFO */}

                        <div className="order-confirmation-item-copy">
                          {item.restaurant_name && (
                            <span>{item.restaurant_name}</span>
                          )}

                          <strong>{item.name}</strong>

                          <small>Quantity: {quantity}</small>
                        </div>

                        {/* PRICE */}

                        <strong className="order-confirmation-item-price">
                          {formatCurrency(Number(item.price || 0) * quantity)}
                        </strong>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* ======================================
                  RESTAURANTS
              ====================================== */}

              <section className="order-confirmation-card">
                <div className="order-confirmation-card-heading">
                  <Store size={20} />

                  <div>
                    <h3>
                      {restaurants.length > 1
                        ? "Restaurant Pickups"
                        : "Restaurant"}
                    </h3>

                    <p>
                      {confirmation.isBundledOrder
                        ? "This order contains multiple restaurant pickups."
                        : "Restaurant preparing this order."}
                    </p>
                  </div>
                </div>

                <div className="order-confirmation-simple-list">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.restaurant_id}
                      className="order-confirmation-simple-row"
                    >
                      <div>
                        <strong>
                          {restaurant.restaurant_name || "Restaurant"}
                        </strong>

                        <span>Pickup</span>
                      </div>

                      <strong>{formatCurrency(restaurant.subtotal)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {/* ======================================
                  DELIVERY
              ====================================== */}

              <section className="order-confirmation-card">
                <div className="order-confirmation-card-heading">
                  <MapPin size={20} />

                  <div>
                    <h3>Delivery</h3>

                    <p>Saved delivery details captured with the order.</p>
                  </div>
                </div>

                <div className="order-confirmation-detail">
                  <span>Delivering to</span>

                  <strong>{delivery.address || "Delivery address"}</strong>
                </div>

                {/* ROUTE */}

                {delivery.route && (
                  <div className="order-confirmation-route">
                    <div>
                      <Truck size={18} />

                      <span>Distance</span>

                      <strong>
                        {Number(delivery.route.distanceKm || 0).toFixed(1)} km
                      </strong>
                    </div>

                    <div>
                      <Clock3 size={18} />

                      <span>Estimated drive</span>

                      <strong>
                        {Number(delivery.route.durationMinutes || 0)} min
                      </strong>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* ======================================
                SIDEBAR
            ====================================== */}

            <aside className="order-confirmation-sidebar">
              {/* ======================================
                  ORDER SUMMARY
              ====================================== */}

              <section className="order-confirmation-card order-confirmation-summary">
                <div className="order-confirmation-card-heading">
                  <PackageCheck size={20} />

                  <div>
                    <h3>Order Summary</h3>

                    <p>Captured checkout totals.</p>
                  </div>
                </div>

                {/* SUBTOTAL */}

                <div className="order-confirmation-summary-row">
                  <span>Subtotal</span>

                  <strong>{formatCurrency(pricing.subtotal)}</strong>
                </div>

                {/* DELIVERY */}

                <div className="order-confirmation-summary-row">
                  <span>Delivery Fee</span>

                  <strong>{formatCurrency(pricing.deliveryFee)}</strong>
                </div>

                {/* SERVICE */}

                <div className="order-confirmation-summary-row">
                  <span>Service Fee</span>

                  <strong>{formatCurrency(pricing.serviceFee)}</strong>
                </div>

                {/* BALANCE */}

                {Number(payment.balanceUsed || 0) > 0 && (
                  <div className="order-confirmation-summary-row">
                    <span>Dish Dash Balance</span>

                    <strong>-{formatCurrency(payment.balanceUsed)}</strong>
                  </div>
                )}

                {/* TOTAL */}

                <div className="order-confirmation-summary-total">
                  <span>Total</span>

                  <strong>{formatCurrency(pricing.total)}</strong>
                </div>
              </section>

              {/* ======================================
                  PAYMENT
              ====================================== */}

              <section className="order-confirmation-card">
                <div className="order-confirmation-card-heading">
                  <CreditCard size={20} />

                  <div>
                    <h3>Payment</h3>

                    <p>Payment will be completed after the review period.</p>
                  </div>
                </div>

                <div className="order-confirmation-detail">
                  <span>Method</span>

                  <strong>
                    {payment.method
                      ? String(payment.method).toUpperCase()
                      : "SELECT ON PAYMENT PAGE"}
                  </strong>
                </div>

                <div className="order-confirmation-detail">
                  <span>Amount to pay</span>

                  <strong>
                    {formatCurrency(payment.amountToPay ?? pricing.total)}
                  </strong>
                </div>
              </section>

              {/* ======================================
                  ACTIONS
              ====================================== */}

              <section className="order-confirmation-actions">
                {/* EDIT */}

                {editWindowOpen ? (
                  <button
                    type="button"
                    className="order-confirmation-edit"
                    onClick={handleEditOrder}
                    disabled={finalising}
                  >
                    <Pencil size={18} />
                    Edit Order · {remainingSeconds}s
                  </button>
                ) : finalising ? (
                  <button
                    type="button"
                    className="order-confirmation-primary"
                    disabled
                  >
                    <RefreshCw size={18} />
                    Preparing Payment...
                  </button>
                ) : (
                  <button
                    type="button"
                    className="order-confirmation-primary"
                    onClick={finaliseOrder}
                  >
                    <CreditCard size={18} />
                    Continue to Payment
                  </button>
                )}

                {/* FULL ORDER */}

                <button
                  type="button"
                  className="order-confirmation-secondary"
                  onClick={() => navigate("/orders")}
                >
                  View My Orders
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

export default OrderConfirmationPage;
