import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/SupportPages.css";

function FAQPage() {
  const faqs = [
    {
      question: "How do I place an order?",
      answer:
        "Browse restaurants or menu items, add what you want to your cart, open the cart page, continue to checkout, choose your address and move through payment.",
    },
    {
      question: "How do I add a delivery address?",
      answer:
        "Go to your Addresses page, add a new address and save it. You can keep one Home address, one Work address and add additional places as needed.",
    },
    {
      question: "Why can’t I see payment details?",
      answer:
        "Usually this happens if the page expects an order ID and that order ID was not passed correctly during navigation. Make sure the payment page is opened from the right checkout or confirmation flow.",
    },
    {
      question: "Can different users share the same favourites or cart?",
      answer:
        "They should not. Favourites and cart data should be stored per logged-in user so one user’s saved items do not appear for another user.",
    },
    {
      question: "How do I become a restaurant partner?",
      answer:
        "Open the Become a Restaurant Partner page, complete the form and submit your details. You can later connect that form to your backend.",
    },
    {
      question: "What happens after I place an order?",
      answer:
        "The order is created, the user may confirm details, move to payment and then continue through the restaurant order process based on your backend logic.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <div className="support-page-layout">
      <Navbar />

      <main className="support-page">
        <div className="support-container">
          <section className="support-hero support-hero--compact">
            <span className="support-eyebrow">Frequently Asked Questions</span>
            <h1>Answers to common questions.</h1>
            <p>
              Quick explanations for common Dish Dash questions from customers
              and restaurant users.
            </p>
          </section>

          <section className="support-faq-section">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <article
                  key={faq.question}
                  className={`support-faq-card ${
                    isOpen ? "support-faq-card--open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="support-faq-button"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {isOpen && (
                    <div className="support-faq-answer">{faq.answer}</div>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FAQPage;
