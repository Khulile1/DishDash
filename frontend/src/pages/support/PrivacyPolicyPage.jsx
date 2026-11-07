import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/LegalPages.css";

function PrivacyPolicyPage() {
  return (
    <div className="legal-page-layout">
      <Navbar />

      <main className="legal-page">
        <div className="legal-container">
          <section className="legal-hero">
            <span className="legal-eyebrow">Dish Dash Legal</span>

            <h1>Privacy Policy</h1>

            <p>
              This Privacy Policy explains how Dish Dash collects, uses and
              protects information when you use our platform.
            </p>

            <span className="legal-updated">
              Effective date: 28 September 2026
            </span>
          </section>

          <div className="legal-content-layout">
            <aside className="legal-sidebar">
              <h2>Contents</h2>

              <a href="#information">1. Information We Collect</a>

              <a href="#use">2. How We Use Information</a>

              <a href="#location">3. Location Information</a>

              <a href="#payments">4. Payment Information</a>

              <a href="#sharing">5. Information Sharing</a>

              <a href="#retention">6. Data Retention</a>

              <a href="#security">7. Security</a>

              <a href="#rights">8. Your Rights</a>

              <a href="#cookies">9. Cookies</a>

              <a href="#changes">10. Changes</a>

              <a href="#contact">11. Contact Us</a>
            </aside>

            <article className="legal-document">
              <section id="information">
                <h2>1. Information We Collect</h2>

                <p>
                  Dish Dash may collect information that you provide when
                  creating an account, placing an order, managing your profile
                  or contacting support.
                </p>

                <h3>Account information</h3>

                <p>
                  This may include your name, email address, phone number,
                  account role and login information.
                </p>

                <h3>Delivery information</h3>

                <p>
                  We may collect delivery addresses and related location
                  information needed to calculate delivery routes and complete
                  orders.
                </p>

                <h3>Order information</h3>

                <p>
                  Dish Dash may store details about restaurants, menu items,
                  quantities, prices, delivery charges, payment methods and
                  order history.
                </p>
              </section>

              <section id="use">
                <h2>2. How We Use Your Information</h2>

                <p>
                  We use information to operate and improve Dish Dash, including
                  to:
                </p>

                <ul>
                  <li>Create and manage user accounts.</li>

                  <li>Process restaurant and customer orders.</li>

                  <li>Calculate delivery distances and charges.</li>

                  <li>Display relevant restaurant and menu information.</li>

                  <li>Process and record payments.</li>

                  <li>Provide customer and restaurant support.</li>

                  <li>Detect misuse and protect platform security.</li>

                  <li>Improve the performance and usability of Dish Dash.</li>
                </ul>
              </section>

              <section id="location">
                <h2>3. Location Information</h2>

                <p>
                  Dish Dash may use a delivery address or location information
                  to identify nearby restaurants, estimate routes, calculate
                  delivery distances and determine delivery costs.
                </p>

                <p>
                  Location information is used only where required for platform
                  functionality or where you have provided the relevant
                  information.
                </p>
              </section>

              <section id="payments">
                <h2>4. Payment Information</h2>

                <p>
                  Dish Dash may process information relating to your selected
                  payment method and payment status.
                </p>

                <p>
                  Where third-party payment providers are used, payment
                  processing may also be subject to the provider's own privacy
                  and security practices.
                </p>
              </section>

              <section id="sharing">
                <h2>5. How Information May Be Shared</h2>

                <p>
                  Information may be shared where necessary to provide Dish Dash
                  services. This can include:
                </p>

                <ul>
                  <li>Restaurants fulfilling customer orders.</li>

                  <li>
                    Delivery or routing services required to complete
                    deliveries.
                  </li>

                  <li>Payment providers processing transactions.</li>

                  <li>
                    Service providers supporting the operation of the platform.
                  </li>

                  <li>
                    Authorities where disclosure is required by applicable law.
                  </li>
                </ul>

                <p>
                  Dish Dash does not intend to sell personal information as a
                  standalone commercial product.
                </p>
              </section>

              <section id="retention">
                <h2>6. Data Retention</h2>

                <p>
                  Information may be retained for as long as needed to operate
                  the platform, maintain transaction records, resolve disputes,
                  prevent fraud and meet applicable legal obligations.
                </p>
              </section>

              <section id="security">
                <h2>7. Security</h2>

                <p>
                  Dish Dash uses reasonable technical and organisational
                  measures designed to protect account, order and platform
                  information.
                </p>

                <p>
                  No online system can guarantee absolute security. Users should
                  keep passwords and account credentials confidential.
                </p>
              </section>

              <section id="rights">
                <h2>8. Your Privacy Rights</h2>

                <p>
                  Subject to applicable law, you may have rights relating to
                  your personal information, including the ability to request
                  access, correction or deletion of certain information.
                </p>

                <p>
                  You may contact Dish Dash if you have questions about personal
                  information associated with your account.
                </p>
              </section>

              <section id="cookies">
                <h2>9. Cookies and Similar Technologies</h2>

                <p>
                  Dish Dash may use cookies or similar browser technologies for
                  authentication, preferences, security and platform
                  functionality.
                </p>

                <p>More information is available in our Cookie Policy.</p>
              </section>

              <section id="changes">
                <h2>10. Changes to This Policy</h2>

                <p>
                  Dish Dash may update this Privacy Policy as the platform
                  develops or legal requirements change. The effective date
                  displayed on this page should be updated when material changes
                  are made.
                </p>
              </section>

              <section id="contact">
                <h2>11. Contact Us</h2>

                <p>Questions about this Privacy Policy can be sent to:</p>

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

export default PrivacyPolicyPage;
