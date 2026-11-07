// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { findOrder } from "../../services/orderService";

import { processOrderPayment } from "../../services/paymentService";

import "../../styles/OrderPaymentPage.css";

// ======================================
// ORDER PAYMENT PAGE
// ======================================

function OrderPaymentPage() {
  // ======================================
  // ROUTER
  // ======================================

  const navigate = useNavigate();

  const location = useLocation();

  const { orderId } = useParams();

  // ======================================
  // ORDER
  // ======================================

  const [order, setOrder] = useState(location.state?.order || null);

  // ======================================
  // ORDER ITEMS
  // ======================================

  const [orderItems, setOrderItems] = useState([]);

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // PAYMENT METHOD
  // ======================================

  const [selectedMethod, setSelectedMethod] = useState(
    location.state?.order?.payment_method || "card",
  );

  // ======================================
  // DISH DASH BALANCE
  // ======================================
  //
  // Temporary localStorage balance.
  //
  // Later replace this with:
  //
  // GET /api/balance
  // ======================================

  const accountBalance =
    Number(localStorage.getItem("dishDashAccountBalance")) || 0;

  const availableCredit = Math.max(0, accountBalance);

  const amountOwed = accountBalance < 0 ? Math.abs(accountBalance) : 0;

  const hasOutstandingDebt = amountOwed > 0;

  // ======================================
  // USE BALANCE
  // ======================================

  const [useBalance, setUseBalance] = useState(false);

  const [balanceAmount, setBalanceAmount] = useState("");

  // ======================================
  // CARD
  // ======================================

  const [cardType, setCardType] = useState("debit");

  const [cardholderName, setCardholderName] = useState("");

  const [cardNumber, setCardNumber] = useState("");

  const [expiryMonth, setExpiryMonth] = useState("");

  const [expiryYear, setExpiryYear] = useState("");

  const [cvv, setCvv] = useState("");

  // ======================================
  // CASH
  // ======================================

  const [cashOption, setCashOption] = useState("exact");

  const [customCashAmount, setCustomCashAmount] = useState("");

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
  // LOAD ORDER
  // ======================================

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      // ======================================
      // ORDER ID
      // ======================================

      if (!orderId) {
        setError("Order ID is missing.");

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        // ======================================
        // GET ORDER FROM BACKEND
        // ======================================

        const response = await findOrder(orderId);

        const loadedOrder = response?.order || response;

        const loadedOrderItems = Array.isArray(response?.orderItems)
          ? response.orderItems
          : [];

        if (!active) {
          return;
        }

        if (!loadedOrder) {
          setError("Order not found.");

          return;
        }

        // ======================================
        // ALREADY CONFIRMED
        // ======================================

        if (loadedOrder.status === "confirmed") {
          navigate("/orders", {
            replace: true,
          });

          return;
        }

        // ======================================
        // MUST BE READY FOR PAYMENT
        // ======================================

        if (loadedOrder.status !== "awaiting_payment") {
          setError(
            `This order cannot be paid from status "${loadedOrder.status}".`,
          );
        }

        setOrder(loadedOrder);

        setOrderItems(loadedOrderItems);

        // ======================================
        // USE METHOD SELECTED AT CHECKOUT
        // ======================================

        if (loadedOrder.payment_method) {
          setSelectedMethod(loadedOrder.payment_method);
        }
      } catch (requestError) {
        console.error("Could not load order for payment:", requestError);

        if (!active) {
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Could not load the order for payment.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId, navigate]);

  // ======================================
  // ORDER TOTAL
  // ======================================

  const orderTotal = Number(order?.total_price || 0);

  // ======================================
  // MAX BALANCE
  // ======================================

  const maximumBalanceUsable = Math.min(availableCredit, orderTotal);

  // ======================================
  // REQUESTED BALANCE
  // ======================================

  const requestedBalance = Number(balanceAmount);

  // ======================================
  // APPLIED BALANCE
  // ======================================

  const appliedBalance =
    useBalance && Number.isFinite(requestedBalance)
      ? Math.min(
          Math.max(requestedBalance, 0),

          maximumBalanceUsable,
        )
      : 0;

  // ======================================
  // REMAINING AMOUNT
  // ======================================

  const amountRemaining = Math.max(
    0,

    Number((orderTotal - appliedBalance).toFixed(2)),
  );

  // ======================================
  // REMAINING CREDIT
  // ======================================

  const remainingCredit = Math.max(
    0,

    Number((availableCredit - appliedBalance).toFixed(2)),
  );

  // ======================================
  // BALANCE COVERS ORDER
  // ======================================

  const balanceCoversOrder = orderTotal > 0 && amountRemaining === 0;

  // ======================================
  // TOTAL ITEMS
  // ======================================

  const totalItems = useMemo(() => {
    if (orderItems.length > 0) {
      return orderItems.reduce(
        (total, item) =>
          total +
          Math.max(
            1,

            Number(item.quantity || 1),
          ),

        0,
      );
    }

    const restaurantOrders = Array.isArray(order?.restaurant_orders)
      ? order.restaurant_orders
      : [];

    return restaurantOrders.reduce(
      (total, restaurantOrder) => {
        const items = Array.isArray(restaurantOrder.items)
          ? restaurantOrder.items
          : [];

        return (
          total +
          items.reduce(
            (itemTotal, item) =>
              itemTotal +
              Math.max(
                1,

                Number(item.quantity || 1),
              ),

            0,
          )
        );
      },

      0,
    );
  }, [order, orderItems]);

  // ======================================
  // FORMAT CARD NUMBER
  // ======================================

  const formatCardNumber = (value) => {
    const digits = String(value).replace(/\D/g, "").slice(0, 19);

    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  // ======================================
  // CARD NUMBER CHANGE
  // ======================================

  const handleCardNumberChange = (event) => {
    setCardNumber(formatCardNumber(event.target.value));
  };

  // ======================================
  // CVV
  // ======================================

  const handleCvvChange = (event) => {
    setCvv(event.target.value.replace(/\D/g, "").slice(0, 4));
  };

  // ======================================
  // CARD BRAND
  // ======================================

  const getCardBrand = (value) => {
    const number = String(value).replace(/\D/g, "");

    if (/^4/.test(number)) {
      return "Visa";
    }

    if (/^5[1-5]/.test(number)) {
      return "Mastercard";
    }

    const firstFour = Number(number.slice(0, 4));

    if (firstFour >= 2221 && firstFour <= 2720) {
      return "Mastercard";
    }

    if (/^3[47]/.test(number)) {
      return "American Express";
    }

    return "Card";
  };

  const cardBrand = getCardBrand(cardNumber);

  // ======================================
  // LUHN CHECK
  // ======================================

  const passesLuhnCheck = (value) => {
    const number = String(value).replace(/\D/g, "");

    if (number.length < 13 || number.length > 19) {
      return false;
    }

    let total = 0;

    let doubleDigit = false;

    for (let index = number.length - 1; index >= 0; index -= 1) {
      let digit = Number(number[index]);

      if (doubleDigit) {
        digit *= 2;

        if (digit > 9) {
          digit -= 9;
        }
      }

      total += digit;

      doubleDigit = !doubleDigit;
    }

    return total % 10 === 0;
  };

  // ======================================
  // EXPIRY CHECK
  // ======================================

  const isExpiryValid = () => {
    const month = Number(expiryMonth);

    const year = Number(expiryYear);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return false;
    }

    if (!Number.isInteger(year)) {
      return false;
    }

    const now = new Date();

    const currentMonth = now.getMonth() + 1;

    const currentYear = now.getFullYear();

    if (year < currentYear) {
      return false;
    }

    if (year === currentYear && month < currentMonth) {
      return false;
    }

    return true;
  };

  // ======================================
  // VALIDATE CARD
  // ======================================

  const validateCard = () => {
    // ======================================
    // CARD TYPE
    // ======================================

    if (!["debit", "credit"].includes(cardType)) {
      setError("Select Debit or Credit card.");

      return null;
    }

    // ======================================
    // CARDHOLDER
    // ======================================

    if (!cardholderName.trim()) {
      setError("Cardholder name is required.");

      return null;
    }

    // ======================================
    // CARD NUMBER
    // ======================================

    const cleanNumber = cardNumber.replace(/\D/g, "");

    if (!passesLuhnCheck(cleanNumber)) {
      setError("Enter a valid card number.");

      return null;
    }

    // ======================================
    // EXPIRY
    // ======================================

    if (!isExpiryValid()) {
      setError("Enter a valid card expiry date.");

      return null;
    }

    // ======================================
    // CVV
    // ======================================

    if (cvv.length < 3 || cvv.length > 4) {
      setError("Enter a valid CVV.");

      return null;
    }

    return {
      cleanNumber,
    };
  };

  // ======================================
  // CASH AMOUNT
  // ======================================

  const getCashAmount = () => {
    if (cashOption === "exact") {
      return amountRemaining;
    }

    if (cashOption === "custom") {
      return Number(customCashAmount);
    }

    return Number(cashOption);
  };

  const cashAmount = getCashAmount();

  // ======================================
  // CASH CHANGE
  // ======================================

  const cashChange = Number.isFinite(cashAmount)
    ? Math.max(
        0,

        Number((cashAmount - amountRemaining).toFixed(2)),
      )
    : 0;

  // ======================================
  // USE MAX BALANCE
  // ======================================

  const handleUseMaximumBalance = () => {
    setUseBalance(true);

    setBalanceAmount(String(maximumBalanceUsable));

    setError("");
  };

  // ======================================
  // SELECT PAYMENT METHOD
  // ======================================

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);

    setError("");

    setSuccess("");
  };

  // ======================================
  // BUILD PAYMENT REQUEST
  // ======================================

  const buildPaymentPayload = () => {
    // ======================================
    // BALANCE ONLY
    // ======================================

    if (selectedMethod === "balance") {
      if (!balanceCoversOrder) {
        setError(
          "Your Dish Dash balance does not fully cover this order. Choose Card or Cash.",
        );

        return null;
      }

      return {
        order_id: orderId,

        method: "balance",

        balance_used: appliedBalance,

        payment_details: {
          method: "balance",

          balanceUsed: appliedBalance,

          remainingToPay: 0,

          amountDue: 0,
        },
      };
    }

    // ======================================
    // CASH
    // ======================================

    if (selectedMethod === "cash") {
      const amount = getCashAmount();

      if (!Number.isFinite(amount) || amount < amountRemaining) {
        setError(
          `Cash amount must be at least ${formatCurrency(amountRemaining)}.`,
        );

        return null;
      }

      return {
        order_id: orderId,

        method: "cash",

        balance_used: appliedBalance,

        payment_details: {
          method: "cash",

          balanceUsed: appliedBalance,

          remainingToPay: amountRemaining,

          amountDue: amountRemaining,

          tenderAmount: Number(amount.toFixed(2)),

          changeDue: Number((amount - amountRemaining).toFixed(2)),
        },
      };
    }

    // ======================================
    // CARD
    // ======================================

    if (selectedMethod === "card") {
      const result = validateCard();

      if (!result) {
        return null;
      }

      const { cleanNumber } = result;

      // ======================================
      // IMPORTANT
      // ======================================
      //
      // Full card number and CVV are NOT
      // included in the request to your
      // MongoDB backend.
      //
      // Later the real payment gateway will
      // tokenize the card first.
      // ======================================

      return {
        order_id: orderId,

        method: "card",

        balance_used: appliedBalance,

        payment_details: {
          method: "card",

          cardBrand,

          cardType,

          last4: cleanNumber.slice(-4),

          expiryMonth: String(expiryMonth).padStart(2, "0"),

          expiryYear: String(expiryYear),

          balanceUsed: appliedBalance,

          remainingToPay: amountRemaining,

          amountDue: amountRemaining,
        },
      };
    }

    setError("Select a payment method.");

    return null;
  };

  // ======================================
  // PROCESS PAYMENT
  // ======================================

  const handlePayment = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    setSuccess("");

    // ======================================
    // ORDER
    // ======================================

    if (!order) {
      setError("Order information is unavailable.");

      return;
    }

    // ======================================
    // STATUS
    // ======================================

    if (order.status !== "awaiting_payment") {
      setError(`This order cannot be paid from status "${order.status}".`);

      return;
    }

    // ======================================
    // ACCOUNT DEBT
    // ======================================

    if (hasOutstandingDebt) {
      setError(
        `You have an outstanding Dish Dash balance of ${formatCurrency(
          amountOwed,
        )}.`,
      );

      return;
    }

    // ======================================
    // PAYMENT PAYLOAD
    // ======================================

    const paymentPayload = buildPaymentPayload();

    if (!paymentPayload) {
      return;
    }

    try {
      setSubmitting(true);

      // ======================================
      // BACKEND PAYMENT
      // ======================================

      const response = await processOrderPayment(paymentPayload);

      // ======================================
      // SUCCESS
      // ======================================

      setSuccess(response?.message || "Payment completed successfully.");

      // ======================================
      // UPDATE TEMP BALANCE
      // ======================================

      if (appliedBalance > 0) {
        localStorage.setItem(
          "dishDashAccountBalance",

          String(remainingCredit),
        );
      }

      // ======================================
      // CLEAR CHECKOUT DATA
      // ======================================

      localStorage.removeItem("checkoutPaymentDetails");

      localStorage.removeItem("checkoutOrderTotal");

      localStorage.removeItem("pendingOrderConfirmation");

      localStorage.removeItem("pendingOrderEdit");

      // ======================================
      // CLEAR CARD DATA
      // ======================================

      setCardNumber("");

      setCvv("");

      // ======================================
      // REDIRECT
      // ======================================
      //
      // We currently use /orders because
      // OrderDetailsPage is not registered
      // yet.
      // ======================================

      window.setTimeout(
        () => {
          navigate("/orders", {
            replace: true,

            state: {
              paymentCompleted: true,

              order: response?.order || null,

              payment: response?.payment || null,
            },
          });
        },

        600,
      );
    } catch (paymentError) {
      console.error("Payment failed:", paymentError);

      setError(
        paymentError.response?.data?.message ||
          "Payment could not be processed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================
  // LOADING
  // ======================================

  if (loading) {
    return (
      <div className="payment-details-layout">
        <Navbar />

        <main className="payment-details-page">
          <div className="payment-details-container">
            <section className="payment-details-card">
              <div className="payment-details-section-heading">
                <LoaderCircle size={28} className="payment-details-spin" />

                <h2>Loading payment</h2>

                <p>Loading your order information.</p>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ======================================
  // NO ORDER
  // ======================================

  if (!order) {
    return (
      <div className="payment-details-layout">
        <Navbar />

        <main className="payment-details-page">
          <div className="payment-details-container">
            <section className="payment-details-card">
              <div className="payment-details-section-heading">
                <AlertCircle size={28} />

                <h2>Payment unavailable</h2>

                <p>{error || "Order information is unavailable."}</p>
              </div>

              <button
                type="button"
                className="payment-details-save"
                onClick={() => navigate("/orders")}
              >
                View My Orders
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
    <div className="payment-details-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          PAGE
      ====================================== */}

      <main className="payment-details-page">
        <div className="payment-details-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="payment-details-back"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft size={18} />
            My Orders
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="payment-details-header mobile-page-header">
            <span className="payment-details-eyebrow">
              <WalletCards size={16} />
              Dish Dash Payment
            </span>

            <h1>Complete Payment</h1>

            <p>
              Order #{order.order_number}
              {" · "}
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>

            <div className="payment-details-total">
              <span>Order Total</span>

              <strong>{formatCurrency(orderTotal)}</strong>
            </div>
          </section>

          {/* ======================================
              STATUS ERROR
          ====================================== */}

          {order.status !== "awaiting_payment" && (
            <section className="payment-debt-warning">
              <AlertCircle size={26} />

              <div>
                <span>Order Status</span>

                <strong>{order.status}</strong>

                <p>This order is not currently ready for payment.</p>
              </div>
            </section>
          )}

          {/* ======================================
              ACCOUNT DEBT
          ====================================== */}

          {hasOutstandingDebt && (
            <section className="payment-debt-warning">
              <AlertCircle size={26} />

              <div>
                <span>Outstanding Balance</span>

                <strong>{formatCurrency(amountOwed)}</strong>

                <p>Your outstanding Dish Dash balance must be resolved.</p>
              </div>
            </section>
          )}

          {/* ======================================
              ACCOUNT CREDIT
          ====================================== */}

          {!hasOutstandingDebt && (
            <section className="payment-balance-summary">
              <div>
                <span>Dish Dash Balance</span>

                <strong>{formatCurrency(availableCredit)}</strong>
              </div>

              <p>
                {availableCredit > 0
                  ? "You can optionally apply account credit to this payment."
                  : "You currently have no Dish Dash credit."}
              </p>
            </section>
          )}

          {/* ======================================
              ORDER SUMMARY
          ====================================== */}

          <section className="payment-details-card">
            <div className="payment-details-section-heading">
              <ReceiptText size={22} />

              <div>
                <h2>Order Summary</h2>

                <p>Order #{order.order_number}</p>
              </div>
            </div>

            <div className="payment-balance-box">
              <div>
                <span>Subtotal</span>

                <strong>{formatCurrency(order.subtotal)}</strong>
              </div>

              <div>
                <span>Delivery</span>

                <strong>{formatCurrency(order.delivery_fee)}</strong>
              </div>

              <div>
                <span>Service Fee</span>

                <strong>{formatCurrency(order.service_fee)}</strong>
              </div>

              <div>
                <span>Total</span>

                <strong>{formatCurrency(orderTotal)}</strong>
              </div>
            </div>
          </section>

          {/* ======================================
              PAYMENT METHODS
          ====================================== */}

          <section className="payment-details-card">
            <div className="payment-details-section-heading">
              <h2>Payment Method</h2>

              <p>Choose how you want to pay this order.</p>
            </div>

            <div className="payment-method-grid payment-method-grid--three">
              {/* CARD */}

              <button
                type="button"
                className={`payment-method-option ${
                  selectedMethod === "card"
                    ? "payment-method-option--selected"
                    : ""
                }`}
                onClick={() => handleSelectMethod("card")}
              >
                <CreditCard size={23} />

                <div>
                  <strong>Card</strong>

                  <span>Debit / Credit</span>
                </div>
              </button>

              {/* CASH */}

              <button
                type="button"
                className={`payment-method-option ${
                  selectedMethod === "cash"
                    ? "payment-method-option--selected"
                    : ""
                }`}
                onClick={() => handleSelectMethod("cash")}
              >
                <Banknote size={23} />

                <div>
                  <strong>Cash</strong>

                  <span>Pay on delivery</span>
                </div>
              </button>

              {/* BALANCE */}

              <button
                type="button"
                className={`payment-method-option ${
                  selectedMethod === "balance"
                    ? "payment-method-option--selected"
                    : ""
                }`}
                onClick={() => handleSelectMethod("balance")}
              >
                <WalletCards size={23} />

                <div>
                  <strong>Balance</strong>

                  <span>{formatCurrency(availableCredit)}</span>
                </div>
              </button>
            </div>
          </section>

          {/* ======================================
              PAYMENT FORM
          ====================================== */}

          <form onSubmit={handlePayment}>
            {/* ======================================
                OPTIONAL BALANCE
            ====================================== */}

            {selectedMethod !== "balance" && availableCredit > 0 && (
              <section className="payment-details-card">
                <div className="payment-details-section-heading">
                  <h2>Dish Dash Credit</h2>

                  <p>
                    Optionally apply your balance before paying the remainder.
                  </p>
                </div>

                <label className="payment-balance-toggle">
                  <input
                    type="checkbox"
                    checked={useBalance}
                    onChange={(event) => {
                      const checked = event.target.checked;

                      setUseBalance(checked);

                      setBalanceAmount(
                        checked ? String(maximumBalanceUsable) : "",
                      );
                    }}
                  />

                  <span>Use Dish Dash credit</span>
                </label>

                {useBalance && (
                  <>
                    <div className="payment-details-field">
                      <label>Amount to use</label>

                      <input
                        type="number"
                        min="0"
                        max={maximumBalanceUsable}
                        step="0.01"
                        value={balanceAmount}
                        onChange={(event) =>
                          setBalanceAmount(event.target.value)
                        }
                      />

                      <button
                        type="button"
                        className="payment-use-full-balance"
                        onClick={handleUseMaximumBalance}
                      >
                        Use {formatCurrency(maximumBalanceUsable)}
                      </button>
                    </div>

                    <div className="payment-balance-result">
                      <div>
                        <span>Credit applied</span>

                        <strong>-{formatCurrency(appliedBalance)}</strong>
                      </div>

                      <div>
                        <span>Remaining</span>

                        <strong>{formatCurrency(amountRemaining)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ======================================
                CARD
            ====================================== */}

            {selectedMethod === "card" && (
              <section className="payment-details-card">
                <div className="payment-details-section-heading">
                  <CreditCard size={22} />

                  <div>
                    <h2>Card Payment</h2>

                    <p>
                      Amount due:{" "}
                      <strong>{formatCurrency(amountRemaining)}</strong>
                    </p>
                  </div>
                </div>

                {/* CARD TYPE */}

                <div className="payment-card-type-grid">
                  <label
                    className={`payment-card-type ${
                      cardType === "debit" ? "payment-card-type--selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="card-type"
                      value="debit"
                      checked={cardType === "debit"}
                      onChange={() => setCardType("debit")}
                    />
                    <CreditCard size={20} />
                    Debit Card
                  </label>

                  <label
                    className={`payment-card-type ${
                      cardType === "credit" ? "payment-card-type--selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="card-type"
                      value="credit"
                      checked={cardType === "credit"}
                      onChange={() => setCardType("credit")}
                    />
                    <CreditCard size={20} />
                    Credit Card
                  </label>
                </div>

                {/* CARDHOLDER */}

                <div className="payment-details-field">
                  <label>Cardholder Name</label>

                  <input
                    type="text"
                    autoComplete="cc-name"
                    placeholder="Name on card"
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                  />
                </div>

                {/* CARD NUMBER */}

                <div className="payment-details-field">
                  <label>Card Number</label>

                  <div className="payment-card-number-wrapper">
                    <CreditCard size={19} />

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                    />

                    <span>{cardBrand}</span>
                  </div>
                </div>

                {/* EXPIRY */}

                <div className="payment-details-row">
                  {/* MONTH */}

                  <div className="payment-details-field">
                    <label>Month</label>

                    <select
                      value={expiryMonth}
                      onChange={(event) => setExpiryMonth(event.target.value)}
                    >
                      <option value="">MM</option>

                      {Array.from(
                        {
                          length: 12,
                        },

                        (_, index) => {
                          const month = String(index + 1).padStart(2, "0");

                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        },
                      )}
                    </select>
                  </div>

                  {/* YEAR */}

                  <div className="payment-details-field">
                    <label>Year</label>

                    <select
                      value={expiryYear}
                      onChange={(event) => setExpiryYear(event.target.value)}
                    >
                      <option value="">YYYY</option>

                      {Array.from(
                        {
                          length: 12,
                        },

                        (_, index) => {
                          const year = new Date().getFullYear() + index;

                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        },
                      )}
                    </select>
                  </div>

                  {/* CVV */}

                  <div className="payment-details-field">
                    <label>CVV</label>

                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                    />
                  </div>
                </div>

                {/* SECURITY */}

                <div className="payment-security-note">
                  <LockKeyhole size={20} />

                  <span>
                    Full card number and CVV are not saved to MongoDB.
                  </span>
                </div>
              </section>
            )}

            {/* ======================================
                CASH
            ====================================== */}

            {selectedMethod === "cash" && (
              <section className="payment-details-card">
                <div className="payment-details-section-heading">
                  <Banknote size={22} />

                  <div>
                    <h2>Cash on Delivery</h2>

                    <p>
                      Amount due:{" "}
                      <strong>{formatCurrency(amountRemaining)}</strong>
                    </p>
                  </div>
                </div>

                {/* EXACT */}

                <label className="payment-cash-option">
                  <input
                    type="radio"
                    name="cash-option"
                    value="exact"
                    checked={cashOption === "exact"}
                    onChange={() => setCashOption("exact")}
                  />

                  <Banknote size={20} />

                  <div>
                    <strong>Exact Amount</strong>

                    <span>{formatCurrency(amountRemaining)}</span>
                  </div>
                </label>

                {/* NOTES */}

                <div className="payment-cash-notes">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      disabled={amount < amountRemaining}
                      className={
                        cashOption === String(amount)
                          ? "payment-cash-note payment-cash-note--selected"
                          : "payment-cash-note"
                      }
                      onClick={() => setCashOption(String(amount))}
                    >
                      R{amount}
                    </button>
                  ))}
                </div>

                {/* CUSTOM */}

                <label className="payment-cash-option">
                  <input
                    type="radio"
                    name="cash-option"
                    value="custom"
                    checked={cashOption === "custom"}
                    onChange={() => setCashOption("custom")}
                  />

                  <Banknote size={20} />

                  <div className="payment-cash-custom">
                    <strong>Other Amount</strong>

                    {cashOption === "custom" && (
                      <input
                        type="number"
                        min={amountRemaining}
                        step="0.01"
                        value={customCashAmount}
                        onChange={(event) =>
                          setCustomCashAmount(event.target.value)
                        }
                      />
                    )}
                  </div>
                </label>

                {/* CASH SUMMARY */}

                {Number.isFinite(cashAmount) &&
                  cashAmount >= amountRemaining && (
                    <div className="payment-cash-summary">
                      <div>
                        <span>Customer pays</span>

                        <strong>{formatCurrency(cashAmount)}</strong>
                      </div>

                      <div>
                        <span>Change due</span>

                        <strong>{formatCurrency(cashChange)}</strong>
                      </div>
                    </div>
                  )}
              </section>
            )}

            {/* ======================================
                BALANCE
            ====================================== */}

            {selectedMethod === "balance" && (
              <section className="payment-details-card">
                <div className="payment-details-section-heading">
                  <WalletCards size={22} />

                  <div>
                    <h2>Dish Dash Balance</h2>

                    <p>Pay using your account credit.</p>
                  </div>
                </div>

                <div className="payment-balance-box">
                  <div>
                    <span>Available</span>

                    <strong>{formatCurrency(availableCredit)}</strong>
                  </div>

                  <div>
                    <span>Order Total</span>

                    <strong>{formatCurrency(orderTotal)}</strong>
                  </div>
                </div>

                {availableCredit >= orderTotal ? (
                  <div className="payment-details-message payment-details-message--success">
                    <CheckCircle2 size={17} />
                    Your balance fully covers this order.
                  </div>
                ) : (
                  <div className="payment-details-message payment-details-message--error">
                    <AlertCircle size={17} />
                    Your balance does not fully cover this order.
                  </div>
                )}

                {availableCredit >= orderTotal && (
                  <button
                    type="button"
                    className="payment-use-full-balance"
                    onClick={() => {
                      setUseBalance(true);

                      setBalanceAmount(String(orderTotal));

                      setError("");
                    }}
                  >
                    Use {formatCurrency(orderTotal)}
                  </button>
                )}
              </section>
            )}

            {/* ======================================
                ERROR
            ====================================== */}

            {error && (
              <div className="payment-details-message payment-details-message--error">
                <AlertCircle size={17} />

                {error}
              </div>
            )}

            {/* ======================================
                SUCCESS
            ====================================== */}

            {success && (
              <div className="payment-details-message payment-details-message--success">
                <CheckCircle2 size={17} />

                {success}
              </div>
            )}

            {/* ======================================
                PAY BUTTON
            ====================================== */}

            <button
              type="submit"
              className="payment-details-save"
              disabled={
                submitting ||
                hasOutstandingDebt ||
                order.status !== "awaiting_payment"
              }
            >
              {submitting ? (
                <LoaderCircle size={18} className="payment-details-spin" />
              ) : (
                <LockKeyhole size={18} />
              )}

              {submitting
                ? "Processing..."
                : selectedMethod === "cash"
                  ? "Confirm Cash on Delivery"
                  : selectedMethod === "balance"
                    ? `Pay ${formatCurrency(orderTotal)} With Balance`
                    : `Pay ${formatCurrency(amountRemaining)}`}
            </button>
          </form>
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

export default OrderPaymentPage;
