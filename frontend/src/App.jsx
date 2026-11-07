// ======================================

// REACT ROUTER

// ======================================

import { BrowserRouter, Routes, Route } from "react-router-dom";

import "leaflet/dist/leaflet.css";

// ======================================

// CONTEXT

// ======================================

import { PopupProvider } from "./context/PopupContext";

// ======================================

// LANDING

// ======================================

import LandingPage from "./pages/LandingPage";

// ======================================

// PUBLIC WEBSITE

// ======================================

import HowItWorksPage from "./pages/public/HowItWorksPage";

import RestaurantsEntryPage from "./pages/public/RestaurantsEntryPage";

// ======================================

// PUBLIC SUPPORT

// ======================================

import ContactUsPage from "./pages/support/ContactUsPage";

import PublicContactUsPage from "./pages/support/PublicContactUsPage";

import HelpCentrePage from "./pages/support/HelpCentrePage";

import PublicHelpCentrePage from "./pages/support/PublicHelpCentrePage";

import FAQPage from "./pages/support/FAQPage";

import PublicFAQPage from "./pages/support/PublicFAQPage";

import BecomePartnerPage from "./pages/support/BecomePartnerPage";

import PublicBecomePartnerPage from "./pages/support/PublicBecomePartnerPage";

// ======================================

// PUBLIC LEGAL

// ======================================

import PrivacyPolicyPage from "./pages/support/PrivacyPolicyPage";

import TermsAndConditionsPage from "./pages/support/TermsAndConditionsPage";

import CookiePolicyPage from "./pages/support/CookiePolicyPage";

// ======================================

// AUTH

// ======================================

import LoginPage from "./pages/auth/LoginPage";

import RegisterPage from "./pages/auth/RegisterPage";

import VerificationPage from "./pages/auth/VerifyEmailPage";

import ForgotPassword from "./pages/auth/ForgotPassword";

import VerifyPassword from "./pages/auth/VerifyPassword";

// ======================================

// CUSTOMER

// ======================================

import HomePage from "./pages/customer/HomePage";

import CheckoutPage from "./pages/customer/CheckoutPage";

import CustomerMenuPage from "./pages/customer/CustomerMenuPage";

import CustomerRestaurantMenuPage from "./pages/customer/CustomerRestaurantMenuPage";

import CartPage from "./pages/customer/CartPage";

import RouteTest from "./pages/customer/RouteTest";

import FavouritesPage from "./pages/customer/FavouritesPage";

import CustomerMenuItemDetailsPage from "./pages/customer/CustomerMenuItemDetailsPage";

// ======================================

// PAYMENTS

// ======================================

import PaymentMethodPage from "./pages/customer/PaymentMethodPage";

import OrderPaymentPage from "./pages/customer/OrderPaymentPage";

// ======================================

// ORDERS

// ======================================

import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";

import OrdersPage from "./pages/customer/OrdersPage";

// ======================================

// SHARED ACCOUNT

// ======================================

import Addresses from "./pages/Addresses/Addresses";

import Profile from "./pages/ProfileSettings/ProfileSettings";

// ======================================

// RESTAURANT

// ======================================

import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";

import RestaurantMenuPage from "./pages/restaurant/RestaurantMenuPage";

import RestaurantProfilePage from "./pages/restaurant/RestaurantProfilePage";

import RestaurantAnalyticsPage from "./pages/restaurant/RestaurantAnalyticsPage";

import RestaurantOrdersPage from "./pages/restaurant/RestaurantOrdersPage";

import RestaurantInventoryPage from "./pages/restaurant/RestaurantInventoryPage";

// ======================================

// COMMON

// ======================================

import UnauthorizedPage from "./pages/UnauthorizedPage";

import ProtectedRoute from "./components/common/ProtectedRoute";

import TruckLoader from "./components/common/TruckLoader";

import SessionManager from "./components/common/SessionManager";

import ScrollToTop from "./components/common/ScrollToTop";

// ======================================

// APP

// ======================================

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <PopupProvider>
        <TruckLoader />

        <SessionManager />

        <Routes>
          {/* ================================================= */}

          {/* PUBLIC WEBSITE                                    */}

          {/* ================================================= */}

          <Route path="/" element={<LandingPage />} />

          <Route path="/how-it-works" element={<HowItWorksPage />} />

          <Route path="/restaurants" element={<RestaurantsEntryPage />} />

          {/* ================================================= */}

          {/* PUBLIC SUPPORT                                    */}

          {/* ================================================= */}

          <Route path="/contact-us" element={<PublicContactUsPage />} />

          <Route path="/help-centre" element={<PublicHelpCentrePage />} />

          <Route path="/faq" element={<PublicFAQPage />} />

          <Route
            path="/become-a-partner"
            element={<PublicBecomePartnerPage />}
          />

          {/* ================================================= */}

          {/* PUBLIC LEGAL                                      */}

          {/* ================================================= */}

          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          <Route path="/terms" element={<TermsAndConditionsPage />} />

          <Route path="/cookie-policy" element={<CookiePolicyPage />} />

          {/* ================================================= */}

          {/* AUTH                                              */}

          {/* ================================================= */}

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="/verify-email" element={<VerificationPage />} />

          <Route path="/verify-password" element={<VerifyPassword />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ================================================= */}

          {/* CUSTOMER — PROTECTED                              */}

          {/* ================================================= */}

          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menu"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerMenuPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurants/:restaurantId"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerRestaurantMenuPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menu-items/:menuItemId"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerMenuItemDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-method"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <PaymentMethodPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:orderId/payment"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <OrderPaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favourites"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <FavouritesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/route-test"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <RouteTest />
              </ProtectedRoute>
            }
          />

          {/* ================================================= */}

          {/* RESTAURANT — PROTECTED                            */}

          {/* ================================================= */}

          <Route
            path="/restaurant"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant/menu"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantMenuPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant/inventory"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantInventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant/analytics"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant/orders"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant/profile"
            element={
              <ProtectedRoute allowedRoles={["restaurant"]}>
                <RestaurantProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ================================================= */}

          {/* SHARED PROTECTED                                  */}

          {/* ================================================= */}

          <Route
            path="/app/contact-us"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <ContactUsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/help-centre"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <HelpCentrePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/faq"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <FAQPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/become-a-partner"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <BecomePartnerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/privacy-policy"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <PrivacyPolicyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/terms"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <TermsAndConditionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/cookie-policy"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <CookiePolicyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/addresses"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <Addresses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["customer", "restaurant"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ================================================= */}

          {/* ACCESS                                            */}

          {/* ================================================= */}

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </PopupProvider>
    </BrowserRouter>
  );
}

export default App;
