// ======================================
// REACT
// ======================================

import { useState } from "react";

// ======================================
// REACT ROUTER
// ======================================

import { Link, useNavigate } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

// ======================================
// ASSETS
// ======================================

import logo from "../../assets/DishDash.png";

// ======================================
// STYLES
// ======================================

import "../../styles/AuthPages.css";

// ======================================
// SERVICES
// ======================================

import { loginUser } from "../../services/authService";

// ======================================
// POPUP CONTEXT
// ======================================

import { usePopup } from "../../context/PopupContext";

// ======================================
// API FEEDBACK HELPERS
// ======================================

import {
  getApiErrorMessage,
  getDisplayName,
  requireSuccessfulResult,
} from "../../utils/apiFeedback";

// ======================================
// EMAIL VALIDATION
// ======================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ======================================
// LOGIN ERROR MESSAGE
// ======================================

function getLoginFailureMessage(error) {
  const status = error?.response?.status;

  const backendMessage =
    error?.response?.data?.message || error?.response?.data?.error;

  // ======================================
  // BAD REQUEST
  // ======================================

  if (status === 400) {
    return backendMessage || "Enter a valid email address and password.";
  }

  // ======================================
  // UNAUTHORIZED
  // ======================================

  if (status === 401) {
    return (
      backendMessage ||
      "The email address or password you entered is incorrect."
    );
  }

  // ======================================
  // NOT VERIFIED
  // ======================================

  if (status === 403) {
    return (
      backendMessage ||
      "Your account has not been verified. Verify your email address before logging in."
    );
  }

  // ======================================
  // ACCOUNT NOT FOUND
  // ======================================

  if (status === 404) {
    return backendMessage || "No account was found with this email address.";
  }

  // ======================================
  // TOO MANY ATTEMPTS
  // ======================================

  if (status === 429) {
    return (
      backendMessage ||
      "Too many login attempts were made. Please wait before trying again."
    );
  }

  // ======================================
  // GENERAL ERROR
  // ======================================

  return getApiErrorMessage(
    error,
    "Your login could not be completed. Check your details and try again.",
  );
}

// ======================================
// LOGIN PAGE
// ======================================

function LoginPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // POPUPS
  // ======================================

  const { showSuccess, showError } = usePopup();

  // ======================================
  // FORM STATE
  // ======================================

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ======================================
  // LOGIN
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ======================================
    // PREVENT DOUBLE SUBMIT
    // ======================================

    if (loading) {
      return;
    }

    // ======================================
    // CLEAN EMAIL
    // ======================================

    const cleanEmail = email.trim().toLowerCase();

    // ======================================
    // CHECK BOTH FIELDS
    // ======================================

    if (!cleanEmail && !password) {
      showError({
        title: "Login details required",

        message: "Enter your email address and password before continuing.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!cleanEmail) {
      showError({
        title: "Email address required",

        message: "Enter the email address connected to your Dish Dash account.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // VALID EMAIL
    // ======================================

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      showError({
        title: "Invalid email address",

        message: "Enter a valid email address before continuing.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // PASSWORD REQUIRED
    // ======================================

    if (!password) {
      showError({
        title: "Password required",

        message: "Enter your password before continuing.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // START LOGIN REQUEST
    // ======================================

    setLoading(true);

    try {
      // ======================================
      // CALL LOGIN API
      // ======================================

      const response = await loginUser(cleanEmail, password);

      // ======================================
      // VALIDATE SERVER RESPONSE
      // ======================================

      const data = requireSuccessfulResult(
        response,
        "Your login could not be completed.",
      );

      // ======================================
      // GET TOKEN
      // ======================================

      const token = data?.token || data?.accessToken || data?.jwt;

      // ======================================
      // GET USER
      // ======================================

      const user = data?.user || data?.account || data?.customer;

      // ======================================
      // CHECK TOKEN
      // ======================================

      if (typeof token !== "string" || !token.trim()) {
        throw new Error(
          "Login was accepted, but the server did not return an access token.",
        );
      }

      // ======================================
      // CHECK USER INFORMATION
      // ======================================

      if (!user || typeof user !== "object") {
        throw new Error(
          "Login was accepted, but the server did not return your account information.",
        );
      }

      // ======================================
      // SAVE SESSION
      // ======================================

      try {
        localStorage.setItem("token", token);

        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // ======================================
        // CLEAN FAILED SESSION
        // ======================================

        try {
          localStorage.removeItem("token");

          localStorage.removeItem("user");
        } catch {
          // Browser storage may be blocked.
        }

        throw new Error(
          "Your login was successful, but the session could not be saved in this browser.",
        );
      }

      // ======================================
      // CREATE WELCOME NAME
      // ======================================

      const name = getDisplayName(user, "");

      const welcomeTitle = name ? `Welcome, ${name}!` : "Welcome!";

      // ======================================
      // SUCCESS POPUP
      // ======================================

      showSuccess({
        title: welcomeTitle,

        message: "You have successfully logged in to your Dish Dash account.",

        primaryLabel: "Continue",

        dismissible: true,
      });

      // ======================================
      // GET ROLE
      // ======================================

      const role = String(user?.role || data?.role || "")
        .trim()
        .toLowerCase();

      // ======================================
      // CUSTOMER
      // ======================================

      if (role === "customer") {
        navigate("/home", {
          replace: true,
        });

        return;
      }

      // ======================================
      // RESTAURANT
      // ======================================

      if (role === "restaurant") {
        navigate("/restaurant", {
          replace: true,
        });

        return;
      }

      // ======================================
      // ADMIN
      // ======================================

      if (role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      // ======================================
      // DRIVER
      // ======================================

      if (role === "driver") {
        navigate("/driver", {
          replace: true,
        });

        return;
      }

      // ======================================
      // UNKNOWN ROLE
      // ======================================

      navigate("/unauthorized", {
        replace: true,
      });
    } catch (error) {
      // ======================================
      // LOGIN ERROR
      // ======================================

      console.error("LOGIN ERROR:", error);

      showError({
        title: "Login unsuccessful",

        message: getLoginFailureMessage(error),

        primaryLabel: "Try Again",

        dismissible: true,
      });
    } finally {
      // ======================================
      // STOP BUTTON LOADING
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
        {/* ======================================
            LOGO
        ====================================== */}

        <Link to="/" className="auth-logo" aria-label="Dish Dash home">
          <img src={logo} alt="Dish Dash" />
        </Link>

        {/* ======================================
            HEADER
        ====================================== */}

        <header className="auth-header">
          <h1>Welcome back</h1>

          <p>Sign in to continue to your Dish Dash account.</p>
        </header>

        {/* ======================================
            LOGIN FORM
        ====================================== */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={loading}
        >
          {/* ======================================
              EMAIL
          ====================================== */}

          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>

            <div className="auth-input-container">
              <Mail className="auth-field-icon" size={19} aria-hidden="true" />

              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                autoComplete="email"
                disabled={loading}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </div>
          </div>

          {/* ======================================
              PASSWORD
          ====================================== */}

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>

            <div className="auth-input-container">
              <LockKeyhole
                className="auth-field-icon"
                size={19}
                aria-hidden="true"
              />

              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                disabled={loading}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />

              {/* ======================================
                  SHOW / HIDE PASSWORD
              ====================================== */}

              <button
                type="button"
                className="auth-password-toggle"
                disabled={loading}
                onClick={() => {
                  setShowPassword((currentValue) => !currentValue);
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={19} aria-hidden="true" />
                ) : (
                  <Eye size={19} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* ======================================
              FORGOT PASSWORD
          ====================================== */}

          <div className="auth-options">
            <span />

            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          {/* ======================================
              LOGIN BUTTON
          ====================================== */}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* ======================================
            REGISTER LINK
        ====================================== */}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </section>
    </main>
  );
}

// ======================================
// EXPORT
// ======================================

export default LoginPage;
