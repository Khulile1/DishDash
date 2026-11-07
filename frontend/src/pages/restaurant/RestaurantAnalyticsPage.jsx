// ======================================

// IMPORTS

// ======================================

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  BarChart3,
  Banknote,
  ClipboardList,
  PackageCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Utensils,
} from "lucide-react";

import { jwtDecode } from "jwt-decode";

import { getRestaurants } from "../../services/restaurantService";

import { findOrders } from "../../services/orderService";

import RestaurantNavbar from "./RestaurantNavbar";

import "../../styles/RestaurantAnalyticsPage.css";

// ======================================

// HELPERS

// ======================================

// Get restaurant ID from an order

const getOrderRestaurantId = (order) => {
  if (order.restaurant_id && typeof order.restaurant_id === "object") {
    return String(order.restaurant_id._id || "");
  }

  return String(order.restaurant_id || order.restaurant?._id || "");
};

// ======================================

// ORDER TOTAL

// ======================================

const getOrderTotal = (order) => {
  return Number(order.total_price ?? order.total ?? order.grand_total ?? 0);
};

// ======================================

// ORDER DATE

// ======================================

const getOrderDate = (order) => {
  const value = order.createdAt || order.created_at || order.order_date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

// ======================================

// ORDER ITEMS

// ======================================

const getOrderItems = (order) => {
  if (Array.isArray(order.items)) {
    return order.items;
  }

  if (Array.isArray(order.orderItems)) {
    return order.orderItems;
  }

  return [];
};

// ======================================

// ITEM NAME

// ======================================

const getItemName = (item) => {
  return (
    item.name || item.menu_item_id?.name || item.menu_item?.name || "Menu Item"
  );
};

// ======================================

// NORMALISE STATUS

// ======================================

const normaliseStatus = (status) => {
  return String(status || "Pending")
    .replaceAll("_", " ")

    .trim();
};

// ======================================

// FORMAT CURRENCY

// ======================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",

    currency: "ZAR",
  }).format(Number(value || 0));
};

// ======================================

// FORMAT DATE

// ======================================

const formatDate = (date) => {
  if (!date) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  }).format(date);
};

// ======================================

// RESTAURANT ANALYTICS PAGE

// ======================================

