import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Search,
  ShoppingBag,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "../../components/common/PublicFooter";

import "../../styles/PublicPages.css";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Set your location",
    description:
      "Tell Dish Dash where you are so we can show restaurants serving your area.",
  },

  {
    number: "02",
    icon: Search,
    title: "Find your food",
    description:
      "Browse restaurants and menus to find exactly what you feel like eating.",
  },

  {
    number: "03",
    icon: ShoppingBag,
    title: "Build your order",
    description:
      "Add your favourite meals to your cart and review everything before checkout.",
  },

  {
    number: "04",
    icon: CreditCard,
    title: "Pay securely",
    description:
      "Choose your payment option and complete your order through a simple checkout.",
  },

  {
    number: "05",
    icon: Store,
    title: "Restaurant prepares",
    description: "The restaurant receives your order and prepares your food.",
  },

  {
    number: "06",
    icon: Truck,
    title: "Receive your order",
    description:
      "Your meal moves through the delivery process until it reaches you.",
  },
];

function HowItWorksPage() {
  return (
    <div className="public-page-layout">
      <PublicNavbar />

      <main className="public-page">
        <div className="public-container">
          <section className="public-hero">
            <span className="public-eyebrow">How Dish Dash Works</span>

            <h1>From craving to delivery without the confusion.</h1>

            <p>
              Dish Dash brings restaurant discovery, menus, ordering and
              delivery into one simple customer journey.
            </p>
          </section>

          <section className="public-section">
            <div className="public-section-heading">
              <span>THE PROCESS</span>

              <h2>Ordering in six simple steps</h2>

              <p>
                Everything is designed to help you move quickly from finding
                food to receiving your order.
              </p>
            </div>

            <div className="public-step-grid">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.number} className="public-step-card">
                    <div className="public-step-top">
                      <span className="public-step-number">{step.number}</span>

                      <span className="public-step-icon">
                        <Icon size={23} />
                      </span>
                    </div>

                    <h3>{step.title}</h3>

                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="public-feature-panel">
            <div>
              <span className="public-eyebrow public-eyebrow--light">
                Built for convenience
              </span>

              <h2>One place for your complete food journey.</h2>

              <div className="public-check-list">
                <div>
                  <CheckCircle2 size={19} />
                  Browse local restaurants
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  Explore restaurant menus
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  Manage your cart
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  Complete checkout securely
                </div>
              </div>
            </div>

            <div className="public-feature-icon-large">
              <UtensilsCrossed size={72} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HowItWorksPage;
