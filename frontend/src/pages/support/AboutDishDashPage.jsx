import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartHandshake,
  MapPinned,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/SupportPages.css";

function AboutDishDashPage() {
  return (
    <div className="support-page-layout">
      <Navbar />

      <main className="support-page">
        <div className="support-container">
          <section className="support-hero">
            <span className="support-eyebrow">About Dish Dash</span>

            <h1>Fast, simple food delivery built for everyday life.</h1>

            <p>
              Dish Dash connects customers with great local restaurants, making
              it easy to discover meals, place orders, track delivery and enjoy
              food from the places they love.
            </p>

            <div className="support-hero-actions">
              <Link to="/restaurants" className="support-primary-button">
                Browse Restaurants
                <ArrowRight size={17} />
              </Link>

              <Link to="/become-a-partner" className="support-secondary-button">
                Become a Partner
              </Link>
            </div>
          </section>

          <section className="support-grid support-grid--three">
            <article className="support-info-card">
              <div className="support-info-icon">
                <UtensilsCrossed size={22} />
              </div>
              <h3>Restaurant discovery</h3>
              <p>
                Find nearby restaurants, explore menus and choose from different
                cuisines in one place.
              </p>
            </article>

            <article className="support-info-card">
              <div className="support-info-icon">
                <Truck size={22} />
              </div>
              <h3>Convenient delivery</h3>
              <p>
                Get orders delivered to your home, work or saved address with a
                simple checkout flow.
              </p>
            </article>

            <article className="support-info-card">
              <div className="support-info-icon">
                <ShieldCheck size={22} />
              </div>
              <h3>Reliable ordering</h3>
              <p>
                Track your order process, confirm your order details and move
                securely through checkout.
              </p>
            </article>
          </section>

          <section className="support-section">
            <div className="support-section-heading">
              <h2>What Dish Dash does</h2>
              <p>
                We help customers, restaurants and delivery operations work
                together in one connected platform.
              </p>
            </div>

            <div className="support-grid support-grid--two">
              <article className="support-feature-card">
                <div className="support-feature-icon">
                  <ShoppingBag size={22} />
                </div>

                <div>
                  <h3>For customers</h3>
                  <p>
                    Browse restaurants, search menu items, save favourites, add
                    items to cart, manage addresses and place orders quickly.
                  </p>
                </div>
              </article>

              <article className="support-feature-card">
                <div className="support-feature-icon">
                  <HeartHandshake size={22} />
                </div>

                <div>
                  <h3>For restaurant partners</h3>
                  <p>
                    Restaurants can manage their profile, menu, stock, orders
                    and analytics while reaching more customers.
                  </p>
                </div>
              </article>

              <article className="support-feature-card">
                <div className="support-feature-icon">
                  <MapPinned size={22} />
                </div>

                <div>
                  <h3>Address-based delivery</h3>
                  <p>
                    Saved addresses and route-based delivery help customers
                    receive food where they need it most.
                  </p>
                </div>
              </article>

              <article className="support-feature-card">
                <div className="support-feature-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h3>Built for growth</h3>
                  <p>
                    Dish Dash is designed to keep growing with better ordering,
                    support, payments and restaurant operations.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="support-section">
            <div className="support-section-heading">
              <h2>Our values</h2>
              <p>The platform is built around simplicity, speed and trust.</p>
            </div>

            <div className="support-values">
              <article className="support-value-card">
                <h3>Simple</h3>
                <p>
                  Easy to use for customers placing orders and restaurants
                  managing their business.
                </p>
              </article>

              <article className="support-value-card">
                <h3>Fast</h3>
                <p>
                  Quick discovery, smooth cart flow and efficient movement from
                  browsing to payment.
                </p>
              </article>

              <article className="support-value-card">
                <h3>Reliable</h3>
                <p>
                  Clear order states, cleaner account flows and support pages
                  that help users solve problems faster.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AboutDishDashPage;
