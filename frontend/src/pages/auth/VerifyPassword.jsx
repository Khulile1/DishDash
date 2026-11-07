// ======================================
// REACT
// ======================================

import { useEffect, useRef, useState } from "react";

// ======================================
// REACT ROUTER
// ======================================

import { Link, useNavigate, useSearchParams } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

// ======================================
// AUTH SERVICES
// ======================================

import { resetPassword, verifyResetToken } from "../../services/authService";

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
// VALIDATION
// ======================================

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const CODE_PATTERN = /^\d{6}$/;

// ======================================
// VERIFY PASSWORD PAGE
// ======================================

function VerifyPassword() {
  const navigate = useNavigate();

  const { showError } = usePopup();

  const [searchParams] = useSearchParams();

  // ======================================
  // RESET LINK INFORMATION
  // ======================================

  const email = searchParams.get("email") || "";

  const token = searchParams.get("token") || "";

  // ======================================
  // FORM STATE
  // ======================================

  const [code, setCode] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [passwordChanged, setPasswordChanged] = useState(false);

  // ======================================
  // RESET LINK STATE
  // ======================================

  const [checkingLink, setCheckingLink] = useState(true);

  const [linkValid, setLinkValid] = useState(false);

  const [linkError, setLinkError] = useState("");

  const [retryCount, setRetryCount] = useState(0);

  const submittingRef = useRef(false);

  // ======================================
  // CHECK RESET LINK WHEN PAGE OPENS
  // ======================================

  useEffect(() => {
    let cancelled = false;

    const checkResetLink = async () => {
      // ======================================
      // MISSING EMAIL OR TOKEN
      // ======================================

      if (!email || !token) {
        navigate("/unauthorized?reason=reset-invalid", {
          replace: true,
        });

        return;
      }

      try {
        // ======================================
        // START CHECK
        // ======================================

        setCheckingLink(true);

        setLinkValid(false);

        setLinkError("");

        // ======================================
        // VERIFY ONLY EMAIL + TOKEN
        // ======================================

        await verifyResetToken({
          email,
          token,
        });

        if (cancelled) {
          return;
        }

        // ======================================
        // LINK IS VALID
        // ======================================

        setLinkValid(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("VERIFY RESET LINK ERROR:", error);

        const errorCode = error?.response?.data?.code;

        const message = error?.response?.data?.message;

        // ======================================
        // LINK EXPIRED
        // ======================================

        if (errorCode === "RESET_LINK_EXPIRED") {
          navigate("/unauthorized?reason=reset-expired", {
            replace: true,
          });

          return;
        }

        // ======================================
        // LINK INVALID
        // ======================================

        if (errorCode === "RESET_LINK_INVALID") {
          navigate("/unauthorized?reason=reset-invalid", {
            replace: true,
          });

          return;
        }

        // ======================================
        // NETWORK / SERVER ERROR
        // ======================================

        setLinkError(
          message || "We could not check your reset link. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setCheckingLink(false);
        }
      }
    };

    checkResetLink();

    return () => {
      cancelled = true;
    };
  }, [email, token, navigate, retryCount]);

  // ======================================
  // HANDLE RESET CODE
  // ======================================

  const handleCodeChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    setCode(value.slice(0, 6));
  };

  // ======================================
  // SHOW FORM ERROR
  // ======================================

  const showFormError = (title, message) => {
    showError({
      title,

      message,

      primaryLabel: "Try Again",

      dismissible: true,
    });
  };

  // ======================================
  // SUBMIT NEW PASSWORD
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ======================================
    // PREVENT DOUBLE REQUEST
    // ======================================

    if (submittingRef.current || loading) {
      return;
    }

    // ======================================
    // LINK MUST BE VALID
    // ======================================

    if (!linkValid) {
      showFormError(
        "Invalid reset link",
        "This password reset link is no longer valid.",
      );

      return;
    }

    // ======================================
    // RESET CODE REQUIRED
    // ======================================

    if (!code) {
      showFormError(
        "Reset code required",
        "Enter the 6-digit code that was sent to your Gmail address.",
      );

      return;
    }

    // ======================================
    // CODE MUST BE 6 NUMBERS
    // ======================================

    if (!CODE_PATTERN.test(code)) {
      showFormError(
        "Invalid reset code",
        "The password reset code must contain exactly 6 numbers.",
      );

      return;
    }

    // ======================================
    // PASSWORD REQUIRED
    // ======================================

    if (!password) {
      showFormError(
        "New password required",
        "Enter the new password you would like to use.",
      );

      return;
    }

    // ======================================
    // PASSWORD STRENGTH
    // ======================================

    if (!PASSWORD_PATTERN.test(password)) {
      showFormError(
        "Password is too weak",
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.",
      );

      return;
    }

    // ======================================
    // CONFIRM PASSWORD
    // ======================================

    if (!confirmPassword) {
      showFormError(
        "Confirm your new password",
        "Enter your new password again to confirm it.",
      );

      return;
    }

    // ======================================
    // PASSWORDS MUST MATCH
    // ======================================

    if (password !== confirmPassword) {
      showFormError(
        "Passwords do not match",
        "The two passwords you entered are different. Enter the same password in both fields.",
      );

      return;
    }

    // ======================================
    // START REQUEST
    // ======================================

    submittingRef.current = true;

    setLoading(true);

    try {
      // ======================================
      // CHANGE PASSWORD
      // ======================================

      await resetPassword({
        email,

        token,

        code,

        password,

        confirmPassword,
      });

      // ======================================
      // SUCCESS
      // ======================================

      setPasswordChanged(true);

      setCode("");

      setPassword("");

      setConfirmPassword("");
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      const errorCode = error?.response?.data?.code;

      const message =
        error?.response?.data?.message ||
        "Your password could not be changed. Please try again.";

      // ======================================
      // LINK EXPIRED WHILE FORM OPEN
      // ======================================

      if (errorCode === "RESET_LINK_EXPIRED") {
        navigate("/unauthorized?reason=reset-expired", {
          replace: true,
        });

        return;
      }

      // ======================================
      // LINK INVALID
      // ======================================

      if (errorCode === "RESET_LINK_INVALID") {
        navigate("/unauthorized?reason=reset-invalid", {
          replace: true,
        });

        return;
      }

      // ======================================
      // SAME PASSWORD
      // ======================================

      if (errorCode === "SAME_PASSWORD") {
        showFormError("Choose a different password", message);

        return;
      }

      // ======================================
      // OTHER ERROR
      // ======================================

      showFormError("Password change unsuccessful", message);
    } finally {
      submittingRef.current = false;

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
        {/* CHECKING RESET LINK */}
        {/* ====================================== */}

        {checkingLink && (
          <div className="auth-status" role="status" aria-live="polite">
            <div className="auth-main-icon">
              <ShieldCheck aria-hidden="true" />
            </div>

            <h1>Checking your reset link</h1>

            <p>
              Please wait while we check that your password reset link is still
              valid.
            </p>
          </div>
        )}

        {/* ====================================== */}
        {/* LINK CHECK ERROR */}
        {/* ====================================== */}

        {!checkingLink && linkError && (
          <div className="auth-status" role="alert">
            <div className="auth-status-icon auth-status-icon--error">
              <ShieldCheck aria-hidden="true" />
            </div>

            <h1>Unable to check your reset link</h1>

            <p>{linkError}</p>

            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                setRetryCount((current) => current + 1);
              }}
            >
              Try Again
            </button>

            <Link
              to="/forgot-password"
              className="auth-link"
              style={{
                marginTop: "18px",
              }}
            >
              Request a new reset link
            </Link>

            <Link to="/login" className="auth-back">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to login
            </Link>
          </div>
        )}

        {/* ====================================== */}
        {/* PASSWORD RESET FORM */}
        {/* ====================================== */}

        {!checkingLink && linkValid && !passwordChanged && (
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
              <h1>Create a new password</h1>

              <p>
                Enter the six-digit reset code sent to your Gmail and choose
                your new Dish Dash password.
              </p>
            </header>

            {/* ====================================== */}
            {/* ACCOUNT */}
            {/* ====================================== */}

            <div className="auth-account">
              <span>Resetting password for</span>

              <strong>{email}</strong>
            </div>

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
              {/* RESET CODE */}
              {/* ====================================== */}

              <div className="auth-field">
                <label htmlFor="reset-code">6-digit reset code</label>

                <div className="auth-input-container">
                  <ShieldCheck
                    className="auth-field-icon"
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="reset-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    maxLength={6}
                    disabled={loading}
                    onChange={handleCodeChange}
                    className="auth-code-input"
                  />
                </div>

                <span className="auth-code-counter">{code.length}/6</span>
              </div>

              {/* ====================================== */}
              {/* NEW PASSWORD */}
              {/* ====================================== */}

              <div className="auth-field">
                <label htmlFor="new-password">New password</label>

                <div className="auth-input-container">
                  <LockKeyhole
                    className="auth-field-icon"
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    autoComplete="new-password"
                    disabled={loading}
                    onChange={(event) => {
                      setPassword(event.target.value);
                    }}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    disabled={loading}
                    onClick={() => {
                      setShowPassword((current) => !current);
                    }}
                    aria-label={
                      showPassword ? "Hide new password" : "Show new password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* ====================================== */}
              {/* CONFIRM PASSWORD */}
              {/* ====================================== */}

              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm new password</label>

                <div className="auth-input-container">
                  <LockKeyhole
                    className="auth-field-icon"
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your new password again"
                    value={confirmPassword}
                    autoComplete="new-password"
                    disabled={loading}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                    }}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    disabled={loading}
                    onClick={() => {
                      setShowConfirmPassword((current) => !current);
                    }}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* ====================================== */}
              {/* PASSWORD REQUIREMENTS */}
              {/* ====================================== */}

              <div className="auth-requirements">
                <p>Your password must contain:</p>

                <ul>
                  <li>At least 8 characters</li>

                  <li>One uppercase letter</li>

                  <li>One lowercase letter</li>

                  <li>One number</li>

                  <li>One special character (@$!%*?&amp;)</li>
                </ul>

                <p
                  style={{
                    marginTop: "10px",
                    marginBottom: 0,
                  }}
                >
                  Your new password must be different from your current
                  password.
                </p>
              </div>

              {/* ====================================== */}
              {/* SUBMIT */}
              {/* ====================================== */}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Changing password..." : "Change Password"}
              </button>
            </form>

            {/* ====================================== */}
            {/* BACK */}
            {/* ====================================== */}

            <Link to="/login" className="auth-back">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to login
            </Link>
          </>
        )}

        {/* ====================================== */}
        {/* PASSWORD CHANGED */}
        {/* ====================================== */}

        {passwordChanged && (
          <div className="auth-status">
            {/* SUCCESS ICON */}

            <div className="auth-status-icon">
              <CheckCircle2 aria-hidden="true" />
            </div>

            {/* HEADING */}

            <h1>Password changed</h1>

            {/* MESSAGE */}

            <p>Your Dish Dash password has been changed successfully.</p>

            <p>You can now sign in using your new password.</p>

            {/* LOGIN BUTTON */}

            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                navigate("/login", {
                  replace: true,
                });
              }}
            >
              Go to Login
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// ======================================
// EXPORT
// ======================================

export default VerifyPassword;
