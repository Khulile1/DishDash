// ======================================
// IMPORTS
// ======================================

import { useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/PaymentMethodPage.css";

// ======================================
// STORAGE KEYS
// ======================================

const PAYMENT_METHOD_KEY = "checkoutPaymentDetails";

const ORDER_TOTAL_KEY = "checkoutOrderTotal";

// ======================================
// READ SAVED PAYMENT METHOD
// ======================================

const getSavedPaymentMethod = () => {
  try {
    const saved = localStorage.getItem(PAYMENT_METHOD_KEY);

    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not read saved payment method:", error);

    return null;
  }
};

// ======================================
// PAYMENT METHOD PAGE
// ======================================

function PaymentMethodPage() {
  // ======================================
  // ROUTER
  // ======================================

  const navigate = useNavigate();

  const location = useLocation();

  // ======================================
  // PREVIOUS PAYMENT SELECTION
  // ======================================

  const savedPayment = getSavedPaymentMethod();

  // ======================================
  // ORDER TOTAL
  // ======================================

  const savedOrderTotal = Number(localStorage.getItem(ORDER_TOTAL_KEY)) || 0;

  const orderTotal = Number(location.state?.total ?? savedOrderTotal) || 0;

  // ======================================
  // ACCOUNT BALANCE
  // ======================================
  //
  // Temporary local balance.
  //
  // Later this can be replaced with
  // the real customer balance endpoint.
  // ======================================

  const accountBalance =
    Number(localStorage.getItem("dishDashAccountBalance")) || 0;

  const availableCredit = Math.max(0, accountBalance);

  const outstandingBalance = accountBalance < 0 ? Math.abs(accountBalance) : 0;

  const hasOutstandingBalance = outstandingBalance > 0;

  // ======================================
  // INITIAL PAYMENT METHOD
  // ======================================

  const initialMethod =
    savedPayment?.method || location.state?.paymentMethod || "card";

  // ======================================
  // SELECTED METHOD
  // ======================================

  const [selectedMethod, setSelectedMethod] = useState(initialMethod);

  // ======================================
  // PAGE STATE
  // ======================================

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

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
  // METHOD DISPLAY NAME
  // ======================================

  const getMethodLabel = (method) => {
    if (method === "card") {
      return "Card";
    }

    if (method === "cash") {
      return "Cash";
    }

    if (method === "balance") {
      return "Dish Dash Balance";
    }

    return "Payment";
  };

  // ======================================
  // SELECT METHOD
  // ======================================

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);

    setError("");

    setSuccess("");
  };

  // ======================================
  // BACK TO CHECKOUT
  // ======================================

  const handleBack = () => {
    navigate("/checkout");
  };

  // ======================================
  // SAVE PAYMENT METHOD
  // ======================================

  const handleContinue = (event) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    // ======================================
    // ORDER TOTAL
    // ======================================

    if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
      setError(
        "The order total is not available. Return to checkout and try again.",
      );

      return;
    }

    // ======================================
    // OUTSTANDING ACCOUNT BALANCE
    // ======================================

    if (hasOutstandingBalance) {
      setError(
        `You have an outstanding Dish Dash balance of ${formatCurrency(
          outstandingBalance,
        )}. Resolve it before placing another order.`,
      );

      return;
    }

    // ======================================
    // VALID METHOD
    // ======================================

    const allowedMethods = ["cash", "card", "balance"];

    if (!allowedMethods.includes(selectedMethod)) {
      setError("Select a payment method.");

      return;
    }

    // ======================================
    // BALANCE VALIDATION
    // ======================================
    //
    // Balance can only be selected as the
    // main payment method when it covers
    // the full order.
    //
    // Partial balance use can still happen
    // later on the actual payment page.
    // ======================================

    if (selectedMethod === "balance" && availableCredit < orderTotal) {
      setError(
        `Your Dish Dash balance is ${formatCurrency(
          availableCredit,
        )}, which does not fully cover this ${formatCurrency(
          orderTotal,
        )} order. Choose Card or Cash instead.`,
      );

      return;
    }

    // ======================================
    // PAYMENT METHOD SNAPSHOT
    // ======================================
    //
    // This is NOT an actual Payment.
    //
    // We do not capture:
    //
    // - card number
    // - CVV
    // - expiry
    // - cash tender amount
    //
    // Those happen after the order review.
    // ======================================

    const paymentMethodDetails = {
      section: selectedMethod,

      method: selectedMethod,

      orderTotal: Number(orderTotal.toFixed(2)),

      balanceUsed: 0,

      remainingToPay: Number(orderTotal.toFixed(2)),

      amountDue: Number(orderTotal.toFixed(2)),

      paymentStatus: "method_selected",

      captureAfterOrder: true,
    };

    // ======================================
    // SAVE
    // ======================================

    try {
      localStorage.setItem(
        PAYMENT_METHOD_KEY,

        JSON.stringify(paymentMethodDetails),
      );

      localStorage.setItem(
        ORDER_TOTAL_KEY,

        String(orderTotal),
      );
    } catch (storageError) {
      console.error("Could not save payment method:", storageError);

      setError("Could not save your payment method.");

      return;
    }

    // ======================================
    // SUCCESS
    // ======================================

    setSuccess(`${getMethodLabel(selectedMethod)} selected.`);

    // ======================================
    // RETURN TO CHECKOUT
    // ======================================

    window.setTimeout(
      () => {
        navigate("/checkout", {
          replace: true,

          state: {
            paymentMethod: selectedMethod,
          },
        });
      },

      300,
    );
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="payment-method-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="payment-method-page">
        <div className="payment-method-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="payment-method-back"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />

            <span>Back to Checkout</span>
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="payment-method-header mobile-page-header">
            <div className="payment-method-header-content">
              <span className="payment-method-eyebrow">
                <WalletCards size={16} />
                Dish Dash Payment
              </span>

              <h1>Payment Method</h1>

              <p>
                Choose how you intend to pay. Actual payment details will be
                completed after your order has been created and reviewed.
              </p>
            </div>

            <div className="payment-method-total">
              <span>Order Total</span>

              <strong>{formatCurrency(orderTotal)}</strong>
            </div>
          </section>

          {/* ======================================
              OUTSTANDING BALANCE
          ====================================== */}

          {hasOutstandingBalance && (
            <section className="payment-method-warning">
              <div className="payment-method-warning-icon">
                <AlertCircle size={24} />
              </div>

              <div>
                <span>Outstanding Balance</span>

                <strong>{formatCurrency(outstandingBalance)}</strong>

                <p>
                  Your outstanding Dish Dash balance must be resolved before you
                  can place another order.
                </p>
              </div>
            </section>
          )}

          {/* ======================================
              AVAILABLE BALANCE
          ====================================== */}

          {!hasOutstandingBalance && (
            <section className="payment-method-balance">
              <div className="payment-method-balance-icon">
                <WalletCards size={21} />
              </div>

              <div className="payment-method-balance-copy">
                <span>Dish Dash Balance</span>

                <strong>{formatCurrency(availableCredit)}</strong>
              </div>

              <p>
                {availableCredit > 0
                  ? "You have account credit available."
                  : "You currently have no Dish Dash credit."}
              </p>
            </section>
          )}

          {/* ======================================
              PAYMENT FORM
          ====================================== */}

          <form onSubmit={handleContinue} className="payment-method-form">
            <section className="payment-method-card">
              {/* ======================================
                  HEADING
              ====================================== */}

              <div className="payment-method-section-heading">
                <div>
                  <span>Payment</span>

                  <h2>Choose how to pay</h2>

                  <p>Select one option below.</p>
                </div>
              </div>

              {/* ======================================
                  OPTIONS
              ====================================== */}

              <div className="payment-method-grid">
                {/* ======================================
                    CARD
                ====================================== */}

                <button
                  type="button"
                  className={`payment-method-option ${
                    selectedMethod === "card"
                      ? "payment-method-option--selected"
                      : ""
                  }`}
                  onClick={() => handleSelectMethod("card")}
                >
                  <span className="payment-method-option-icon">
                    <CreditCard size={24} />
                  </span>

                  <span className="payment-method-option-copy">
                    <strong>Card</strong>

                    <small>Debit or Credit</small>
                  </span>

                  <span className="payment-method-radio">
                    <span />
                  </span>
                </button>

                {/* ======================================
                    CASH
                ====================================== */}

                <button
                  type="button"
                  className={`payment-method-option ${
                    selectedMethod === "cash"
                      ? "payment-method-option--selected"
                      : ""
                  }`}
                  onClick={() => handleSelectMethod("cash")}
                >
                  <span className="payment-method-option-icon">
                    <Banknote size={24} />
                  </span>

                  <span className="payment-method-option-copy">
                    <strong>Cash</strong>

                    <small>Pay on delivery</small>
                  </span>

                  <span className="payment-method-radio">
                    <span />
                  </span>
                </button>

                {/* ======================================
                    BALANCE
                ====================================== */}

                <button
                  type="button"
                  className={`payment-method-option ${
                    selectedMethod === "balance"
                      ? "payment-method-option--selected"
                      : ""
                  }`}
                  onClick={() => handleSelectMethod("balance")}
                >
                  <span className="payment-method-option-icon">
                    <WalletCards size={24} />
                  </span>

                  <span className="payment-method-option-copy">
                    <strong>Balance</strong>

                    <small>{formatCurrency(availableCredit)} available</small>
                  </span>

                  <span className="payment-method-radio">
                    <span />
                  </span>
                </button>
              </div>
            </section>

            {/* ======================================
                SELECTED METHOD INFO
            ====================================== */}

            <section className="payment-method-card payment-method-card--selection">
              {selectedMethod === "card" && (
                <>
                  <div className="payment-method-selection-icon">
                    <CreditCard size={22} />
                  </div>

                  <div className="payment-method-selection-copy">
                    <strong>Card selected</strong>

                    <p>
                      Your card number, expiry date and security details will be
                      entered only after the 10-second order review.
                    </p>
                  </div>
                </>
              )}

              {selectedMethod === "cash" && (
                <>
                  <div className="payment-method-selection-icon">
                    <Banknote size={22} />
                  </div>

                  <div className="payment-method-selection-copy">
                    <strong>Cash selected</strong>

                    <p>
                      After the order review, you will confirm the cash amount
                      you intend to pay on delivery.
                    </p>
                  </div>
                </>
              )}

              {selectedMethod === "balance" && (
                <>
                  <div className="payment-method-selection-icon">
                    <WalletCards size={22} />
                  </div>

                  <div className="payment-method-selection-copy">
                    <strong>Dish Dash Balance selected</strong>

                    <p>
                      {availableCredit >= orderTotal
                        ? `Your ${formatCurrency(
                            availableCredit,
                          )} balance can cover this order.`
                        : `Your ${formatCurrency(
                            availableCredit,
                          )} balance does not fully cover the ${formatCurrency(
                            orderTotal,
                          )} order.`}
                    </p>
                  </div>
                </>
              )}
            </section>

            {/* ======================================
                ERROR
            ====================================== */}

            {error && (
              <div className="payment-method-message payment-method-message--error">
                <AlertCircle size={18} />

                <span>{error}</span>
              </div>
            )}

            {/* ======================================
                SUCCESS
            ====================================== */}

            {success && (
              <div className="payment-method-message payment-method-message--success">
                <CheckCircle2 size={18} />

                <span>{success}</span>
              </div>
            )}

            {/* ======================================
                ACTIONS
            ====================================== */}

            <div className="payment-method-actions">
              <button
                type="button"
                className="payment-method-cancel"
                onClick={handleBack}
              >
                Back
              </button>

              <button
                type="submit"
                className="payment-method-save"
                disabled={hasOutstandingBalance}
              >
                <CheckCircle2 size={18} />

                <span>Use {getMethodLabel(selectedMethod)}</span>
              </button>
            </div>
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

export default PaymentMethodPage;