function RestaurantAnalyticsPage() {
  // ======================================

  // NAVIGATION

  // ======================================

  const navigate = useNavigate();

  // ======================================

  // RESTAURANTS

  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  // ======================================

  // ORDERS

  // ======================================

  const [orders, setOrders] = useState([]);

  // ======================================

  // PERIOD

  // ======================================

  const [period, setPeriod] = useState("30");

  // ======================================

  // PAGE STATE

  // ======================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================

  // GET OWNER ID

  // ======================================

  const getOwnerId = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode(token);

      return decoded.id || decoded._id || decoded.userId || null;
    } catch (error) {
      console.error("Could not decode token:", error);

      return null;
    }
  };

  // ======================================

  // LOAD ANALYTICS

  // ======================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      setError("");

      const [restaurantData, orderData] = await Promise.all([
        getRestaurants(),

        findOrders(),
      ]);

      // ======================================

      // RESTAURANT LIST

      // ======================================

      const restaurantList = Array.isArray(restaurantData)
        ? restaurantData
        : Array.isArray(restaurantData?.restaurants)
          ? restaurantData.restaurants
          : [];

      // ======================================

      // FILTER RESTAURANTS BY OWNER

      // ======================================

      const ownerId = getOwnerId();

      const ownedRestaurants = ownerId
        ? restaurantList.filter((restaurant) => {
            const restaurantOwnerId =
              typeof restaurant.owner_id === "object"
                ? restaurant.owner_id?._id || restaurant.owner_id?.id
                : restaurant.owner_id;

            return String(restaurantOwnerId || "") === String(ownerId);
          })
        : restaurantList;

      setRestaurants(ownedRestaurants);

      // ======================================

      // SELECT FIRST RESTAURANT

      // ======================================

      if (ownedRestaurants.length > 0) {
        setSelectedRestaurantId(
          (currentRestaurantId) =>
            currentRestaurantId || ownedRestaurants[0]._id,
        );
      }

      // ======================================

      // ORDER LIST

      // ======================================

      const orderList = Array.isArray(orderData)
        ? orderData
        : Array.isArray(orderData?.orders)
          ? orderData.orders
          : [];

      setOrders(orderList);
    } catch (error) {
      console.error("Analytics loading error:", error);

      setError(error.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================

  // LOAD PAGE

  // ======================================

  useEffect(() => {
    loadAnalytics();
  }, []);

  // ======================================

  // SELECTED RESTAURANT

  // ======================================

  const selectedRestaurant = restaurants.find(
    (restaurant) => String(restaurant._id) === String(selectedRestaurantId),
  );

  // ======================================

  // ALL RESTAURANT ORDERS

  // ======================================

  const restaurantOrders = useMemo(() => {
    if (!selectedRestaurantId) {
      return [];
    }

    return orders.filter(
      (order) => getOrderRestaurantId(order) === String(selectedRestaurantId),
    );
  }, [orders, selectedRestaurantId]);

  // ======================================

  // FILTER ORDERS BY PERIOD

  // ======================================

  const filteredOrders = useMemo(() => {
    if (period === "all") {
      return restaurantOrders;
    }

    const days = Number(period);

    const cutoff = new Date();

    cutoff.setHours(0, 0, 0, 0);

    cutoff.setDate(cutoff.getDate() - (days - 1));

    return restaurantOrders.filter((order) => {
      const orderDate = getOrderDate(order);

      return orderDate && orderDate >= cutoff;
    });
  }, [restaurantOrders, period]);

  // ======================================

  // NON-CANCELLED ORDERS

  // ======================================

  const revenueOrders = filteredOrders.filter(
    (order) => !normaliseStatus(order.status).toLowerCase().includes("cancel"),
  );

  // ======================================

  // TOTAL REVENUE

  // ======================================

  const totalRevenue = revenueOrders.reduce(
    (total, order) => total + getOrderTotal(order),

    0,
  );

  // ======================================

  // AVERAGE ORDER VALUE

  // ======================================

  const averageOrderValue =
    revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

  // ======================================

  // ITEMS SOLD

  // ======================================

  const itemsSold = revenueOrders.reduce((total, order) => {
    return (
      total +
      getOrderItems(order).reduce(
        (itemTotal, item) => itemTotal + (Number(item.quantity) || 1),

        0,
      )
    );
  }, 0);

  // ======================================

  // ORDER STATUS SUMMARY

  // ======================================

  const statusSummary = useMemo(() => {
    const statusCounts = {};

    filteredOrders.forEach((order) => {
      const status = normaliseStatus(order.status);

      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts)

      .map(([status, count]) => ({
        status,

        count,
      }))

      .sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // ======================================

  // TOP SELLING ITEMS

  // ======================================

  const topSellingItems = useMemo(() => {
    const itemMap = new Map();

    revenueOrders.forEach((order) => {
      getOrderItems(order).forEach((item) => {
        const itemName = getItemName(item);

        const quantity = Number(item.quantity) || 1;

        const price = Number(item.price) || 0;

        const current = itemMap.get(itemName) || {
          name: itemName,

          quantity: 0,

          revenue: 0,
        };

        current.quantity += quantity;

        current.revenue += price * quantity;

        itemMap.set(itemName, current);
      });
    });

    return [...itemMap.values()]

      .sort((a, b) => b.quantity - a.quantity)

      .slice(0, 5);
  }, [revenueOrders]);

  // ======================================

  // RECENT ORDERS

  // ======================================

  const recentOrders = [...restaurantOrders]

    .sort((a, b) => {
      const aDate = getOrderDate(a);

      const bDate = getOrderDate(b);

      return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
    })

    .slice(0, 6);

  // ======================================

  // LAST 7 DAYS REVENUE

  // ======================================

  const lastSevenDays = useMemo(() => {
    const result = [];

    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date();

      day.setHours(0, 0, 0, 0);

      day.setDate(day.getDate() - index);

      const nextDay = new Date(day);

      nextDay.setDate(nextDay.getDate() + 1);

      const revenue = restaurantOrders

        .filter((order) => {
          const date = getOrderDate(order);

          const isCancelled = normaliseStatus(order.status)
            .toLowerCase()

            .includes("cancel");

          return date && date >= day && date < nextDay && !isCancelled;
        })

        .reduce((total, order) => total + getOrderTotal(order), 0);

      result.push({
        date: day,

        label: new Intl.DateTimeFormat("en-ZA", {
          weekday: "short",
        }).format(day),

        revenue,
      });
    }

    return result;
  }, [restaurantOrders]);

  // ======================================

  // MAX DAILY REVENUE

  // ======================================

  const maxDailyRevenue = Math.max(
    ...lastSevenDays.map((day) => day.revenue),

    1,
  );

  // ======================================

  // MAX STATUS COUNT

  // ======================================

  const maxStatusCount = Math.max(
    ...statusSummary.map((item) => item.count),

    1,
  );

  // ======================================

  // PAGE

  // ======================================

  return (
    <div className="restaurant-analytics-layout">
      {/* ======================================

          SHARED RESTAURANT NAVBAR

      ====================================== */}

      <RestaurantNavbar />

      {/* ======================================

          MAIN PAGE

      ====================================== */}

      <main className="restaurant-analytics-page">
        <div className="restaurant-analytics-container">
          {/* BACK */}

          <button
            type="button"
            className="restaurant-analytics-back"
            onClick={() => navigate("/restaurant")}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <button
            type="button"
            className="restaurant-analytics-back"
            onClick={() => navigate("/restaurant/orders")}
          >
            <ClipboardList size={18} />
            View Orders
          </button>

          {/* ======================================

              HEADER

          ====================================== */}

          <section className="restaurant-analytics-header">
            <div>
              <span className="restaurant-analytics-eyebrow">
                <BarChart3 size={16} />
                Business Analytics
              </span>

              <h1>Restaurant Analytics</h1>

              <p>
                Track orders, revenue and menu performance for your restaurant.
              </p>
            </div>

            <div className="restaurant-analytics-header-controls">
              {/* RESTAURANT */}

              {restaurants.length > 1 && (
                <select
                  value={selectedRestaurantId}
                  onChange={(event) =>
                    setSelectedRestaurantId(event.target.value)
                  }
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              )}

              {/* PERIOD */}

              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                <option value="7">Last 7 days</option>

                <option value="30">Last 30 days</option>

                <option value="all">All time</option>
              </select>
            </div>
          </section>

          {/* ======================================

              LOADING

          ====================================== */}

          {loading && (
            <section className="restaurant-analytics-state">
              <div className="restaurant-analytics-loader" />

              <h2>Loading analytics</h2>

              <p>Calculating your restaurant performance.</p>
            </section>
          )}

          {/* ======================================

              ERROR

          ====================================== */}

          {!loading && error && (
            <section className="restaurant-analytics-state">
              <BarChart3 size={36} />

              <h2>Could not load analytics</h2>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadAnalytics}
                className="restaurant-analytics-retry"
              >
                Try Again
              </button>
            </section>
          )}

          {/* ======================================

              NO RESTAURANT

          ====================================== */}

          {!loading && !error && !selectedRestaurant && (
            <section className="restaurant-analytics-state">
              <Store size={36} />

              <h2>No restaurant profile</h2>

              <p>Create your restaurant profile before viewing analytics.</p>

              <button
                type="button"
                className="restaurant-analytics-retry"
                onClick={() => navigate("/restaurant/profile")}
              >
                Create Restaurant
              </button>
            </section>
          )}

          {/* ======================================

              ANALYTICS CONTENT

          ====================================== */}

          {!loading && !error && selectedRestaurant && (
            <>
              {/* RESTAURANT */}

              <div className="restaurant-analytics-current">
                <Store size={17} />

                <span>
                  Analytics for <strong>{selectedRestaurant.name}</strong>
                </span>
              </div>

              {/* ======================================

                  METRICS

              ====================================== */}

              <section className="restaurant-analytics-metrics">
                {/* REVENUE */}

                <article className="restaurant-analytics-metric-card">
                  <div className="restaurant-analytics-metric-icon">
                    <Banknote size={24} />
                  </div>

                  <span>Revenue</span>

                  <strong>{formatCurrency(totalRevenue)}</strong>

                  <small>Excludes cancelled orders</small>
                </article>

                {/* ORDERS */}

                <article className="restaurant-analytics-metric-card">
                  <div className="restaurant-analytics-metric-icon">
                    <ClipboardList size={24} />
                  </div>

                  <span>Total Orders</span>

                  <strong>{filteredOrders.length}</strong>

                  <small>Orders during selected period</small>
                </article>

                {/* AVERAGE */}

                <article className="restaurant-analytics-metric-card">
                  <div className="restaurant-analytics-metric-icon">
                    <TrendingUp size={24} />
                  </div>

                  <span>Average Order</span>

                  <strong>{formatCurrency(averageOrderValue)}</strong>

                  <small>Average order value</small>
                </article>

                {/* ITEMS SOLD */}

                <article className="restaurant-analytics-metric-card">
                  <div className="restaurant-analytics-metric-icon">
                    <ShoppingBag size={24} />
                  </div>

                  <span>Items Sold</span>

                  <strong>{itemsSold}</strong>

                  <small>Total menu items ordered</small>
                </article>
              </section>

              {/* ======================================

                  CHART GRID

              ====================================== */}

              <section className="restaurant-analytics-chart-grid">
                {/* REVENUE */}

                <article className="restaurant-analytics-panel">
                  <div className="restaurant-analytics-panel-heading">
                    <div>
                      <h2>Revenue</h2>

                      <p>Last seven days</p>
                    </div>

                    <TrendingUp size={21} />
                  </div>

                  <div className="restaurant-analytics-bar-chart">
                    {lastSevenDays.map((day) => {
                      const height = Math.max(
                        5,

                        (day.revenue / maxDailyRevenue) * 100,
                      );

                      return (
                        <div
                          key={day.date.toISOString()}
                          className="restaurant-analytics-bar-column"
                        >
                          <div className="restaurant-analytics-bar-value">
                            {day.revenue > 0 ? formatCurrency(day.revenue) : ""}
                          </div>

                          <div className="restaurant-analytics-bar-track">
                            <div
                              className="restaurant-analytics-bar"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>

                          <span>{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>

                {/* ORDER STATUS */}

                <article className="restaurant-analytics-panel">
                  <div className="restaurant-analytics-panel-heading">
                    <div>
                      <h2>Order Status</h2>

                      <p>Current period</p>
                    </div>

                    <PackageCheck size={21} />
                  </div>

                  {statusSummary.length === 0 ? (
                    <div className="restaurant-analytics-panel-empty">
                      No orders available.
                    </div>
                  ) : (
                    <div className="restaurant-analytics-status-list">
                      {statusSummary.map((item) => (
                        <div
                          key={item.status}
                          className="restaurant-analytics-status-item"
                        >
                          <div className="restaurant-analytics-status-heading">
                            <span>{item.status}</span>

                            <strong>{item.count}</strong>
                          </div>

                          <div className="restaurant-analytics-status-track">
                            <div
                              style={{
                                width: `${
                                  (item.count / maxStatusCount) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>

              {/* ======================================

                  LOWER GRID

              ====================================== */}

              <section className="restaurant-analytics-bottom-grid">
                {/* TOP ITEMS */}

                <article className="restaurant-analytics-panel">
                  <div className="restaurant-analytics-panel-heading">
                    <div>
                      <h2>Top Selling Items</h2>

                      <p>Most ordered menu items</p>
                    </div>

                    <Utensils size={21} />
                  </div>

                  {topSellingItems.length === 0 ? (
                    <div className="restaurant-analytics-panel-empty">
                      No item sales available yet.
                    </div>
                  ) : (
                    <div className="restaurant-analytics-top-items">
                      {topSellingItems.map((item, index) => (
                        <div
                          key={item.name}
                          className="restaurant-analytics-top-item"
                        >
                          <span className="restaurant-analytics-rank">
                            {index + 1}
                          </span>

                          <div>
                            <strong>{item.name}</strong>

                            <small>{item.quantity} sold</small>
                          </div>

                          <strong className="restaurant-analytics-item-revenue">
                            {formatCurrency(item.revenue)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                {/* RECENT ORDERS */}

                <article className="restaurant-analytics-panel restaurant-analytics-recent-panel">
                  <div className="restaurant-analytics-panel-heading">
                    <div>
                      <h2>Recent Orders</h2>

                      <p>Latest restaurant activity</p>
                    </div>

                    <ClipboardList size={21} />
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="restaurant-analytics-panel-empty">
                      No recent orders.
                    </div>
                  ) : (
                    <div className="restaurant-analytics-orders-table-wrapper">
                      <table className="restaurant-analytics-orders-table">
                        <thead>
                          <tr>
                            <th>Order</th>

                            <th>Date</th>

                            <th>Status</th>

                            <th>Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {recentOrders.map((order) => {
                            const status = normaliseStatus(order.status);

                            return (
                              <tr key={order._id}>
                                <td>#{String(order._id).slice(-6)}</td>

                                <td>{formatDate(getOrderDate(order))}</td>

                                <td>
                                  <span className="restaurant-analytics-order-status">
                                    {status}
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {formatCurrency(getOrderTotal(order))}
                                  </strong>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ======================================

// EXPORT

// ======================================

export default RestaurantAnalyticsPage;
