// ======================================
// REACT
// ======================================

import { useState } from "react";

// ======================================
// REACT ROUTER
// ======================================

import { Link } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";

// ======================================
// SERVICES
// ======================================

import { forgotPassword } from "../../services/authService";

// ======================================
// POPUP CONTEXT
// ======================================

import { usePopup } from "../../context/PopupContext";

// ======================================
// ASSETS
// ======================================

import logo from "../../assets/DishDash.png";

// ======================================
// STYLES
// ======================================

import "../../styles/AuthPages.css";

// ======================================
// GMAIL VALIDATION
// ======================================

const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

// ======================================
// FORGOT PASSWORD PAGE
// ======================================

function ForgotPassword() {
  const { showError } = usePopup();

  // ======================================
  // STATE
  // ======================================

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [emailSent, setEmailSent] = useState(false);

  // ======================================
  // SUBMIT
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ======================================
    // PREVENT DUPLICATE REQUESTS
    // ======================================

    if (loading) {
      return;
    }

    // ======================================
    // CLEAN EMAIL
    // ======================================

    const cleanEmail = email.trim().toLowerCase();

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!cleanEmail) {
      showError({
        title: "Email required",

        message: "Enter the Gmail address connected to your Dish Dash account.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // CHECK GMAIL FORMAT
    // ======================================

    if (!GMAIL_PATTERN.test(cleanEmail)) {
      showError({
        title: "Invalid Gmail address",

        message: "Enter a valid Gmail address ending in @gmail.com.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // START REQUEST
    // ======================================

    setLoading(true);

    try {
      // ======================================
      // CALL BACKEND
      // ======================================

      const response = await forgotPassword(cleanEmail);

      // ======================================
      // DEBUG SUCCESS RESPONSE
      // ======================================

      console.log("FORGOT PASSWORD SUCCESS:", response);

      // ======================================
      // SAVE CLEAN EMAIL
      // ======================================

      setEmail(cleanEmail);

      // ======================================
      // SHOW EMAIL SENT SCREEN
      // ======================================

      setEmailSent(true);
    } catch (error) {
      // ======================================
      // DEBUG
      // ======================================

      console.error("FORGOT PASSWORD ERROR:", error);

      console.error("BACKEND RESPONSE:", error?.response?.data);

      console.error("BACKEND STATUS:", error?.response?.status);

      console.error(
        "REQUEST URL:",
        `${error?.config?.baseURL || ""}${error?.config?.url || ""}`,
      );

      // ======================================
      // GET BACKEND MESSAGE
      // ======================================

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "We could not start your password reset. Please try again.";

      // ======================================
      // SHOW ERROR
      // ======================================

      showError({
        title: "Password reset unsuccessful",

        message,

        primaryLabel: "Try Again",

        dismissible: true,
      });
    } finally {
      // ======================================
      // STOP LOADING
      // ======================================

      setLoading(false);
    }
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* ====================================== */}
        {/* LOGO */}
        {/* ====================================== */}

        <Link to="/" className="auth-logo" aria-label="Dish Dash home">
          <img src={logo} alt="Dish Dash" />
        </Link>

        {/* ====================================== */}
        {/* FORM SCREEN */}
        {/* ====================================== */}

        {!emailSent ? (
          <>
            {/* ====================================== */}
            {/* ICON */}
            {/* ====================================== */}

            <div className="auth-main-icon">
              <KeyRound aria-hidden="true" />
            </div>

            {/* ====================================== */}
            {/* HEADER */}
            {/* ====================================== */}

            <header className="auth-header">
              <h1>Forgot your password?</h1>

              <p>
                Enter the Gmail address connected to your Dish Dash account and
                we'll send you a reset code and secure link.
              </p>
            </header>

            {/* ====================================== */}
            {/* FORM */}
            {/* ====================================== */}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              noValidate
              aria-busy={loading}
            >
              {/* ====================================== */}
              {/* EMAIL */}
              {/* ====================================== */}

              <div className="auth-field">
                <label htmlFor="forgot-email">Gmail address</label>

                <div className="auth-input-container">
                  <Mail
                    className="auth-field-icon"
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    autoComplete="email"
                    disabled={loading}
                    onChange={(event) => {
                      setEmail(event.target.value);
                    }}
                  />
                </div>
              </div>

              {/* ====================================== */}
              {/* SEND BUTTON */}
              {/* ====================================== */}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Checking account..." : "Send Reset Code"}
              </button>
            </form>

            {/* ====================================== */}
            {/* BACK TO LOGIN */}
            {/* ====================================== */}

            <Link to="/login" className="auth-back">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to login
            </Link>
          </>
        ) : (
          // ======================================
          // EMAIL SENT STATE
          // ======================================

          <div className="auth-status">
            {/* ====================================== */}
            {/* SUCCESS ICON */}
            {/* ====================================== */}

            <div className="auth-status-icon">
              <CheckCircle2 aria-hidden="true" />
            </div>

            {/* ====================================== */}
            {/* SUCCESS HEADING */}
            {/* ====================================== */}

            <h1>Check your Gmail</h1>

            <p>A password reset email was sent to:</p>

            {/* ====================================== */}
            {/* EMAIL */}
            {/* ====================================== */}

            <div className="auth-account">
              <span>Reset email sent to</span>

              <strong>{email}</strong>
            </div>

            {/* ====================================== */}
            {/* NEXT STEPS */}
            {/* ====================================== */}

            <div
              className="auth-requirements"
              style={{
                width: "100%",
                textAlign: "left",
                marginBottom: "18px",
              }}
            >
              <p>What happens next?</p>

              <ul>
                <li>Open the email from Dish Dash.</li>

                <li>Copy the six-digit reset code.</li>

                <li>Click the password reset link.</li>

                <li>Enter the code and your new password.</li>
              </ul>
            </div>

            {/* ====================================== */}
            {/* EXPIRY */}
            {/* ====================================== */}

            <div
              className="auth-requirements"
              style={{
                width: "100%",
                marginBottom: "18px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  textAlign: "center",
                }}
              >
                The reset code and link expire after 10 minutes.
              </p>
            </div>

            {/* ====================================== */}
            {/* ANOTHER EMAIL */}
            {/* ====================================== */}

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => {
                setEmailSent(false);

                setEmail("");
              }}
            >
              Use another Gmail address
            </button>

            {/* ====================================== */}
            {/* BACK TO LOGIN */}
            {/* ====================================== */}

            <Link to="/login" className="auth-back">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

// ======================================
// EXPORT
// ======================================

export default ForgotPassword;
