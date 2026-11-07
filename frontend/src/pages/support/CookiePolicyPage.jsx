import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/LegalPages.css";

function CookiePolicyPage() {
  return (
    <div className="legal-page-layout">
      <Navbar />

      <main className="legal-page">
        <div className="legal-container">
          <section className="legal-hero">
            <span className="legal-eyebrow">Dish Dash Legal</span>

            <h1>Cookie Policy</h1>

            <p>
              This Cookie Policy explains how cookies and similar browser
              technologies may be used when you access Dish Dash.
            </p>

            <span className="legal-updated">
              Effective date: 28 September 2026
            </span>
          </section>

          <div className="legal-content-layout">
            <aside className="legal-sidebar">
              <h2>Contents</h2>

              <a href="#cookies">1. What Are Cookies?</a>

              <a href="#why">2. Why We Use Cookies</a>

              <a href="#types">3. Types of Cookies</a>

              <a href="#storage">4. Browser Storage</a>

              <a href="#third-party">5. Third Parties</a>

              <a href="#manage">6. Managing Cookies</a>

              <a href="#changes">7. Changes</a>

              <a href="#contact">8. Contact</a>
            </aside>

            <article className="legal-document">
              <section id="cookies">
                <h2>1. What Are Cookies?</h2>

                <p>
                  Cookies are small pieces of information that a website can
                  store in a browser to help remember information about a visit
                  or session.
                </p>

                <p>
                  Similar browser technologies may also be used to provide
                  platform functionality.
                </p>
              </section>

              <section id="why">
                <h2>2. Why Dish Dash Uses Cookies</h2>

                <p>Cookies and related technologies may be used to:</p>

                <ul>
                  <li>Maintain authentication and user sessions.</li>

                  <li>Remember selected settings and preferences.</li>

                  <li>Support security features.</li>

                  <li>
                    Maintain cart or account-related state where appropriate.
                  </li>

                  <li>Understand how the platform is being used.</li>

                  <li>Improve application performance and user experience.</li>
                </ul>
              </section>

              <section id="types">
                <h2>3. Types of Cookies</h2>

                <div className="legal-cookie-grid">
                  <div className="legal-cookie-card">
                    <span>Essential</span>

                    <h3>Required Cookies</h3>

                    <p>
                      Needed for important functionality such as authentication,
                      security and account sessions.
                    </p>
                  </div>

                  <div className="legal-cookie-card">
                    <span>Preferences</span>

                    <h3>Preference Cookies</h3>

                    <p>
                      May remember selections or settings to make future visits
                      more convenient.
                    </p>
                  </div>

                  <div className="legal-cookie-card">
                    <span>Performance</span>

                    <h3>Analytics Cookies</h3>

                    <p>
                      May help understand application performance and how users
                      interact with Dish Dash.
                    </p>
                  </div>
                </div>
              </section>

              <section id="storage">
                <h2>4. Local and Browser Storage</h2>

                <p>
                  Some Dish Dash functionality may also use browser storage
                  technologies rather than traditional cookies.
                </p>

                <p>
                  These technologies can be used to maintain temporary
                  application information or user-specific preferences.
                </p>
              </section>

              <section id="third-party">
                <h2>5. Third-Party Services</h2>

                <p>
                  Services integrated into Dish Dash, such as payment, mapping
                  or analytics providers, may use their own cookies or related
                  technologies.
                </p>

                <p>
                  Their processing is subject to their respective policies where
                  applicable.
                </p>
              </section>

              <section id="manage">
                <h2>6. Managing Cookies</h2>

                <p>
                  Most modern browsers allow you to view, block or remove
                  cookies from browser settings.
                </p>

                <p>
                  Blocking essential cookies or storage may affect features such
                  as login sessions and other platform functionality.
                </p>
              </section>

              <section id="changes">
                <h2>7. Changes to This Cookie Policy</h2>

                <p>
                  Dish Dash may update this Cookie Policy when platform
                  functionality or cookie practices change.
                </p>
              </section>

              <section id="contact">
                <h2>8. Contact Us</h2>

                <div className="legal-contact-box">
                  <strong>Dish Dash</strong>

                  <span>Johannesburg, Gauteng</span>

                  <span>South Africa</span>

                  <a href="mailto:support@dishdash.co.za">
                    support@dishdash.co.za
                  </a>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CookiePolicyPage;
