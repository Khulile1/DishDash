import { Link } from "react-router-dom";
import {
  ArrowRight,
  CreditCard,
  Heart,
  MapPinned,
  ShoppingCart,
  Store,
  Truck,
  UserCircle2,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/SupportPages.css";

function HelpCentrePage() {
  const helpTopics = [
    {
      icon: <ShoppingCart size={22} />,
      title: "Placing an order",
      description:
        "Learn how to browse restaurants, add menu items to cart and place your order.",
    },
    {
      icon: <Truck size={22} />,
      title: "Tracking and delivery",
      description:
        "Understand how delivery flow works and how your order moves after checkout.",
    },
    {
      icon: <CreditCard size={22} />,
      title: "Payments",
      description:
        "Get help with payment methods, payment steps and confirming payment details.",
    },
    {
      icon: <MapPinned size={22} />,
      title: "Addresses",
      description:
        "Find out how to add, save and manage home, work and other delivery addresses.",
    },
    {
      icon: <Heart size={22} />,
      title: "Favourites",
      description:
        "Save restaurants to favourites and quickly access them later from your account.",
    },
    {
      icon: <UserCircle2 size={22} />,
      title: "Account support",
      description:
        "Manage login, profile, session and general customer account support.",
    },
  ];

  return (
    <div className="support-page-layout">
      <Navbar />

      <main className="support-page">
        <div className="support-container">
          <section className="support-hero support-hero--compact">
            <span className="support-eyebrow">Help Centre</span>
            <h1>Find answers faster.</h1>
            <p>
              Explore the main areas customers and restaurant users normally
              need help with.
            </p>
          </section>

          <section className="support-grid support-grid--three">
            {helpTopics.map((topic) => (
              <article key={topic.title} className="support-info-card">
                <div className="support-info-icon">{topic.icon}</div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </article>
            ))}
          </section>

          <section className="support-section">
            <div className="support-section-heading">
              <h2>Popular help topics</h2>
              <p>Quick starting points for common support journeys.</p>
            </div>

            <div className="support-grid support-grid--two">
              <article className="support-resource-card">
                <div className="support-resource-icon">
                  <Store size={22} />
                </div>

                <div>
                  <h3>Restaurant browsing</h3>
                  <p>
                    Search restaurants, use category pills and open restaurant
                    pages to browse menus and details.
                  </p>
                </div>
              </article>

              <article className="support-resource-card">
                <div className="support-resource-icon">
                  <ShoppingCart size={22} />
                </div>

                <div>
                  <h3>Cart and checkout</h3>
                  <p>
                    Add items, update quantities, continue to cart and move
                    through checkout and payment steps.
                  </p>
                </div>
              </article>

              <article className="support-resource-card">
                <div className="support-resource-icon">
                  <Truck size={22} />
                </div>

                <div>
                  <h3>Orders page</h3>
                  <p>
                    Review your orders, follow the flow and understand order
                    statuses after confirmation.
                  </p>
                </div>
              </article>

              <article className="support-resource-card">
                <div className="support-resource-icon">
                  <CreditCard size={22} />
                </div>

                <div>
                  <h3>Payment flow</h3>
                  <p>
                    Understand when to use payment method selection, order
                    payment steps and payment records.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="support-cta-card">
            <div>
              <h2>Still need help?</h2>
              <p>
                If you cannot find the answer you need, contact support or check
                the FAQ page.
              </p>
            </div>

            <div className="support-hero-actions">
              <Link to="/contact-us" className="support-primary-button">
                Contact Us
                <ArrowRight size={17} />
              </Link>

              <Link to="/faq" className="support-secondary-button">
                Open FAQ
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HelpCentrePage;
