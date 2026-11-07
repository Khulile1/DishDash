import { NavLink } from "react-router-dom";
import { ArrowUp, Clock3, Mail, MapPin, Phone } from "lucide-react";

import "../../styles/PublicFooter.css";

function PublicFooter() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="public-footer">
      <div className="public-footer-main">
        <div className="public-footer-container public-footer-grid">
          {/* EXPLORE */}
          <nav className="public-footer-column" aria-label="Explore">
            <h2>Explore</h2>

            <ul>
              <li>
                <NavLink to="/">Home</NavLink>
              </li>
              <li>
                <NavLink to="/how-it-works">How it works</NavLink>
              </li>
              <li>
                <NavLink to="/restaurants">Restaurants</NavLink>
              </li>
            </ul>
          </nav>

          {/* SUPPORT */}
          <nav className="public-footer-column" aria-label="Support">
            <h2>Support</h2>

            <ul>
              <li>
                <NavLink to="/contact-us">Contact Us</NavLink>
              </li>
              <li>
                <NavLink to="/help-centre">Help Centre</NavLink>
              </li>
              <li>
                <NavLink to="/faq">Frequently Asked Questions</NavLink>
              </li>
              <li>
                <NavLink to="/become-a-partner">
                  Become a Restaurant Partner
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* CONTACT */}
          <section className="public-footer-column public-footer-contact">
            <h2>Contact Us</h2>

            <ul>
              <li>
                <MapPin size={20} />
                <span>
                  Johannesburg, Gauteng
                  <br />
                  South Africa
                </span>
              </li>
              <li>
                <Phone size={20} />
                <a href="tel:+27100000000">+27 10 000 0000</a>
              </li>
              <li>
                <Mail size={20} />
                <a href="mailto:support@dishdash.co.za">
                  support@dishdash.co.za
                </a>
              </li>
              <li>
                <Clock3 size={20} />
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

      <div className="public-footer-bottom">
        <div className="public-footer-container public-footer-bottom-content">
          <p>© {currentYear} Dish Dash. All rights reserved.</p>

          <button
            type="button"
            className="public-footer-top"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp size={22} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
