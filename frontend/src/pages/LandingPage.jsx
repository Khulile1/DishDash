// ======================================
// IMPORTS
// ======================================

import { Link } from "react-router-dom";

import "../styles/LandingPage.css";

import PublicNavbar from "../components/common/PublicNavbar";
import PublicFooter from "../components/common/PublicFooter";

import heroVideo from "../assets/dish_dash_sketch_to_delivery_hero.mp4";

// ======================================
// LANDING PAGE
// ======================================

function LandingPage() {
  return (
    <div className="dish-page">
      {/* ======================================
          PUBLIC NAVBAR
      ====================================== */}

      <PublicNavbar overlay />

      {/* ======================================
          LANDING HERO
      ====================================== */}

      <main className="dish-landing">
        <section className="dish-hero">
          {/* VIDEO */}

          <video
            className="dish-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>

          {/* OVERLAY */}

          <div className="dish-hero-overlay" />

          {/* HERO CONTENT */}

          <div className="dish-hero-content">
            <span className="dish-eyebrow">Local food. Delivered.</span>

            <h1>
              Every delivery starts
              <br />
              with a craving.
            </h1>

            <p>Your favourite local meals, delivered fast.</p>

            <div className="dish-hero-actions">
              <Link to="/register" className="dish-primary-button">
                Order Now
              </Link>

              <Link to="/restaurants" className="dish-secondary-button">
                Explore restaurants
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* STATS */}

          <div className="dish-stats">
            <div className="dish-stat">
              <strong>Fast</strong>
              <span>Local delivery</span>
            </div>

            <div className="dish-stat">
              <strong>Fresh</strong>
              <span>Meals you love</span>
            </div>

            <div className="dish-stat">
              <strong>Easy</strong>
              <span>Order &amp; track</span>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================
          PUBLIC FOOTER
      ====================================== */}

      <PublicFooter />
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default LandingPage;
