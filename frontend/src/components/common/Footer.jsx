// ======================================
// IMPORTS
// ======================================

import { NavLink } from "react-router-dom";

// ======================================
// LUCIDE ICONS
// ======================================

import {
  ArrowUp,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

// ======================================
// SOCIAL MEDIA BRAND ICONS
// ======================================

import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

// ======================================
// ASSETS
// ======================================

import logo from "../../assets/logo.png";

// ======================================
// STYLES
// ======================================

import "../../styles/Footer.css";

// ======================================
// FOOTER COMPONENT
// ======================================

function Footer() {
  // ======================================
  // CURRENT YEAR
  // ======================================

  const currentYear = new Date().getFullYear();

  // ======================================
  // SCROLL TO TOP
  // ======================================

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================
  // FOOTER
  // ======================================

  return (
    <footer className="site-footer">
      {/* ====================================== */}
      {/* SERVICE HIGHLIGHTS */}
      {/* ====================================== */}

      <div className="footer-highlights">
        <div className="footer-container footer-highlights-grid">
          {/* LOCAL RESTAURANTS */}

          <div className="footer-highlight">
            <div className="footer-highlight-icon">
              <UtensilsCrossed size={23} />
            </div>

            <div>
              <h3>Local Restaurants</h3>

              <p>Discover restaurants operating near you.</p>
            </div>
          </div>

          {/* EASY ORDERING */}

          <div className="footer-highlight">
            <div className="footer-highlight-icon">
              <ShoppingBag size={23} />
            </div>

            <div>
              <h3>Easy Ordering</h3>

              <p>Browse menus and place your order online.</p>
            </div>
          </div>

          {/* SECURE EXPERIENCE */}

          <div className="footer-highlight">
            <div className="footer-highlight-icon">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h3>Secure Experience</h3>

              <p>Your account and order information are protected.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* MAIN FOOTER CONTENT */}
      {/* ====================================== */}

      <div className="footer-container footer-main">
        <div className="footer-grid">
          {/* ====================================== */}
          {/* BRAND INFORMATION */}
          {/* ====================================== */}

          <section className="footer-brand-section">
            <NavLink
              to="/"
              className="footer-brand"
              aria-label="Go to Dish Dash home page"
            >
              <div className="footer-logo-container">
                <img src={logo} alt="Dish Dash logo" className="footer-logo" />
              </div>

              <span className="footer-brand-name">
                Dish<span>Dash</span>
              </span>
            </NavLink>

            <p className="footer-description">
              Dish Dash connects customers with local restaurants, making it
              easier to discover meals, explore menus and manage food orders
              from one convenient platform.
            </p>

            {/* ====================================== */}
            {/* SOCIAL MEDIA LINKS */}
            {/* ====================================== */}

            <div className="footer-social-section">
              <p className="footer-social-title">Follow us</p>

              <div
                className="footer-social-links"
                aria-label="Dish Dash social media links"
              >
                {/* FACEBOOK */}

                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Dish Dash on Facebook"
                  className="footer-social-link"
                >
                  <FaFacebookF size={18} />
                </a>

                {/* INSTAGRAM */}

                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Dish Dash on Instagram"
                  className="footer-social-link"
                >
                  <FaInstagram size={19} />
                </a>

                {/* YOUTUBE */}

                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Dish Dash on YouTube"
                  className="footer-social-link"
                >
                  <FaYoutube size={20} />
                </a>
              </div>
            </div>
          </section>

          {/* ====================================== */}
          {/* EXPLORE LINKS */}
          {/* ====================================== */}

          <nav
            className="footer-column"
            aria-labelledby="footer-explore-heading"
          >
            <h2 id="footer-explore-heading" className="footer-heading">
              Explore
            </h2>

            <ul className="footer-link-list">
              {/* HOME */}

              <li>
                <NavLink to="/" className="footer-link">
                  Home
                </NavLink>
              </li>

              {/* RESTAURANTS */}

              <li>
                <NavLink to="/restaurants" className="footer-link">
                  Restaurants
                </NavLink>
              </li>

              {/* CART */}

              <li>
                <NavLink to="/cart" className="footer-link">
                  My Cart
                </NavLink>
              </li>

              {/* ORDERS */}

              <li>
                <NavLink to="/orders" className="footer-link">
                  My Orders
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* ====================================== */}
          {/* ACCOUNT LINKS */}
          {/* ====================================== */}

          <nav
            className="footer-column"
            aria-labelledby="footer-account-heading"
          >
            <h2 id="footer-account-heading" className="footer-heading">
              My Account
            </h2>

            <ul className="footer-link-list">
              {/* PROFILE */}

              <li>
                <NavLink to="/profile" className="footer-link">
                  My Profile
                </NavLink>
              </li>

              {/* SETTINGS */}

              <li>
                <NavLink to="/settings" className="footer-link">
                  Settings
                </NavLink>
              </li>

              {/* LOGIN */}

              <li>
                <NavLink to="/login" className="footer-link">
                  Login
                </NavLink>
              </li>

              {/* CREATE ACCOUNT */}

              <li>
                <NavLink to="/register" className="footer-link">
                  Create Account
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* ====================================== */}
          {/* SUPPORT LINKS */}
          {/* ====================================== */}

          <nav
            className="footer-column"
            aria-labelledby="footer-support-heading"
          >
            <h2 id="footer-support-heading" className="footer-heading">
              Support
            </h2>

            <ul className="footer-link-list">
              {/* ABOUT */}

              <li>
                <NavLink to="/about-dish-dash" className="footer-link">
                  About Dish Dash
                </NavLink>
              </li>

              {/* CONTACT */}

              <li>
                <NavLink to="/contact-us" className="footer-link">
                  Contact Us
                </NavLink>
              </li>

              {/* HELP */}

              <li>
                <NavLink to="/help-centre" className="footer-link">
                  Help Centre
                </NavLink>
              </li>

              {/* FAQ */}

              <li>
                <NavLink to="/faq" className="footer-link">
                  Frequently Asked Questions
                </NavLink>
              </li>

              {/* RESTAURANT PARTNER */}

              <li>
                <NavLink to="/become-a-partner" className="footer-link">
                  Become a Restaurant Partner
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* ====================================== */}
          {/* CONTACT INFORMATION */}
          {/* ====================================== */}

          <section className="footer-column footer-contact-section">
            <h2 className="footer-heading">Contact Us</h2>

            <ul className="footer-contact-list">
              {/* LOCATION */}

              <li className="footer-contact-item">
                <MapPin size={19} className="footer-contact-icon" />

                <span>
                  Johannesburg, Gauteng
                  <br />
                  South Africa
                </span>
              </li>

              {/* PHONE */}

              <li className="footer-contact-item">
                <Phone size={19} className="footer-contact-icon" />

                <a href="tel:+27100000000">+27 10 000 0000</a>
              </li>

              {/* EMAIL */}

              <li className="footer-contact-item">
                <Mail size={19} className="footer-contact-icon" />

                <a href="mailto:support@dishdash.co.za">
                  support@dishdash.co.za
                </a>
              </li>

              {/* HOURS */}

              <li className="footer-contact-item">
                <Clock3 size={19} className="footer-contact-icon" />

                <span>
                  Monday – Sunday
                  <br />
                  08:00 – 22:00
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* ====================================== */}
      {/* FOOTER BOTTOM */}
      {/* ====================================== */}

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-content">
          {/* COPYRIGHT */}

          <p className="footer-copyright">
            © {currentYear} Dish Dash. All rights reserved.
          </p>

          {/* ====================================== */}
          {/* LEGAL LINKS */}
          {/* ====================================== */}

          <nav className="footer-legal-links" aria-label="Legal links">
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>

            <NavLink to="/terms">Terms and Conditions</NavLink>

            <NavLink to="/cookie-policy">Cookie Policy</NavLink>
          </nav>

          {/* ====================================== */}
          {/* SCROLL TO TOP */}
          {/* ====================================== */}

          <button
            type="button"
            className="footer-scroll-button"
            onClick={scrollToTop}
            aria-label="Scroll back to the top of the page"
            title="Back to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}

// ======================================
// EXPORT FOOTER
// ======================================

export default Footer;
