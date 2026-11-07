// ======================================
// IMPORTS
// ======================================

import { useState } from "react";

import {
  CheckCircle2,
  ClipboardCheck,
  Handshake,
  Rocket,
  Send,
  Store,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/SupportPages.css";

// ======================================
// INITIAL FORM DATA
// ======================================

const INITIAL_FORM_DATA = {
  restaurantName: "",
  ownerName: "",
  email: "",
  phone: "",
  city: "",
  cuisineType: "",
  message: "",
};

// ======================================
// GOOGLE FORM CONFIGURATION
// ======================================
//
// Add these values to your frontend .env file.
//
// Example:
//
// VITE_PARTNER_GOOGLE_FORM_ACTION=https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse
//
// VITE_PARTNER_FIELD_RESTAURANT_NAME=entry.111111111
// VITE_PARTNER_FIELD_OWNER_NAME=entry.222222222
// VITE_PARTNER_FIELD_EMAIL=entry.333333333
// VITE_PARTNER_FIELD_PHONE=entry.444444444
// VITE_PARTNER_FIELD_CITY=entry.555555555
// VITE_PARTNER_FIELD_CUISINE=entry.666666666
// VITE_PARTNER_FIELD_MESSAGE=entry.777777777
//
// ======================================

const GOOGLE_FORM_ACTION =
  import.meta.env.VITE_PARTNER_GOOGLE_FORM_ACTION || "";

const GOOGLE_FIELDS = {
  restaurantName: import.meta.env.VITE_PARTNER_FIELD_RESTAURANT_NAME || "",

  ownerName: import.meta.env.VITE_PARTNER_FIELD_OWNER_NAME || "",

  email: import.meta.env.VITE_PARTNER_FIELD_EMAIL || "",

  phone: import.meta.env.VITE_PARTNER_FIELD_PHONE || "",

  city: import.meta.env.VITE_PARTNER_FIELD_CITY || "",

  cuisineType: import.meta.env.VITE_PARTNER_FIELD_CUISINE || "",

  message: import.meta.env.VITE_PARTNER_FIELD_MESSAGE || "",
};

// ======================================
// APPLICATION STEPS
// ======================================

const partnerSteps = [
  {
    number: "01",
    title: "Submit your details",

    description:
      "Tell us about your restaurant and provide your contact information.",

    icon: ClipboardCheck,
  },

  {
    number: "02",
    title: "Application review",

    description:
      "The Dish Dash team reviews your restaurant and partnership information.",

    icon: Store,
  },

  {
    number: "03",
    title: "Restaurant onboarding",

    description:
      "Approved restaurants can create their profile, menu and operating details.",

    icon: Handshake,
  },

  {
    number: "04",
    title: "Go live",

    description:
      "Once everything is ready, your restaurant can start receiving customer orders.",

    icon: Rocket,
  },
];

// ======================================
// BECOME PARTNER PAGE
// ======================================

function BecomePartnerPage() {
  // ======================================
  // FORM STATE
  // ======================================

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [successMessage, setSuccessMessage] = useState("");

  const [formError, setFormError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ======================================
  // CHECK GOOGLE FORM CONFIG
  // ======================================

  const googleFormConfigured =
    Boolean(GOOGLE_FORM_ACTION) && Object.values(GOOGLE_FIELDS).every(Boolean);

  // ======================================
  // CHANGE FIELD
  // ======================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  // ======================================
  // SUBMIT FORM
  // ======================================
  //
  // IMPORTANT:
  // We DO NOT call event.preventDefault() when
  // Google Forms is configured.
  //
  // The browser posts the form directly to
  // Google's formResponse endpoint.
  //
  // The response opens inside the hidden iframe
  // instead of navigating the Dish Dash page.
  //
  // ======================================

  const handleSubmit = (event) => {
    setSuccessMessage("");
    setFormError("");

    // Stop submission until Google Form
    // configuration has been added.

    if (!googleFormConfigured) {
      event.preventDefault();

      setFormError("Partner form configuration is not complete yet.");

      return;
    }

    setSubmitting(true);
  };

  // ======================================
  // GOOGLE FORM RESPONSE FINISHED
  // ======================================

  const handleGoogleFormResponse = () => {
    // The iframe also loads once when the page
    // first renders. Ignore that first load.

    if (!submitting) {
      return;
    }

    setSubmitting(false);

    setSuccessMessage(
      "Thank you. Your restaurant partner application has been submitted successfully. We will contact you after reviewing your application.",
    );

    setFormData(INITIAL_FORM_DATA);
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="support-page-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          PAGE
      ====================================== */}

      <main className="support-page">
        <div className="support-container">
          {/* ======================================
              INTRO
          ====================================== */}

          <section className="support-hero partner-hero">
            <span className="support-eyebrow">Restaurant Partners</span>

            <h1>Grow your restaurant with Dish Dash.</h1>

            <p>
              Apply to become a Dish Dash restaurant partner and make your menu
              available to more local customers.
            </p>
          </section>

          {/* ======================================
              APPLICATION PROCESS
          ====================================== */}

          <section className="partner-process">
            <div className="support-section-heading partner-process-heading">
              <span className="partner-section-label">How it works</span>

              <h2>From application to your first order.</h2>

              <p>
                A simple process for getting your restaurant onto Dish Dash.
              </p>
            </div>

            <div className="partner-steps">
              {partnerSteps.map((step) => {
                const StepIcon = step.icon;

                return (
                  <article key={step.number} className="partner-step">
                    <div className="partner-step-top">
                      <span className="partner-step-number">{step.number}</span>

                      <span className="partner-step-icon">
                        <StepIcon size={22} aria-hidden="true" />
                      </span>
                    </div>

                    <h3>{step.title}</h3>

                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ======================================
              APPLICATION FORM
          ====================================== */}

          <section className="partner-application-section">
            <div className="support-contact-card partner-application-card">
              {/* ======================================
                  FORM HEADING
              ====================================== */}

              <div className="support-section-heading partner-form-heading">
                <span className="partner-section-label">Apply</span>

                <h2>Restaurant partner application</h2>

                <p>
                  Complete the form below and our team will review your
                  restaurant application.
                </p>
              </div>

              {/* ======================================
                  SUCCESS
              ====================================== */}

              {successMessage && (
                <div className="support-success-message partner-success-message">
                  <CheckCircle2 size={19} aria-hidden="true" />

                  <span>{successMessage}</span>
                </div>
              )}

              {/* ======================================
                  ERROR
              ====================================== */}

              {formError && (
                <div className="partner-form-error">{formError}</div>
              )}

              {/* ======================================
                  GOOGLE FORM
              ====================================== */}

              <form
                className="support-form partner-form"
                action={GOOGLE_FORM_ACTION}
                method="POST"
                target="partner-google-form-response"
                onSubmit={handleSubmit}
              >
                {/* ======================================
                    GOOGLE FORM VALUES
                ====================================== */}

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.restaurantName}
                  value={formData.restaurantName}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.ownerName}
                  value={formData.ownerName}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.email}
                  value={formData.email}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.phone}
                  value={formData.phone}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.city}
                  value={formData.city}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.cuisineType}
                  value={formData.cuisineType}
                />

                <input
                  type="hidden"
                  name={GOOGLE_FIELDS.message}
                  value={formData.message}
                />

                {/* ======================================
                    RESTAURANT + OWNER
                ====================================== */}

                <div className="support-form-row">
                  <div className="support-form-group">
                    <label htmlFor="restaurantName">Restaurant Name</label>

                    <input
                      id="restaurantName"
                      name="restaurantName"
                      type="text"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      placeholder="Enter restaurant name"
                      autoComplete="organization"
                      required
                    />
                  </div>

                  <div className="support-form-group">
                    <label htmlFor="ownerName">Owner / Manager Name</label>

                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* ======================================
                    EMAIL + PHONE
                ====================================== */}

                <div className="support-form-row">
                  <div className="support-form-group">
                    <label htmlFor="email">Email Address</label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="restaurant@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="support-form-group">
                    <label htmlFor="phone">Phone Number</label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 071 234 5678"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                  </div>
                </div>

                {/* ======================================
                    CITY + CUISINE
                ====================================== */}

                <div className="support-form-row">
                  <div className="support-form-group">
                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Johannesburg"
                      autoComplete="address-level2"
                      required
                    />
                  </div>

                  <div className="support-form-group">
                    <label htmlFor="cuisineType">Cuisine Type</label>

                    <input
                      id="cuisineType"
                      name="cuisineType"
                      type="text"
                      value={formData.cuisineType}
                      onChange={handleChange}
                      placeholder="e.g. African, Burgers, Indian"
                      required
                    />
                  </div>
                </div>

                {/* ======================================
                    MORE INFORMATION
                ====================================== */}

                <div className="support-form-group">
                  <label htmlFor="message">Tell us about your restaurant</label>

                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your restaurant, menu, location or anything else we should know."
                    rows={5}
                  />
                </div>

                {/* ======================================
                    FORM FOOTER
                ====================================== */}

                <div className="partner-form-footer">
                  <p>
                    By submitting this application you agree that Dish Dash may
                    contact you about your restaurant application.
                  </p>

                  <button
                    type="submit"
                    className="support-primary-button partner-submit-button"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="partner-submit-loader" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={17} aria-hidden="true" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* ======================================
                  GOOGLE RESPONSE IFRAME
              ====================================== */}

              <iframe
                title="Partner application response"
                name="partner-google-form-response"
                className="partner-google-form-frame"
                onLoad={handleGoogleFormResponse}
              />
            </div>
          </section>
        </div>
      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default BecomePartnerPage;
