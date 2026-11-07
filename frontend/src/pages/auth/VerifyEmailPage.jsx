// ======================================
// REACT
// ======================================

import { useEffect, useState } from "react";

// ======================================
// REACT ROUTER
// ======================================

import { Link, useLocation, useNavigate } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";

// ======================================
// SERVICES
// ======================================

import {
  resendVerificationCode,
  verifyEmail,
} from "../../services/authService";

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
// SETTINGS
// ======================================

const VERIFICATION_CODE_LENGTH = 6;

// ======================================
// READ SAVED VERIFICATION USER
// ======================================

function getSavedVerificationUser() {
  try {
    const savedUser = sessionStorage.getItem("pendingVerificationUser");

    if (!savedUser) {
      return {
        email: "",
        name: "",
      };
    }

    const parsedUser = JSON.parse(savedUser);

    return {
      email:
        typeof parsedUser?.email === "string"
          ? parsedUser.email.trim().toLowerCase()
          : "",

      name: typeof parsedUser?.name === "string" ? parsedUser.name.trim() : "",
    };
  } catch {
    return {
      email: "",
      name: "",
    };
  }
}

// ======================================
// VERIFY EMAIL PAGE
// ======================================

function VerifyEmailPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const { showSuccess, showError, showInfo } = usePopup();

  // ======================================
  // GET USER INFORMATION
  // ======================================

  const [pendingUser] = useState(() => {
    const savedUser = getSavedVerificationUser();

    const locationUser = location.state?.user;

    const locationEmail = location.state?.email || locationUser?.email;

    const locationName = location.state?.name || locationUser?.name || "";

    return {
      email:
        typeof locationEmail === "string" && locationEmail.trim()
          ? locationEmail.trim().toLowerCase()
          : savedUser.email,

      name:
        typeof locationName === "string" && locationName.trim()
          ? locationName.trim()
          : savedUser.name,
    };
  });

  const email = pendingUser.email;

  const pendingName = pendingUser.name;

  // ======================================
  // FORM STATE
  // ======================================

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  // ======================================
  // SAVE VERIFICATION USER
  // ======================================

  useEffect(() => {
    if (!email) {
      return;
    }

    try {
      sessionStorage.setItem(
        "pendingVerificationUser",

        JSON.stringify({
          email,
          name: pendingName,
        }),
      );
    } catch {
      // Verification can still continue
      // using React Router state.
    }
  }, [email, pendingName]);

  // ======================================
  // CODE INPUT
  // ======================================

  const handleCodeChange = (event) => {
    const numericCode = event.target.value
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH);

    setCode(numericCode);
  };

  // ======================================
  // VERIFY EMAIL
  // ======================================

  const handleVerify = async (event) => {
    event.preventDefault();

    // ======================================
    // PREVENT DUPLICATE REQUEST
    // ======================================

    if (loading || resending) {
      return;
    }

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!email) {
      showError({
        title: "Email address missing",

        message:
          "Your verification email could not be found. Please register again.",

        primaryLabel: "Go to Register",

        dismissible: true,

        onPrimary: () => {
          navigate("/register", {
            replace: true,
          });
        },
      });

      return;
    }

    // ======================================
    // CLEAN CODE
    // ======================================

    const cleanCode = code.trim();

    // ======================================
    // CODE REQUIRED
    // ======================================

    if (!cleanCode) {
      showError({
        title: "Verification code required",

        message: "Enter the verification code sent to your email address.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // CODE LENGTH
    // ======================================

    if (cleanCode.length !== VERIFICATION_CODE_LENGTH) {
      showError({
        title: "Incomplete verification code",

        message: "Enter the complete six-digit verification code.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // CODE MUST BE NUMBERS
    // ======================================

    if (!/^\d{6}$/.test(cleanCode)) {
      showError({
        title: "Invalid verification code",

        message: "The verification code must contain six numbers.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    // ======================================
    // START VERIFICATION
    // ======================================

    setLoading(true);

    try {
      // ======================================
      // VERIFY EMAIL
      // ======================================

      const response = await verifyEmail(email, cleanCode);

      console.log("VERIFY EMAIL SUCCESS:", response);

      // ======================================
      // CLEAR SAVED VERIFICATION DATA
      // ======================================

      try {
        sessionStorage.removeItem("pendingVerificationUser");
      } catch {
        // Verification has already succeeded.
      }

      // ======================================
      // SUCCESS
      // ======================================

      showSuccess({
        title: pendingName ? `Welcome, ${pendingName}!` : "Email verified",

        message:
          "Your email address has been successfully verified. You can now log in to your Dish Dash account.",

        primaryLabel: "Go to Login",

        dismissible: false,

        onPrimary: () => {
          navigate("/login", {
            replace: true,
          });
        },
      });
    } catch (error) {
      console.error("VERIFICATION ERROR:", error);

      const status = error?.response?.status;

      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error;

      // ======================================
      // ALREADY VERIFIED
      // ======================================

      if (status === 409) {
        showInfo({
          title: "Email already verified",

          message:
            "This email address has already been verified. You can continue to the login page.",

          primaryLabel: "Go to Login",

          dismissible: true,

          onPrimary: () => {
            navigate("/login", {
              replace: true,
            });
          },
        });

        return;
      }

      // ======================================
      // VERIFICATION ERROR
      // ======================================

      showError({
        title: "Verification unsuccessful",

        message:
          backendMessage ||
          "The verification code is incorrect, expired, or no longer valid.",

        primaryLabel: "Try Again",

        dismissible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // RESEND VERIFICATION CODE
  // ======================================

  const handleResendCode = async () => {
    // ======================================
    // PREVENT OVERLAPPING REQUESTS
    // ======================================

    if (resending || loading) {
      return;
    }

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!email) {
      showError({
        title: "Email address missing",

        message:
          "Your verification email could not be found. Please register again.",

        primaryLabel: "Go to Register",

        dismissible: true,

        onPrimary: () => {
          navigate("/register", {
            replace: true,
          });
        },
      });

      return;
    }

    // ======================================
    // START RESEND
    // ======================================

    setResending(true);

    try {
      // ======================================
      // CALL BACKEND
      // ======================================

      const response = await resendVerificationCode(email);

      console.log("RESEND CODE SUCCESS:", response);

      // ======================================
      // CLEAR OLD CODE
      // ======================================

      setCode("");

      // ======================================
      // SUCCESS POPUP
      // ======================================

      showSuccess({
        title: "New verification code sent",

        message: `A new six-digit verification code has been sent to ${email}.`,

        primaryLabel: "Enter Code",

        dismissible: true,
      });
    } catch (error) {
      console.error("RESEND VERIFICATION ERROR:", error);

      const status = error?.response?.status;

      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error;

      // ======================================
      // ALREADY VERIFIED
      // ======================================

      if (status === 409) {
        showInfo({
          title: "Email already verified",

          message:
            "This email address has already been verified. You can continue to login.",

          primaryLabel: "Go to Login",

          dismissible: true,

          onPrimary: () => {
            navigate("/login", {
              replace: true,
            });
          },
        });

        return;
      }

      // ======================================
      // ERROR
      // ======================================

      showError({
        title: "Code could not be sent",

        message:
          backendMessage ||
          "A new verification code could not be sent. Please try again.",

        primaryLabel: "Try Again",

        dismissible: true,
      });
    } finally {
      setResending(false);
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
        {/* ICON */}
        {/* ====================================== */}

        <div className="auth-main-icon">
          <MailCheck aria-hidden="true" />
        </div>

        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <header className="auth-header">
          <h1>Verify your email</h1>

          <p>
            Enter the six-digit verification code sent to your email address.
          </p>
        </header>

        {/* ====================================== */}
        {/* EMAIL */}
        {/* ====================================== */}

        {email && (
          <div className="auth-account">
            <span>Verification code sent to</span>

            <strong>{email}</strong>
          </div>
        )}

        {/* ====================================== */}
        {/* VERIFICATION FORM */}
        {/* ====================================== */}

        <form
          className="auth-form"
          onSubmit={handleVerify}
          noValidate
          aria-busy={loading}
        >
          {/* ====================================== */}
          {/* CODE */}
          {/* ====================================== */}

          <div className="auth-field">
            <label htmlFor="verification-code">Verification code</label>

            <div className="auth-input-container">
              <ShieldCheck
                className="auth-field-icon"
                size={19}
                aria-hidden="true"
              />

              <input
                id="verification-code"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                maxLength={VERIFICATION_CODE_LENGTH}
                disabled={loading || resending}
                onChange={handleCodeChange}
                className="auth-code-input"
              />
            </div>

            <span className="auth-code-counter">
              {code.length}/{VERIFICATION_CODE_LENGTH}
            </span>
          </div>

          {/* ====================================== */}
          {/* VERIFY BUTTON */}
          {/* ====================================== */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || resending}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        {/* ====================================== */}
        {/* RESEND */}
        {/* ====================================== */}

        <div className="auth-footer">
          <p>Didn't receive the code?</p>

          <button
            type="button"
            className="auth-secondary-button"
            onClick={handleResendCode}
            disabled={resending || loading}
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        {/* ====================================== */}
        {/* BACK */}
        {/* ====================================== */}

        <Link to="/login" className="auth-back">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to login
        </Link>
      </section>
    </main>
  );
}

// ======================================
// EXPORT
// ======================================

export default VerifyEmailPage;
