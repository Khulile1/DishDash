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

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  UserRound,
  Users,
} from "lucide-react";

// ======================================
// ASSETS
// ======================================

import logo from "../../assets/DishDash.png";

// ======================================
// SERVICES
// ======================================

import { registerUser } from "../../services/authService";

// ======================================
// STYLES
// ======================================

import "../../styles/AuthPages.css";

// ======================================
// PASSWORD VALIDATION
// ======================================

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// ======================================
// EMAIL VALIDATION
// ======================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ======================================
// REGISTER PAGE
// ======================================

function RegisterPage() {
  const navigate = useNavigate();

  // ======================================
  // FORM STATE
  // ======================================

  const [name, setName] = useState("");

  const [surname, setSurname] = useState("");

  const [email, setEmail] = useState("");

  const [role, setRole] = useState("customer");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  // ======================================
  // PASSWORD VISIBILITY
  // ======================================

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ======================================
  // FEEDBACK STATE
  // ======================================

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================================
  // REGISTER
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // ======================================
    // CLEAN INPUT
    // ======================================

    const cleanName = name.trim();

    const cleanSurname = surname.trim();

    const cleanEmail = email.trim().toLowerCase();

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (
      !cleanName ||
      !cleanSurname ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all required fields.");

      return;
    }

    // ======================================
    // EMAIL VALIDATION
    // ======================================

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Enter a valid email address.");

      return;
    }

    // ======================================
    // PASSWORD VALIDATION
    // ======================================

    if (!PASSWORD_PATTERN.test(password)) {
      setError(
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.",
      );

      return;
    }

    // ======================================
    // PASSWORDS MUST MATCH
    // ======================================

    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      // ======================================
      // START LOADING
      // ======================================

      setLoading(true);

      // ======================================
      // CREATE USER DATA
      // ======================================

      const userData = {
        name: cleanName,

        surname: cleanSurname,

        email: cleanEmail,

        role,

        password,
      };

      // ======================================
      // REGISTER USER
      // ======================================

      const data = await registerUser(userData);

      console.log("Register response:", data);

      // ======================================
      // GO TO VERIFY EMAIL
      // ======================================

      navigate("/verify-email", {
        state: {
          email: cleanEmail,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      // ======================================
      // SERVER NOT AVAILABLE
      // ======================================

      if (!error.response) {
        setError(
          "Cannot connect to the server. Please check that the backend is running.",
        );

        return;
      }

      const status = error.response.status;

      const backendMessage = error.response.data?.message;

      // ======================================
      // EMAIL ALREADY EXISTS
      // ======================================

      if (status === 409) {
        setError("An account with this email already exists.");
      }

      // ======================================
      // VALIDATION ERROR
      // ======================================
      else if (status === 400) {
        setError(
          backendMessage || "Please check your registration information.",
        );
      }

      // ======================================
      // SERVER ERROR
      // ======================================
      else if (status >= 500) {
        setError("Server error. Please try again later.");
      }

      // ======================================
      // OTHER ERROR
      // ======================================
      else {
        setError(backendMessage || "Registration failed.");
      }
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
      <section className="auth-card auth-card--wide">
        {/* ====================================== */}
        {/* LOGO */}
        {/* ====================================== */}

        <Link to="/" className="auth-logo" aria-label="Dish Dash home">
          <img src={logo} alt="Dish Dash" />
        </Link>

        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <header className="auth-header">
          <h1>Create your account</h1>

          <p>Join Dish Dash and get started with your account.</p>
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
          {/* NAME + SURNAME */}
          {/* ====================================== */}

          <div className="auth-row">
            {/* NAME */}

            <div className="auth-field">
              <label htmlFor="register-name">Name</label>

              <div className="auth-input-container">
                <User
                  className="auth-field-icon"
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="register-name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  autoComplete="given-name"
                  disabled={loading}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
              </div>
            </div>

            {/* SURNAME */}

            <div className="auth-field">
              <label htmlFor="register-surname">Surname</label>

              <div className="auth-input-container">
                <UserRound
                  className="auth-field-icon"
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="register-surname"
                  name="surname"
                  type="text"
                  placeholder="Enter your surname"
                  value={surname}
                  autoComplete="family-name"
                  disabled={loading}
                  onChange={(event) => {
                    setSurname(event.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* ====================================== */}
          {/* EMAIL */}
          {/* ====================================== */}

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>

            <div className="auth-input-container">
              <Mail className="auth-field-icon" size={19} aria-hidden="true" />

              <input
                id="register-email"
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

          {/* ====================================== */}
          {/* ROLE */}
          {/* ====================================== */}

          <div className="auth-field">
            <label htmlFor="register-role">Account type</label>

            <div className="auth-input-container">
              <Users className="auth-field-icon" size={19} aria-hidden="true" />

              <select
                id="register-role"
                name="role"
                value={role}
                disabled={loading}
                onChange={(event) => {
                  setRole(event.target.value);
                }}
              >
                <option value="customer">Customer</option>

                <option value="restaurant">Restaurant</option>

                <option value="driver">Driver</option>
              </select>
            </div>
          </div>

          {/* ====================================== */}
          {/* PASSWORD */}
          {/* ====================================== */}

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>

            <div className="auth-input-container">
              <LockKeyhole
                className="auth-field-icon"
                size={19}
                aria-hidden="true"
              />

              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            <label htmlFor="register-confirm-password">Confirm password</label>

            <div className="auth-input-container">
              <LockKeyhole
                className="auth-field-icon"
                size={19}
                aria-hidden="true"
              />

              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password again"
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
          </div>

          {/* ====================================== */}
          {/* ERROR */}
          {/* ====================================== */}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {/* ====================================== */}
          {/* REGISTER BUTTON */}
          {/* ====================================== */}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* ====================================== */}
        {/* LOGIN LINK */}
        {/* ====================================== */}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
