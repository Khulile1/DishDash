// ======================================
// IMPORTS
// ======================================

import { useNavigate } from "react-router-dom";

import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Store,
  UserRound,
  Utensils,
} from "lucide-react";
import RestaurantNavbar from "./RestaurantNavbar";

import "../../styles/RestaurantDashboard.css";

// ======================================
// RESTAURANT DASHBOARD
// ======================================

function RestaurantDashboard() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // LOGGED-IN USER
  // ======================================

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Could not read user:", error);
  }

  // ======================================
  // DASHBOARD CARDS
  // ======================================

  const dashboardCards = [
    {
      title: "Menu",

      description: "Add, edit, delete and manage your restaurant menu items.",

      buttonText: "Manage Menu",

      route: "/restaurant/menu",

      icon: Utensils,
    },

    {
      title: "Orders",

      description: "View incoming customer orders and update their status.",

      buttonText: "View Orders",

      route: "/restaurant/orders",

      icon: ClipboardList,
    },

    {
      title: "Restaurant Profile",

      description:
        "Manage your restaurant name, address, phone number and business information.",

      buttonText: "Manage Restaurant",

      route: "/restaurant/profile",

      icon: Store,
    },

    {
      title: "Analytics",

      description: "View restaurant sales, orders and performance information.",

      buttonText: "View Analytics",

      route: "/restaurant/analytics",

      icon: BarChart3,
    },
  ];

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-dashboard-layout">
      {/* ======================================
          RESTAURANT NAVBAR
      ====================================== */}

      <RestaurantNavbar />

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="restaurant-dashboard-page">
        <div className="restaurant-dashboard-container">
          {/* ======================================
              WELCOME HEADER
          ====================================== */}

          <section className="restaurant-dashboard-hero">
            <div className="restaurant-dashboard-hero-content">
              <span className="restaurant-dashboard-eyebrow">
                <LayoutDashboard size={16} />
                Restaurant Portal
              </span>

              <h1>Restaurant Dashboard</h1>

              <h2>Welcome, {user?.name || "Restaurant"}</h2>

              <p>
                Manage your restaurant, menu, customer orders and business
                information from one place.
              </p>
            </div>

            <div className="restaurant-dashboard-hero-icon">
              <Store size={42} />
            </div>
          </section>

          {/* ======================================
              QUICK ACTION HEADING
          ====================================== */}

          <div className="restaurant-dashboard-section-heading">
            <div>
              <h2>Manage your business</h2>

              <p>Choose an area below to manage your restaurant.</p>
            </div>
          </div>

          {/* ======================================
              DASHBOARD CARDS
          ====================================== */}

          <section className="restaurant-dashboard-grid">
            {dashboardCards.map((card) => {
              const CardIcon = card.icon;

              return (
                <article key={card.title} className="restaurant-dashboard-card">
                  <div className="restaurant-dashboard-card-icon">
                    <CardIcon size={25} />
                  </div>

                  <div className="restaurant-dashboard-card-content">
                    <h3>{card.title}</h3>

                    <p>{card.description}</p>
                  </div>

                  <button
                    type="button"
                    className="restaurant-dashboard-card-button"
                    onClick={() => navigate(card.route)}
                  >
                    {card.buttonText}
                  </button>
                </article>
              );
            })}
          </section>

          {/* ======================================
              ACCOUNT INFORMATION
          ====================================== */}

          <section className="restaurant-dashboard-account-card">
            <div className="restaurant-dashboard-account-heading">
              <div className="restaurant-dashboard-account-icon">
                <UserRound size={23} />
              </div>

              <div>
                <h2>Account Information</h2>

                <p>
                  Details associated with your Dish Dash restaurant account.
                </p>
              </div>
            </div>

            <div className="restaurant-dashboard-account-grid">
              {/* ======================================
                  NAME
              ====================================== */}

              <div className="restaurant-dashboard-account-item">
                <div className="restaurant-dashboard-account-item-icon">
                  <UserRound size={19} />
                </div>

                <div>
                  <span>Name</span>

                  <strong>{user?.name || "Not available"}</strong>
                </div>
              </div>

              {/* ======================================
                  EMAIL
              ====================================== */}

              <div className="restaurant-dashboard-account-item">
                <div className="restaurant-dashboard-account-item-icon">
                  <Mail size={19} />
                </div>

                <div>
                  <span>Email</span>

                  <strong>{user?.email || "Not available"}</strong>
                </div>
              </div>

              {/* ======================================
                  ROLE
              ====================================== */}

              <div className="restaurant-dashboard-account-item">
                <div className="restaurant-dashboard-account-item-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <span>Account Type</span>

                  <strong className="restaurant-dashboard-role">
                    {user?.role || "restaurant"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default RestaurantDashboard;
