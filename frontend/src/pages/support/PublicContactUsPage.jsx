import { useState } from "react";
import { Mail, MapPin, MessageSquareText, Phone } from "lucide-react";

import Navbar from "../../components/common/PublicNavbar";
import Footer from "../../components/common/PublicFooter";

import "../../styles/SupportPages.css";

function ContactUsPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setSuccessMessage(
      "Your message has been captured successfully. You can connect this form to your backend next.",
    );

    setFormData({
      fullName: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="support-page-layout">
      <Navbar />

      <main className="support-page">
        <div className="support-container">
          <section className="support-hero support-hero--compact">
            <span className="support-eyebrow">Contact Us</span>
            <h1>We’re here to help.</h1>
            <p>
              Reach out if you need help with an order, your account,
              restaurants, payments or general platform support.
            </p>
          </section>

          <section className="support-grid support-grid--three">
            <article className="support-info-card">
              <div className="support-info-icon">
                <Mail size={22} />
              </div>
              <h3>Email</h3>
              <p>support@dishdash.co.za</p>
            </article>

            <article className="support-info-card">
              <div className="support-info-icon">
                <Phone size={22} />
              </div>
              <h3>Phone</h3>
              <p>+27 10 555 1234</p>
            </article>

            <article className="support-info-card">
              <div className="support-info-icon">
                <MapPin size={22} />
              </div>
              <h3>Office</h3>
              <p>Johannesburg, Gauteng, South Africa</p>
            </article>
          </section>

          <section className="support-contact-layout">
            <div className="support-contact-card">
              <div className="support-section-heading">
                <h2>Send us a message</h2>
                <p>
                  Use the form below and connect it to your backend later if you
                  want real submissions.
                </p>
              </div>

              {successMessage && (
                <div className="support-success-message">{successMessage}</div>
              )}

              <form className="support-form" onSubmit={handleSubmit}>
                <div className="support-form-row">
                  <div className="support-form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="support-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="support-form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What do you need help with?"
                    required
                  />
                </div>

                <div className="support-form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here"
                    rows={7}
                    required
                  />
                </div>

                <button type="submit" className="support-primary-button">
                  <MessageSquareText size={17} />
                  Send Message
                </button>
              </form>
            </div>

            <aside className="support-side-card">
              <div className="support-section-heading">
                <h2>Support hours</h2>
                <p>Typical support availability.</p>
              </div>

              <div className="support-list-card">
                <div className="support-list-row">
                  <strong>Monday - Friday</strong>
                  <span>08:00 - 18:00</span>
                </div>

                <div className="support-list-row">
                  <strong>Saturday</strong>
                  <span>09:00 - 15:00</span>
                </div>

                <div className="support-list-row">
                  <strong>Sunday</strong>
                  <span>Closed</span>
                </div>
              </div>

              <div className="support-note-box">
                For urgent issues with orders or payments, include your order ID
                in the subject line.
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactUsPage;
