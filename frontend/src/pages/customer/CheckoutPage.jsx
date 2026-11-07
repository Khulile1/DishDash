// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageCheck,
  Plus,
  ShoppingBag,
  Store,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import useCart from "../../hooks/useCart";

import { createOrder } from "../../services/orderService";

import { getAddresses } from "../../services/addressService";

import { getDeliveryQuote } from "../../services/routingService";

import "../../styles/CheckoutPage.css";

// ======================================
// STORAGE KEYS
// ======================================

const PAYMENT_METHOD_KEY = "checkoutPaymentDetails";

const ORDER_TOTAL_KEY = "checkoutOrderTotal";

// ======================================
// READ PAYMENT METHOD
// ======================================

const readSavedPaymentMethod = () => {
  try {
    const saved = localStorage.getItem(PAYMENT_METHOD_KEY);

    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not read payment method:", error);

    return null;
  }
};

// ======================================
// CHECKOUT PAGE
// ======================================

function CheckoutPage() {
  // ======================================
  // ROUTER
  // ======================================

  const navigate = useNavigate();

  const location = useLocation();

  // ======================================
  // CART
  // ======================================

  const { cart } = useCart();

  // ======================================
  // ADDRESSES
  // ======================================

  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [addressLoading, setAddressLoading] = useState(true);

  const [addressError, setAddressError] = useState("");

  // ======================================
  // PAYMENT METHOD
  // ======================================
  //
  // This is ONLY the pre-order method.
  //
  // Actual payment details happen after
  // the 10 second review.
  // ======================================

  const [paymentSelection, setPaymentSelection] = useState(() =>
    readSavedPaymentMethod(),
  );

  // ======================================
  // SYNC PAYMENT METHOD
  // ======================================
  //
  // PaymentMethodPage returns here after
  // saving the selection.
  // ======================================

  useEffect(() => {
    const saved = readSavedPaymentMethod();

    if (saved?.method) {
      setPaymentSelection(saved);

      return;
    }

    if (location.state?.paymentMethod) {
      setPaymentSelection({
        method: location.state.paymentMethod,
      });
    }
  }, [location.key, location.state]);

  // ======================================
  // PAYMENT METHOD VALUE
  // ======================================

  const paymentMethod = paymentSelection?.method || "";

  // ======================================
  // ACCOUNT BALANCE
  // ======================================

  const accountBalance =
    Number(localStorage.getItem("dishDashAccountBalance")) || 0;

  const availableCredit = accountBalance > 0 ? accountBalance : 0;

  const outstandingBalance = accountBalance < 0 ? Math.abs(accountBalance) : 0;

  const hasOutstandingBalance = outstandingBalance > 0;

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // DELIVERY QUOTE
  // ======================================

  const [deliveryQuote, setDeliveryQuote] = useState(null);

  const [quoteLoading, setQuoteLoading] = useState(false);

  const [quoteError, setQuoteError] = useState("");

  // ======================================
  // LOAD ADDRESSES
  // ======================================

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);

      setAddressError("");

      const data = await getAddresses();

      const addressList = Array.isArray(data)
        ? data
        : Array.isArray(data?.addresses)
          ? data.addresses
          : [];

      setAddresses(addressList);

      if (addressList.length > 0) {
        const defaultAddress =
          addressList.find((address) => address.is_default === true) ||
          addressList[0];

        setSelectedAddressId(defaultAddress._id);
      } else {
        setSelectedAddressId("");
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);

      setAddressError("Could not load your saved addresses.");
    } finally {
      setAddressLoading(false);
    }
  };

  // ======================================
  // INITIAL ADDRESS LOAD
  // ======================================

  useEffect(() => {
    loadAddresses();
  }, []);

  // ======================================
  // FORMAT ADDRESS
  // ======================================

  const formatSavedAddress = (address) => {
    if (!address) {
      return "";
    }

    if (address.formatted_address) {
      return address.formatted_address;
    }

    return [
      address.street_address,
      address.suburb,
      address.city,
      address.province,
      address.postal_code,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ======================================
  // SELECTED ADDRESS
  // ======================================

  const selectedAddress = addresses.find(
    (address) => String(address._id) === String(selectedAddressId),
  );

  // ======================================
  // DELIVERY ADDRESS
  // ======================================

  const deliveryAddress = formatSavedAddress(selectedAddress);

  // ======================================
  // GET RESTAURANT ID
  // ======================================

  const getCartItemRestaurantId = (item) => {
    const restaurantId = item?.restaurant_id;

    if (restaurantId && typeof restaurantId === "object") {
      return String(restaurantId._id || "");
    }

    return restaurantId ? String(restaurantId) : "";
  };

  // ======================================
  // UNIQUE RESTAURANTS
  // ======================================

  const restaurantIds = [
    ...new Set(
      cart.map((item) => getCartItemRestaurantId(item)).filter(Boolean),
    ),
  ];

  const restaurantIdsKey = restaurantIds.join("|");

  // ======================================
  // SUBTOTAL
  // ======================================

  const subtotal = cart.reduce((total, item) => {
    const price = Number(item.price) || 0;

    const quantity = Number(item.quantity) || 1;

    return total + price * quantity;
  }, 0);

  // ======================================
  // DELIVERY QUOTE
  // ======================================

  const loadDeliveryQuote = async () => {
    if (cart.length === 0) {
      setDeliveryQuote(null);

      setQuoteError("");

      return;
    }

    if (restaurantIds.length === 0) {
      setDeliveryQuote(null);

      setQuoteError("Restaurant information is missing from the cart.");

      return;
    }

    if (restaurantIds.length > 2) {
      setDeliveryQuote(null);

      setQuoteError(
        "A bundled delivery can currently contain a maximum of 2 restaurants.",
      );

      return;
    }

    if (!selectedAddressId || addressLoading) {
      setDeliveryQuote(null);

      if (!addressLoading && addresses.length === 0) {
        setQuoteError(
          "Add a delivery location before delivery pricing can be calculated.",
        );
      } else {
        setQuoteError("");
      }

      return;
    }

    try {
      setQuoteLoading(true);

      setQuoteError("");

      const quote = await getDeliveryQuote({
        restaurantIds,

        subtotal,

        addressId: selectedAddressId,
      });

      setDeliveryQuote(quote);
    } catch (error) {
      console.error("Could not calculate checkout pricing:", error);

      setDeliveryQuote(null);

      if (!error.response) {
        setQuoteError("Cannot connect to the server to calculate delivery.");

        return;
      }

      setQuoteError(
        error.response?.data?.message ||
          "Could not calculate delivery and service fees.",
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  // ======================================
  // REFRESH DELIVERY QUOTE
  // ======================================

  useEffect(() => {
    loadDeliveryQuote();
  }, [restaurantIdsKey, subtotal, selectedAddressId, addressLoading]);

  // ======================================
  // PRICING
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
    !quoteLoading &&
    !quoteError;

  // ======================================
  // PAYMENT METHOD VALID FOR TOTAL
  // ======================================

  const savedPaymentTotal = Number(paymentSelection?.orderTotal);

  const paymentTotalMatches =
    Boolean(paymentSelection) &&
    Number.isFinite(savedPaymentTotal) &&
    Number.isFinite(total) &&
    Math.abs(savedPaymentTotal - total) < 0.01;

  const paymentMethodReady = Boolean(paymentMethod) && paymentTotalMatches;

  // ======================================
  // FORMAT MONEY
  // ======================================

  const formatCurrency = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "R0.00";
    }

    return `R${value.toFixed(2)}`;
  };

  // ======================================
  // PAYMENT LABEL
  // ======================================

  const getPaymentLabel = () => {
    if (paymentMethod === "card") {
      return "Card";
    }

    if (paymentMethod === "cash") {
      return "Cash";
    }

    if (paymentMethod === "balance") {
      return "Dish Dash Balance";
    }

    return "Not selected";
  };

  // ======================================
  // OPEN PAYMENT METHOD PAGE
  // ======================================

  const handlePaymentMethod = () => {
    setError("");

    if (!pricingReady) {
      setError("Wait for delivery pricing before choosing a payment method.");

      return;
    }

    localStorage.setItem(ORDER_TOTAL_KEY, String(total));

    navigate("/payment-method", {
      state: {
        total,

        paymentMethod: paymentMethod || "card",

        accountBalance,

        fromCheckout: true,
      },
    });
  };

  // ======================================
  // CART QUANTITY
  // ======================================

  const cartQuantity = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0,
  );

  // ======================================
  // BUILD RESTAURANT ORDERS
  // ======================================

  const buildRestaurantOrders = () => {
    return restaurantIds.map((restaurantId) => {
      const restaurantItems = cart
        .filter(
          (item) => getCartItemRestaurantId(item) === String(restaurantId),
        )
        .map((item) => ({
          menu_item_id: item._id,

          quantity: Number(item.quantity) || 1,

          price: Number(item.price),
        }));

      const restaurantItem = cart.find(
        (item) => getCartItemRestaurantId(item) === String(restaurantId),
      );

      const restaurantName = restaurantItem?.restaurant_name || "";

      const restaurantSubtotal = restaurantItems.reduce(
        (total, item) =>
          total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0,
      );

      return {
        restaurant_id: restaurantId,

        restaurant_name: restaurantName,

        items: restaurantItems,

        subtotal: Number(restaurantSubtotal.toFixed(2)),
      };
    });
  };

  // ======================================
  // PLACE ORDER
  // ======================================

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ======================================
    // CART
    // ======================================

    if (cart.length === 0) {
      setError("Your cart is empty.");

      return;
    }

    // ======================================
    // ADDRESS
    // ======================================

    if (!deliveryAddress) {
      setError(
        "Please select a saved delivery address or add a delivery location.",
      );

      return;
    }

    // ======================================
    // RESTAURANTS
    // ======================================

    if (restaurantIds.length === 0) {
      setError("Restaurant information is missing from the cart.");

      return;
    }

    if (restaurantIds.length > 2) {
      setError(
        "A bundled delivery can currently contain a maximum of 2 restaurants.",
      );

      return;
    }

    // ======================================
    // PRICING
    // ======================================

    if (!pricingReady) {
      setError(quoteError || "Delivery pricing is not ready yet.");

      return;
    }

    // ======================================
    // ACCOUNT BALANCE
    // ======================================

    if (hasOutstandingBalance) {
      setError(
        `You must settle your outstanding Dish Dash balance of ${formatCurrency(
          outstandingBalance,
        )} before placing a new order.`,
      );

      return;
    }

    // ======================================
    // PAYMENT METHOD
    // ======================================

    if (!paymentMethod) {
      setError("Add a payment method before placing your order.");

      return;
    }

    if (!paymentTotalMatches) {
      setError("Your order total changed. Review your payment method again.");

      return;
    }

    if (paymentMethod === "balance" && availableCredit < total) {
      setError(
        "Your Dish Dash balance no longer covers the full order. Choose Card or Cash.",
      );

      return;
    }

    // ======================================
    // CREATE ORDER
    // ======================================

    try {
      setLoading(true);

      // ======================================
      // FRESH QUOTE
      // ======================================

      const freshQuote = await getDeliveryQuote({
        restaurantIds,

        subtotal,

        addressId: selectedAddressId,
      });

      const freshPricing = freshQuote?.pricing;

      if (!freshPricing) {
        throw new Error("The delivery quote did not contain pricing.");
      }

      // ======================================
      // CHECK TOTAL AGAIN
      // ======================================

      if (
        Math.abs(
          Number(freshPricing.total) - Number(paymentSelection.orderTotal),
        ) >= 0.01
      ) {
        localStorage.setItem(ORDER_TOTAL_KEY, String(freshPricing.total));

        setError(
          "Your order total changed. Please review your payment method again.",
        );

        return;
      }

      // ======================================
      // RESTAURANT ORDERS
      // ======================================

      const restaurantOrders = buildRestaurantOrders();

      const isBundledOrder = restaurantOrders.length > 1;

      // ======================================
      // ORDER DATA
      // ======================================

      const orderData = {
        ...(isBundledOrder
          ? {}
          : {
              restaurant_id: restaurantOrders[0].restaurant_id,

              items: restaurantOrders[0].items,
            }),

        restaurant_ids: restaurantIds,

        restaurant_orders: restaurantOrders,

        is_bundled_order: isBundledOrder,

        delivery_address_id: selectedAddressId,

        delivery_address: deliveryAddress,

        // ======================================
        // PAYMENT METHOD ONLY
        // ======================================

        payment_method: paymentMethod,

        payment_details: {
          method: paymentMethod,

          paymentStatus: "method_selected",

          captureAfterOrder: true,
        },

        balance_used: 0,

        amount_to_pay: Number(freshPricing.total),

        // ======================================
        // PRICING
        // ======================================

        subtotal: Number(freshPricing.subtotal),

        delivery_fee: Number(freshPricing.deliveryPrice),

        service_fee: Number(freshPricing.serviceFee),

        total_price: Number(freshPricing.total),

        // ======================================
        // DELIVERY
        // ======================================

        delivery_distance_km: Number(
          freshQuote?.route?.distanceKm || freshPricing.distanceKm || 0,
        ),

        delivery_duration_minutes: Number(
          freshQuote?.route?.durationMinutes || 0,
        ),

        pickup_order: Array.isArray(freshQuote?.pickupOrder)
          ? freshQuote.pickupOrder
          : [],

        delivery_bundle: Boolean(freshQuote?.bundle),
      };

      // ======================================
      // CREATE
      // ======================================

      const data = await createOrder(orderData);

      const createdOrder = data?.order || data?.createdOrder || data;

      const createdOrderId =
        createdOrder?._id ||
        createdOrder?.id ||
        data?.order_id ||
        data?.orderId;

      if (!createdOrderId) {
        throw new Error("The order was created but no order ID was returned.");
      }

      // ======================================
      // EDIT DEADLINE
      // ======================================

      const editableUntil =
        createdOrder?.editable_until || data?.editableUntil || null;

      const editDeadline = editableUntil
        ? new Date(editableUntil).getTime()
        : Date.now() + 10000;

      // ======================================
      // CONFIRMATION SNAPSHOT
      // ======================================

      const confirmationSnapshot = {
        orderId: String(createdOrderId),

        orderNumber:
          createdOrder?.order_number ||
          createdOrder?.orderNumber ||
          data?.order_number ||
          data?.orderNumber ||
          String(createdOrderId),

        createdAt:
          createdOrder?.createdAt ||
          createdOrder?.created_at ||
          new Date().toISOString(),

        editDeadline,

        status: createdOrder?.status || "pending_confirmation",

        isBundledOrder,

        backendOrder: createdOrder,

        orderData,

        cart: cart.map((item) => ({
          ...item,
        })),

        restaurantOrders,

        restaurants: restaurantOrders.map((restaurantOrder) => ({
          restaurant_id: restaurantOrder.restaurant_id,

          restaurant_name: restaurantOrder.restaurant_name,

          subtotal: restaurantOrder.subtotal,
        })),

        delivery: {
          addressId: selectedAddressId,

          address: deliveryAddress,

          savedAddress: selectedAddress || null,

          route: freshQuote?.route || null,

          pickupOrder: Array.isArray(freshQuote?.pickupOrder)
            ? freshQuote.pickupOrder
            : [],

          bundle: Boolean(freshQuote?.bundle),
        },

        payment: {
          method: paymentMethod,

          details: paymentSelection,

          balanceUsed: 0,

          amountToPay: Number(freshPricing.total),

          accountBalance,
        },

        pricing: {
          subtotal: Number(freshPricing.subtotal),

          deliveryFee: Number(freshPricing.deliveryPrice),

          serviceFee: Number(freshPricing.serviceFee),

          total: Number(freshPricing.total),

          serviceFeePercentage: freshPricing.serviceFeePercentage ?? null,
        },
      };

      // ======================================
      // SAVE SNAPSHOT
      // ======================================

      localStorage.setItem(
        "pendingOrderConfirmation",

        JSON.stringify(confirmationSnapshot),
      );

      setSuccess("Order started. You have 10 seconds to review it.");

      // ======================================
      // CONFIRMATION PAGE
      // ======================================

      navigate(`/order-confirmation/${createdOrderId}`, {
        replace: true,

        state: {
          confirmation: confirmationSnapshot,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);

      if (!error.response) {
        setError(error.message || "Cannot connect to the server.");

        return;
      }

      setError(error.response?.data?.message || "Could not place your order.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // EMPTY CART
  // ======================================

  if (cart.length === 0) {
    return (
      <div className="checkout-layout">
        <Navbar />

        <main className="checkout-page">
          <div className="checkout-container">
            <button
              type="button"
              className="checkout-back-button"
              onClick={() => navigate("/restaurants")}
            >
              <ArrowLeft size={18} />
              Back to Restaurants
            </button>

            <section className="checkout-empty">
              <div className="checkout-empty-icon">
                <ShoppingBag size={32} />
              </div>

              <h1>Your cart is empty</h1>

              <p>
                Add something from a restaurant before continuing to checkout.
              </p>

              <button
                type="button"
                className="checkout-browse-button"
                onClick={() => navigate("/restaurants")}
              >
                <Store size={17} />
                Browse Restaurants
              </button>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="checkout-layout">
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-container">
          {/* BACK */}

          <button
            type="button"
            className="checkout-back-button"
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft size={18} />
            Back to Cart
          </button>

          {/* HEADER */}

          <section className="checkout-header mobile-page-header">
            <div className="checkout-header-content">
              <span className="checkout-eyebrow">
                <PackageCheck size={16} />
                Complete your order
              </span>

              <h1>Checkout</h1>

              <p>
                Review your order, confirm your delivery address and payment
                method.
              </p>
            </div>

            <div className="checkout-header-count">
              <strong>{cartQuantity}</strong>

              <span>{cartQuantity === 1 ? "Item" : "Items"}</span>
            </div>
          </section>

          {/* FORM */}

          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <div className="checkout-content-grid">
              {/* LEFT */}

              <div className="checkout-main-column">
                {/* ORDER */}

                <section className="checkout-section">
                  <div className="checkout-section-heading">
                    <div className="checkout-section-icon">
                      <ShoppingBag size={20} />
                    </div>

                    <div>
                      <h2>Your Order</h2>

                      <p>Review the items before placing your order.</p>
                    </div>
                  </div>

                  <div className="checkout-items">
                    {cart.map((item) => {
                      const quantity = Number(item.quantity) || 1;

                      const itemTotal = (Number(item.price) || 0) * quantity;

                      return (
                        <article key={item._id} className="checkout-item">
                          <div className="checkout-item-image-wrapper">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="checkout-item-image"
                              />
                            ) : (
                              <div className="checkout-item-placeholder">
                                <ShoppingBag size={24} />
                              </div>
                            )}
                          </div>

                          <div className="checkout-item-info">
                            {item.restaurant_name && (
                              <span className="checkout-item-restaurant">
                                {item.restaurant_name}
                              </span>
                            )}

                            <strong>{item.name}</strong>

                            <span>Quantity: {quantity}</span>
                          </div>

                          <strong className="checkout-item-price">
                            {formatCurrency(itemTotal)}
                          </strong>
                        </article>
                      );
                    })}
                  </div>
                </section>

                {/* ADDRESS */}

                <section className="checkout-section">
                  <div className="checkout-section-heading">
                    <div className="checkout-section-icon">
                      <MapPin size={20} />
                    </div>

                    <div>
                      <h2>Delivery Address</h2>

                      <p>
                        Select a saved delivery address or add another location.
                      </p>
                    </div>
                  </div>

                  {addressLoading && (
                    <div className="checkout-address-loading">
                      Loading your delivery details...
                    </div>
                  )}

                  {!addressLoading && addressError && (
                    <div className="checkout-address-warning">
                      {addressError}
                    </div>
                  )}

                  {!addressLoading && addresses.length > 0 && (
                    <div className="checkout-addresses">
                      {addresses.map((savedAddress) => {
                        const isSelected =
                          String(selectedAddressId) ===
                          String(savedAddress._id);

                        return (
                          <label
                            key={savedAddress._id}
                            className={
                              isSelected
                                ? "checkout-address-card checkout-address-card--selected"
                                : "checkout-address-card"
                            }
                          >
                            <input
                              type="radio"
                              name="delivery-address"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedAddressId(savedAddress._id)
                              }
                            />

                            <div className="checkout-address-icon">
                              <MapPin size={19} />
                            </div>

                            <div className="checkout-address-content">
                              <div className="checkout-address-title">
                                <strong>
                                  {savedAddress.label || "Delivery Address"}
                                </strong>

                                {savedAddress.is_default && (
                                  <span>Default</span>
                                )}
                              </div>

                              <p>{formatSavedAddress(savedAddress)}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {!addressLoading && addresses.length === 0 && (
                    <div className="checkout-address-warning">
                      You do not have a saved delivery location yet.
                    </div>
                  )}

                  {!addressLoading && (
                    <button
                      type="button"
                      className="checkout-manual-address-button"
                      onClick={() => navigate("/addresses")}
                    >
                      <Plus size={16} />

                      {addresses.length > 0
                        ? "Add Another Delivery Location"
                        : "Add Delivery Location"}
                    </button>
                  )}
                </section>

                {/* ======================================
                    PAYMENT METHOD
                ====================================== */}

                <section className="checkout-section">
                  <div className="checkout-section-heading">
                    <div className="checkout-section-icon">
                      <WalletCards size={20} />
                    </div>

                    <div>
                      <h2>Payment Method</h2>

                      <p>Add how you want to pay before placing the order.</p>
                    </div>
                  </div>

                  {hasOutstandingBalance && (
                    <div className="checkout-address-warning">
                      You have an outstanding Dish Dash balance of{" "}
                      <strong>{formatCurrency(outstandingBalance)}</strong>.
                    </div>
                  )}

                  {/* SELECTED METHOD */}

                  {paymentMethod && (
                    <div className="checkout-payment-summary">
                      {paymentMethod === "card" && <CreditCard size={18} />}

                      {paymentMethod === "cash" && <Banknote size={18} />}

                      {paymentMethod === "balance" && <WalletCards size={18} />}

                      <div>
                        <strong>{getPaymentLabel()}</strong>

                        <span>
                          {paymentTotalMatches
                            ? "Payment method selected"
                            : "Order total changed — review this payment method again"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* NO METHOD */}

                  {!paymentMethod && (
                    <div className="checkout-address-warning">
                      No payment method has been added yet.
                    </div>
                  )}

                  {/* ======================================
                      ADD / CHANGE METHOD
                  ====================================== */}

                  <button
                    type="button"
                    className="checkout-manage-payment-button"
                    onClick={handlePaymentMethod}
                    disabled={
                      !pricingReady || quoteLoading || hasOutstandingBalance
                    }
                  >
                    <WalletCards size={17} />

                    {paymentMethod
                      ? paymentTotalMatches
                        ? "Change Payment Method"
                        : "Review Payment Method"
                      : "Add Payment Method"}
                  </button>
                </section>
              </div>

              {/* SUMMARY */}

              <aside className="checkout-summary-column">
                <section className="checkout-summary">
                  <div className="checkout-summary-heading">
                    <div className="checkout-summary-icon">
                      <PackageCheck size={21} />
                    </div>

                    <div>
                      <h2>Order Summary</h2>

                      <p>Final order total</p>
                    </div>
                  </div>

                  <div className="checkout-summary-row">
                    <span>Subtotal</span>

                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>

                  <div className="checkout-summary-row">
                    <span>Delivery Fee</span>

                    <strong>
                      {quoteLoading
                        ? "Calculating..."
                        : pricingReady
                          ? formatCurrency(deliveryFee)
                          : "—"}
                    </strong>
                  </div>

                  <div className="checkout-summary-row">
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
                          ? formatCurrency(serviceFee)
                          : "—"}
                    </strong>
                  </div>

                  {pricingReady && deliveryQuote?.route && (
                    <div className="checkout-summary-row">
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

                  {restaurantIds.length > 1 && (
                    <div className="checkout-summary-row">
                      <span>Restaurant pickups</span>

                      <strong>{restaurantIds.length}</strong>
                    </div>
                  )}

                  <div className="checkout-summary-row">
                    <span>Payment</span>

                    <strong>
                      {paymentMethod ? getPaymentLabel() : "Not added"}
                    </strong>
                  </div>

                  <div className="checkout-summary-divider" />

                  <div className="checkout-summary-total">
                    <span>Order Total</span>

                    <strong>
                      {pricingReady ? formatCurrency(total) : "—"}
                    </strong>
                  </div>

                  {quoteError && (
                    <div className="checkout-address-warning">{quoteError}</div>
                  )}

                  {deliveryAddress && (
                    <div className="checkout-summary-address">
                      <MapPin size={16} />

                      <div>
                        <span>Delivering to</span>

                        <strong>{deliveryAddress}</strong>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="checkout-message checkout-message--error">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="checkout-message checkout-message--success">
                      <CheckCircle2 size={17} />

                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="checkout-submit-button"
                    disabled={
                      loading ||
                      addressLoading ||
                      quoteLoading ||
                      !pricingReady ||
                      !selectedAddressId ||
                      !paymentMethodReady ||
                      hasOutstandingBalance
                    }
                  >
                    {loading
                      ? "Starting Order..."
                      : quoteLoading
                        ? "Calculating Delivery..."
                        : !paymentMethod
                          ? "Add Payment Method"
                          : !paymentTotalMatches
                            ? "Review Payment Method"
                            : `Place Order · ${formatCurrency(total)}`}
                  </button>

                  <button
                    type="button"
                    className="checkout-return-cart"
                    onClick={() => navigate("/cart")}
                    disabled={loading}
                  >
                    Back to Cart
                  </button>
                </section>
              </aside>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CheckoutPage;
