// ======================================
// REACT
// ======================================

import { useEffect, useState } from "react";

// ======================================
// REACT ROUTER
// ======================================

import { Link, useNavigate } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import {
  Banknote,
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  User,
  UserRound,
  Utensils,
  WalletCards,
} from "lucide-react";

// ======================================
// SERVICES
// ======================================

import { logoutUser } from "../../services/authService";

// ======================================
// POPUP
// ======================================

import { usePopup } from "../../context/PopupContext";

// ======================================
// STYLES
// ======================================

import "../../styles/ProfileSettings.css";

// ======================================
// PROFILE SETTINGS
// ======================================

function ProfileSettings() {
  const navigate = useNavigate();

  const { showSuccess, showError } = usePopup();

  // ======================================
  // CURRENT SECTION
  // ======================================

  const [activeSection, setActiveSection] = useState("account");

  // ======================================
  // USER DETAILS
  // ======================================

  const [name, setName] = useState("");

  const [surname, setSurname] = useState("");

  const [email, setEmail] = useState("");

  const [role, setRole] = useState("");

  // ======================================
  // ADDRESS
  // ======================================

  const [address, setAddress] = useState("");

  const [suburb, setSuburb] = useState("");

  const [city, setCity] = useState("");

  const [postalCode, setPostalCode] = useState("");

  // ======================================
  // SECURITY
  // ======================================

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ======================================
  // PREFERENCES
  // ======================================

  const [orderUpdates, setOrderUpdates] = useState(true);

  const [promotions, setPromotions] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);

  // ======================================
  // BALANCE & PAYMENT DETAILS
  // ======================================

  const [accountBalance, setAccountBalance] = useState(0);

  const [balanceVisible, setBalanceVisible] = useState(false);

  const [balanceTransactions, setBalanceTransactions] = useState([]);

  const [lastPaymentDetails, setLastPaymentDetails] = useState(null);

  // ======================================
  // LOAD USER
  // ======================================

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        return;
      }

      const user = JSON.parse(savedUser);

      setName(user?.name || "");

      setSurname(user?.surname || "");

      setEmail(user?.email || "");

      setRole(user?.role || "");
    } catch (error) {
      console.error("PROFILE LOAD ERROR:", error);
    }
  }, []);

  // ======================================
  // LOAD BALANCE / PAYMENT INFORMATION
  // ======================================
  //
  // TEMPORARY DEVELOPMENT STORAGE:
  //
  // dishDashAccountBalance
  // dishDashBalanceTransactions
  // checkoutPaymentDetails
  //
  // Replace these with backend endpoints once
  // the BalanceTransaction API is available.
  // ======================================

  const loadFinancialDetails = () => {
    try {
      const savedBalance = Number(
        localStorage.getItem("dishDashAccountBalance"),
      );

      setAccountBalance(Number.isFinite(savedBalance) ? savedBalance : 0);

      const savedTransactions = localStorage.getItem(
        "dishDashBalanceTransactions",
      );

      const parsedTransactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];

      setBalanceTransactions(
        Array.isArray(parsedTransactions)
          ? [...parsedTransactions].sort((a, b) => {
              const dateA = new Date(a?.createdAt || a?.date || 0).getTime();

              const dateB = new Date(b?.createdAt || b?.date || 0).getTime();

              return dateB - dateA;
            })
          : [],
      );

      const savedPayment = localStorage.getItem("checkoutPaymentDetails");

      setLastPaymentDetails(savedPayment ? JSON.parse(savedPayment) : null);
    } catch (error) {
      console.error("FINANCIAL DETAILS LOAD ERROR:", error);

      setAccountBalance(0);

      setBalanceTransactions([]);

      setLastPaymentDetails(null);
    }
  };

  useEffect(() => {
    loadFinancialDetails();

    const handleStorageChange = () => {
      loadFinancialDetails();
    };

    const handleWindowFocus = () => {
      loadFinancialDetails();
    };

    window.addEventListener("storage", handleStorageChange);

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // ======================================
  // BALANCE HELPERS
  // ======================================

  const availableCredit = accountBalance > 0 ? accountBalance : 0;

  const amountOwed = accountBalance < 0 ? Math.abs(accountBalance) : 0;

  const balanceState =
    accountBalance > 0 ? "credit" : accountBalance < 0 ? "debt" : "zero";

  const formatCurrency = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "R0.00";
    }

    return `R${value.toFixed(2)}`;
  };

  const formatTransactionDate = (value) => {
    if (!value) {
      return "No date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No date";
    }

    return date.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatReason = (reason) => {
    if (!reason) {
      return "Balance adjustment";
    }

    return String(reason)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const getPaymentSummary = () => {
    if (!lastPaymentDetails) {
      return {
        icon: WalletCards,
        title: "No payment selected",
        description:
          "Your most recent checkout payment choice will appear here.",
      };
    }

    if (lastPaymentDetails.method === "card") {
      return {
        icon: CreditCard,
        title: `${lastPaymentDetails.cardBrand || "Card"} ${
          lastPaymentDetails.cardType === "credit" ? "Credit" : "Debit"
        }`,
        description: lastPaymentDetails.last4
          ? `•••• ${lastPaymentDetails.last4}`
          : "Card payment",
      };
    }

    if (lastPaymentDetails.method === "cash") {
      return {
        icon: Banknote,
        title: "Cash on Delivery",
        description: lastPaymentDetails.tenderAmount
          ? `Expected cash ${formatCurrency(lastPaymentDetails.tenderAmount)}`
          : "Cash payment",
      };
    }

    if (lastPaymentDetails.method === "balance") {
      return {
        icon: WalletCards,
        title: "Dish Dash Balance",
        description: `${formatCurrency(
          lastPaymentDetails.balanceUsed || 0,
        )} selected from balance`,
      };
    }

    return {
      icon: WalletCards,
      title: "Payment",
      description: "Payment information available",
    };
  };

  const paymentSummary = getPaymentSummary();

  const PaymentSummaryIcon = paymentSummary.icon;

  // ======================================
  // INITIALS
  // ======================================

  const initials =
    `${name?.[0] || ""}${surname?.[0] || ""}`.toUpperCase() || "DD";

  // ======================================
  // SAVE ACCOUNT
  // ======================================

  const handleSaveAccount = (event) => {
    event.preventDefault();

    if (!name.trim() || !surname.trim()) {
      showError({
        title: "Information required",

        message: "Name and surname cannot be empty.",

        primaryLabel: "Try Again",

        dismissible: true,
      });

      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const updatedUser = {
        ...currentUser,

        name: name.trim(),

        surname: surname.trim(),
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      showSuccess({
        title: "Profile updated",

        message: "Your account information has been updated successfully.",

        primaryLabel: "Continue",

        dismissible: true,
      });
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      showError({
        title: "Profile update failed",

        message: "Your profile could not be updated.",

        primaryLabel: "Try Again",

        dismissible: true,
      });
    }
  };

  // ======================================
  // SAVE ADDRESS
  // ======================================

  const handleSaveAddress = (event) => {
    event.preventDefault();

    if (!address.trim() || !suburb.trim() || !city.trim()) {
      showError({
        title: "Address incomplete",

        message: "Enter your street address, suburb and city.",

        primaryLabel: "Try Again",
      });

      return;
    }

    showSuccess({
      title: "Address saved",

      message: "Your delivery address has been saved.",

      primaryLabel: "Continue",
    });
  };

  // ======================================
  // CHANGE PASSWORD
  // ======================================

  const handleChangePassword = (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError({
        title: "Password information required",

        message: "Complete all password fields before continuing.",

        primaryLabel: "Try Again",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      showError({
        title: "Passwords do not match",

        message: "Your new password and confirmation password must match.",

        primaryLabel: "Try Again",
      });

      return;
    }

    if (currentPassword === newPassword) {
      showError({
        title: "Choose a different password",

        message:
          "Your new password cannot be the same as your current password.",

        primaryLabel: "Try Again",
      });

      return;
    }

    /*
      Connect this to your backend
      change-password endpoint when ready.
    */

    showSuccess({
      title: "Password ready to update",

      message:
        "Password validation passed. Connect this form to your backend password-change endpoint.",

      primaryLabel: "Continue",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ======================================
  // LOGOUT
  // ======================================

  const handleLogout = () => {
    logoutUser();

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================
  // MENU ITEMS
  // ======================================

  const menuItems = [
    {
      id: "account",
      label: "Account",
      icon: User,
    },
    {
      id: "balance",
      label: "Balance & Payments",
      icon: WalletCards,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
    },
    {
      id: "address",
      label: "Delivery Address",
      icon: MapPin,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: Settings,
    },
  ];

  // ======================================
  // PAGE
  // ======================================

  return (
    <main className="profile-page">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <section className="profile-header mobile-page-header">
        <div>
          <p className="profile-eyebrow">My account</p>

          <h1>Profile & Settings</h1>

          <p>
            Manage your personal details, security and Dish Dash preferences.
          </p>
        </div>

        <Link to="/home" className="profile-home-link">
          Back to Home
        </Link>
      </section>

      {/* ====================================== */}
      {/* PROFILE SUMMARY */}
      {/* ====================================== */}

      <section className="profile-summary">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-summary-details">
          <h2>
            {name || "Dish"} {surname || "Dash"}
          </h2>

          <div className="profile-summary-email">
            <Mail size={16} />

            <span>{email || "No email available"}</span>
          </div>
        </div>

        <div className="profile-summary-actions">
          <span className="profile-role">{role || "Customer"}</span>

          <button
            type="button"
            className={`profile-balance-preview profile-balance-preview--${balanceState}`}
            onClick={() => setBalanceVisible((current) => !current)}
            aria-label={
              balanceVisible
                ? "Hide Dish Dash balance"
                : "Reveal Dish Dash balance"
            }
          >
            <WalletCards size={18} />

            <span className="profile-balance-preview-text">
              <small>Dish Dash balance</small>

              <strong>
                {balanceVisible ? formatCurrency(accountBalance) : "R••••"}
              </strong>
            </span>

            {balanceVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </section>

      {/* ====================================== */}
      {/* SETTINGS LAYOUT */}
      {/* ====================================== */}

      <section className="profile-layout">
        {/* ====================================== */}
        {/* SIDEBAR */}
        {/* ====================================== */}

        <aside className="profile-sidebar">
          <nav className="profile-menu">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={
                  activeSection === id
                    ? "profile-menu-item profile-menu-item--active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection(id)}
              >
                <Icon size={19} />

                <span>{label}</span>

                <ChevronRight size={17} className="profile-menu-arrow" />
              </button>
            ))}
          </nav>

          <div className="profile-sidebar-divider" />

          <button
            type="button"
            className="profile-menu-item profile-menu-item--logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />

            <span>Logout</span>
          </button>
        </aside>

        {/* ====================================== */}
        {/* CONTENT */}
        {/* ====================================== */}

        <div className="profile-content">
          {/* ====================================== */}
          {/* ACCOUNT */}
          {/* ====================================== */}

          {activeSection === "account" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <User />
                </div>

                <div>
                  <h2>Account information</h2>

                  <p>Update your personal account details.</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleSaveAccount}>
                <div className="settings-grid">
                  <div className="settings-field">
                    <label htmlFor="profile-name">Name</label>

                    <div className="settings-input">
                      <User size={18} />

                      <input
                        id="profile-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="profile-surname">Surname</label>

                    <div className="settings-input">
                      <UserRound size={18} />

                      <input
                        id="profile-surname"
                        value={surname}
                        onChange={(event) => setSurname(event.target.value)}
                        placeholder="Your surname"
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-field">
                  <label>Email address</label>

                  <div className="settings-input settings-input--disabled">
                    <Mail size={18} />

                    <input value={email} disabled />
                  </div>

                  <small>Email changes require verification.</small>
                </div>

                <div className="settings-field">
                  <label>Account type</label>

                  <div className="settings-input settings-input--disabled">
                    <Utensils size={18} />

                    <input value={role || "customer"} disabled />
                  </div>
                </div>

                <div className="settings-actions">
                  <button type="submit" className="settings-save-button">
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====================================== */}
          {/* BALANCE & PAYMENTS */}
          {/* ====================================== */}

          {activeSection === "balance" && (
            <section className="settings-card settings-card--balance">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <WalletCards />
                </div>

                <div>
                  <h2>Balance & Payments</h2>

                  <p>
                    View Dish Dash credit, amounts owing and recent payment
                    information.
                  </p>
                </div>
              </div>

              {/* ====================================== */}
              {/* BALANCE HERO */}
              {/* ====================================== */}

              <div
                className={`settings-balance-hero settings-balance-hero--${balanceState}`}
              >
                <div className="settings-balance-hero-top">
                  <div>
                    <span className="settings-balance-label">
                      {balanceState === "credit"
                        ? "Available credit"
                        : balanceState === "debt"
                          ? "Outstanding balance"
                          : "Dish Dash balance"}
                    </span>

                    <strong className="settings-balance-amount">
                      {balanceVisible
                        ? formatCurrency(
                            balanceState === "debt"
                              ? amountOwed
                              : availableCredit,
                          )
                        : "R••••"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="settings-balance-reveal"
                    onClick={() => setBalanceVisible((current) => !current)}
                  >
                    {balanceVisible ? (
                      <>
                        <EyeOff size={18} />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye size={18} />
                        Reveal
                      </>
                    )}
                  </button>
                </div>

                {balanceState === "credit" && (
                  <p>
                    This credit belongs to you. Using it on a new order is
                    optional, and you can combine it with Cash or Card.
                  </p>
                )}

                {balanceState === "debt" && (
                  <p>
                    This amount must be settled before a new order can be
                    placed.
                  </p>
                )}

                {balanceState === "zero" && (
                  <p>
                    You currently have no Dish Dash credit and no outstanding
                    amount.
                  </p>
                )}
              </div>

              {/* ====================================== */}
              {/* BALANCE STATUS */}
              {/* ====================================== */}

              <div className="settings-balance-status-grid">
                <div className="settings-balance-stat">
                  <span>Available credit</span>

                  <strong>
                    {balanceVisible ? formatCurrency(availableCredit) : "R••••"}
                  </strong>

                  <small>Optional credit for future orders</small>
                </div>

                <div className="settings-balance-stat">
                  <span>Amount owing</span>

                  <strong
                    className={
                      amountOwed > 0 ? "settings-balance-stat-value--debt" : ""
                    }
                  >
                    {balanceVisible ? formatCurrency(amountOwed) : "R••••"}
                  </strong>

                  <small>Must be R0.00 before placing a new order</small>
                </div>
              </div>

              {/* ====================================== */}
              {/* BALANCE EXPLANATION */}
              {/* ====================================== */}

              <div className="settings-balance-rules">
                <div className="settings-balance-rule">
                  <div className="settings-balance-rule-icon settings-balance-rule-icon--credit">
                    <WalletCards size={20} />
                  </div>

                  <div>
                    <h3>Credit</h3>

                    <p>
                      Refunds or cash overpayments can be credited to your Dish
                      Dash balance.
                    </p>
                  </div>
                </div>

                <div className="settings-balance-rule">
                  <div className="settings-balance-rule-icon settings-balance-rule-icon--debit">
                    <Banknote size={20} />
                  </div>

                  <div>
                    <h3>Debit</h3>

                    <p>
                      Cash shortages or balance used on an order can reduce your
                      balance.
                    </p>
                  </div>
                </div>

                <div className="settings-balance-rule">
                  <div className="settings-balance-rule-icon">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h3>Protected balance</h3>

                    <p>
                      Balance adjustments should only be created by trusted Dish
                      Dash backend actions, not by the customer.
                    </p>
                  </div>
                </div>
              </div>

              {/* ====================================== */}
              {/* CURRENT / LAST PAYMENT */}
              {/* ====================================== */}

              <div className="settings-balance-subsection">
                <div className="settings-balance-subsection-heading">
                  <div>
                    <h3>Current payment selection</h3>

                    <p>Safe payment information from your current checkout.</p>
                  </div>
                </div>

                <div className="settings-payment-summary">
                  <div className="settings-payment-summary-icon">
                    <PaymentSummaryIcon size={21} />
                  </div>

                  <div className="settings-payment-summary-content">
                    <strong>{paymentSummary.title}</strong>

                    <span>{paymentSummary.description}</span>
                  </div>

                  {lastPaymentDetails?.balanceUsed > 0 && (
                    <span className="settings-payment-balance-used">
                      {formatCurrency(lastPaymentDetails.balanceUsed)} credit
                      used
                    </span>
                  )}
                </div>

                <div className="settings-payment-security-note">
                  <LockKeyhole size={18} />

                  <p>
                    Dish Dash should never store your full card number, CVV or
                    card PIN. Only safe card information such as the card brand,
                    last four digits and payment reference should be retained.
                  </p>
                </div>
              </div>

              {/* ====================================== */}
              {/* TRANSACTION HISTORY */}
              {/* ====================================== */}

              <div className="settings-balance-subsection">
                <div className="settings-balance-subsection-heading">
                  <div>
                    <h3>Balance history</h3>

                    <p>Credits and debits applied to your Dish Dash account.</p>
                  </div>

                  <History size={20} />
                </div>

                {balanceTransactions.length === 0 ? (
                  <div className="settings-balance-empty">
                    <History size={26} />

                    <strong>No balance transactions yet</strong>

                    <span>
                      Refunds, overpayments, shortages and balance usage will
                      appear here.
                    </span>
                  </div>
                ) : (
                  <div className="settings-balance-history">
                    {balanceTransactions.map((transaction, index) => {
                      const transactionType =
                        transaction?.type === "credit" ? "credit" : "debit";

                      const amount = Math.abs(Number(transaction?.amount) || 0);

                      return (
                        <article
                          key={
                            transaction?._id ||
                            transaction?.id ||
                            `${transaction?.createdAt || "transaction"}-${index}`
                          }
                          className="settings-balance-transaction"
                        >
                          <div
                            className={`settings-balance-transaction-icon settings-balance-transaction-icon--${transactionType}`}
                          >
                            {transactionType === "credit" ? (
                              <WalletCards size={18} />
                            ) : (
                              <Banknote size={18} />
                            )}
                          </div>

                          <div className="settings-balance-transaction-content">
                            <strong>
                              {transaction?.description ||
                                formatReason(transaction?.reason)}
                            </strong>

                            <span>
                              {formatTransactionDate(
                                transaction?.createdAt || transaction?.date,
                              )}

                              {transaction?.order_id
                                ? ` · Order ${String(
                                    transaction.order_id,
                                  ).slice(-6)}`
                                : ""}
                            </span>
                          </div>

                          <strong
                            className={`settings-balance-transaction-amount settings-balance-transaction-amount--${transactionType}`}
                          >
                            {transactionType === "credit" ? "+" : "-"}
                            {formatCurrency(amount)}
                          </strong>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="settings-actions">
                <Link to="/orders" className="settings-secondary-button">
                  View Orders
                </Link>
              </div>
            </section>
          )}

          {/* ====================================== */}
          {/* SECURITY */}
          {/* ====================================== */}

          {activeSection === "security" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <ShieldCheck />
                </div>

                <div>
                  <h2>Password & Security</h2>

                  <p>Keep your Dish Dash account secure.</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleChangePassword}>
                <div className="settings-field">
                  <label>Current password</label>

                  <div className="settings-input">
                    <LockKeyhole size={18} />

                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      className="settings-eye-button"
                      onClick={() =>
                        setShowCurrentPassword((current) => !current)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <label>New password</label>

                  <div className="settings-input">
                    <KeyRound size={18} />

                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                    />

                    <button
                      type="button"
                      className="settings-eye-button"
                      onClick={() => setShowNewPassword((current) => !current)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <label>Confirm new password</label>

                  <div className="settings-input">
                    <KeyRound size={18} />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      className="settings-eye-button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="settings-security-note">
                  <ShieldCheck size={18} />

                  <p>
                    Use at least 8 characters with an uppercase letter,
                    lowercase letter, number and special character.
                  </p>
                </div>

                <div className="settings-actions">
                  <button type="submit" className="settings-save-button">
                    <KeyRound size={18} />
                    Change Password
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====================================== */}
          {/* DELIVERY ADDRESS */}
          {/* ====================================== */}

          {activeSection === "address" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <MapPin />
                </div>

                <div>
                  <h2>Delivery address</h2>

                  <p>Manage your default delivery location.</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleSaveAddress}>
                <div className="settings-field">
                  <label>Street address</label>

                  <div className="settings-input">
                    <MapPin size={18} />

                    <input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="30 Kays Avenue"
                    />
                  </div>
                </div>

                <div className="settings-grid">
                  <div className="settings-field">
                    <label>Suburb</label>

                    <input
                      className="settings-simple-input"
                      value={suburb}
                      onChange={(event) => setSuburb(event.target.value)}
                      placeholder="Sandton"
                    />
                  </div>

                  <div className="settings-field">
                    <label>City</label>

                    <input
                      className="settings-simple-input"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Johannesburg"
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label>Postal code</label>

                  <input
                    className="settings-simple-input"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    placeholder="2196"
                  />
                </div>

                <div className="settings-actions">
                  <button type="submit" className="settings-save-button">
                    <Save size={18} />
                    Save Address
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====================================== */}
          {/* NOTIFICATIONS */}
          {/* ====================================== */}

          {activeSection === "notifications" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <Bell />
                </div>

                <div>
                  <h2>Notifications</h2>

                  <p>
                    Choose which Dish Dash notifications you want to receive.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-list">
                <SettingToggle
                  icon={Smartphone}
                  title="Order updates"
                  description="Receive updates when your order status changes."
                  checked={orderUpdates}
                  onChange={setOrderUpdates}
                />

                <SettingToggle
                  icon={Mail}
                  title="Email notifications"
                  description="Receive important account and order updates by email."
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                />

                <SettingToggle
                  icon={Bell}
                  title="Promotions & offers"
                  description="Receive discounts, restaurant specials and promotional offers."
                  checked={promotions}
                  onChange={setPromotions}
                />
              </div>
            </section>
          )}

          {/* ====================================== */}
          {/* PREFERENCES */}
          {/* ====================================== */}

          {activeSection === "preferences" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">
                  <Settings />
                </div>

                <div>
                  <h2>Preferences</h2>

                  <p>Personalise your Dish Dash experience.</p>
                </div>
              </div>

              <div className="settings-preference-card">
                <div>
                  <h3>Preferred language</h3>

                  <p>Choose the language used throughout Dish Dash.</p>
                </div>

                <select defaultValue="english">
                  <option value="english">English</option>

                  <option value="zulu">isiZulu</option>
                </select>
              </div>

              <div className="settings-preference-card">
                <div>
                  <h3>Currency</h3>

                  <p>Prices are currently shown in South African Rand.</p>
                </div>

                <select defaultValue="zar">
                  <option value="zar">ZAR (R)</option>
                </select>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

// ======================================
// TOGGLE COMPONENT
// ======================================

function SettingToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-information">
        <div className="settings-toggle-icon">
          <Icon size={20} />
        </div>

        <div>
          <h3>{title}</h3>

          <p>{description}</p>
        </div>
      </div>

      <label className="settings-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />

        <span className="settings-slider" />
      </label>
    </div>
  );
}

export default ProfileSettings;
