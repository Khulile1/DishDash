import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/LegalPages.css";

function TermsAndConditionsPage() {
  return (
    <div className="legal-page-layout">
      <Navbar />

      <main className="legal-page">
        <div className="legal-container">
          <section className="legal-hero">
            <span className="legal-eyebrow">Dish Dash Legal</span>

            <h1>Terms and Conditions</h1>

            <p>
              These Terms and Conditions govern your use of the Dish Dash
              platform and its customer and restaurant services.
            </p>

            <span className="legal-updated">
              Effective date: 28 September 2026
            </span>
          </section>

          <div className="legal-content-layout">
            <aside className="legal-sidebar">
              <h2>Contents</h2>

              <a href="#acceptance">1. Acceptance</a>

              <a href="#accounts">2. Accounts</a>

              <a href="#restaurants">3. Restaurants</a>

              <a href="#orders">4. Orders</a>

              <a href="#prices">5. Prices and Fees</a>

              <a href="#payments">6. Payments</a>

              <a href="#delivery">7. Delivery</a>

              <a href="#cancellations">8. Cancellations</a>

              <a href="#conduct">9. User Conduct</a>

              <a href="#availability">10. Platform Availability</a>

              <a href="#liability">11. Liability</a>

              <a href="#changes">12. Changes</a>

              <a href="#contact">13. Contact</a>
            </aside>

            <article className="legal-document">
              <section id="acceptance">
                <h2>1. Acceptance of These Terms</h2>

                <p>
                  By creating an account, accessing Dish Dash or using its
                  services, you agree to these Terms and Conditions.
                </p>

                <p>
                  If you do not agree with these terms, you should not use the
                  platform.
                </p>
              </section>

              <section id="accounts">
                <h2>2. User Accounts</h2>

                <p>
                  Users must provide accurate information when registering and
                  are responsible for protecting their account credentials.
                </p>

                <p>
                  You are responsible for activity performed using your account
                  unless otherwise required by applicable law.
                </p>
              </section>

              <section id="restaurants">
                <h2>3. Restaurant Partners</h2>

                <p>
                  Restaurant partners are responsible for keeping their
                  restaurant profile, operating hours, menu, prices, product
                  availability and inventory information reasonably accurate.
                </p>

                <p>
                  Restaurants are responsible for preparing orders in accordance
                  with the order information they receive through Dish Dash.
                </p>
              </section>

              <section id="orders">
                <h2>4. Orders</h2>

                <p>
                  Customers can select restaurant items, add them to a cart and
                  submit an order through the Dish Dash checkout process.
                </p>

                <p>
                  An order may move through several statuses while confirmation,
                  payment, preparation and delivery are completed.
                </p>

                <p>
                  Dish Dash may prevent an order from proceeding where required
                  information is missing or where the restaurant or selected
                  items are unavailable.
                </p>
              </section>

              <section id="prices">
                <h2>5. Prices, Delivery Fees and Charges</h2>

                <p>The amount shown at checkout may include:</p>

                <ul>
                  <li>Menu item prices.</li>
                  <li>Delivery charges.</li>
                  <li>Applicable service charges.</li>
                  <li>Other clearly disclosed charges.</li>
                </ul>

                <p>
                  Restaurants are responsible for maintaining the prices
                  associated with their menu items.
                </p>
              </section>

              <section id="payments">
                <h2>6. Payments</h2>

                <p>
                  Customers must use a supported payment method where payment is
                  required.
                </p>

                <p>
                  An order may remain unpaid or awaiting payment until the
                  payment process has been successfully completed.
                </p>

                <p>
                  Failed or incomplete transactions may prevent an order from
                  moving to the next processing stage.
                </p>
              </section>

              <section id="delivery">
                <h2>7. Delivery</h2>

                <p>
                  Customers are responsible for providing a complete and
                  accurate delivery address.
                </p>

                <p>
                  Delivery estimates can be affected by distance, traffic,
                  restaurant preparation time, demand, weather and other
                  operational conditions.
                </p>

                <p>
                  Estimated delivery times are therefore estimates rather than
                  guaranteed arrival times.
                </p>
              </section>

              <section id="cancellations">
                <h2>8. Cancellations and Refunds</h2>

                <p>
                  Whether an order may be cancelled can depend on its current
                  processing stage.
                </p>

                <p>
                  Orders that have already entered preparation or delivery may
                  be subject to different cancellation conditions.
                </p>

                <p>
                  Where a refund is approved, processing time may also depend on
                  the payment provider used for the original transaction.
                </p>
              </section>

              <section id="conduct">
                <h2>9. Acceptable Use</h2>

                <p>Users may not use Dish Dash to:</p>

                <ul>
                  <li>Attempt unauthorised access to another account.</li>

                  <li>
                    Interfere with the security or operation of the platform.
                  </li>

                  <li>
                    Provide intentionally false or fraudulent information.
                  </li>

                  <li>
                    Abuse promotions, payment processes or restaurant systems.
                  </li>

                  <li>Use Dish Dash for unlawful activities.</li>
                </ul>
              </section>

              <section id="availability">
                <h2>10. Platform Availability</h2>

                <p>
                  Dish Dash aims to keep the platform available, but
                  uninterrupted service cannot be guaranteed.
                </p>

                <p>
                  Maintenance, technical faults, third-party services and
                  network interruptions may temporarily affect functionality.
                </p>
              </section>

              <section id="liability">
                <h2>11. Limitation of Liability</h2>

                <p>
                  To the extent permitted by applicable law, liability may be
                  limited for losses caused by events outside Dish Dash's
                  reasonable control or by incorrect information supplied by
                  users, restaurants or third-party service providers.
                </p>

                <p>
                  Nothing in these Terms is intended to exclude rights that
                  cannot lawfully be excluded.
                </p>
              </section>

              <section id="changes">
                <h2>12. Changes to These Terms</h2>

                <p>
                  Dish Dash may update these Terms as the service develops.
                  Material updates should be reflected by changing the effective
                  date displayed above.
                </p>
              </section>

              <section id="contact">
                <h2>13. Contact</h2>

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

export default TermsAndConditionsPage;
