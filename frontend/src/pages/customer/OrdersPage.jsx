import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { findOrders } from "../../services/orderService";

import "../../styles/OrdersPage.css";

function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await findOrders();

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : [];

      setOrders(orderList);
    } catch (error) {
      console.error("Failed to load orders:", error);

      setError(error.response?.data?.message || "Could not load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatCurrency = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "R0.00";
    }

    return `R${value.toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const normaliseStatus = (status) =>
    String(status || "")
      .trim()
      .toLowerCase();

  const getStatusLabel = (status) => {
    const labels = {
      pending_confirmation: "Pending Confirmation",
      confirmed: "Confirmed",
      accepted: "Accepted",
      preparing: "Preparing",
      ready_for_pickup: "Ready for Pickup",
      driver_assigned: "Driver Assigned",
      collecting: "Driver Collecting",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };

    return labels[normaliseStatus(status)] || status || "Unknown";
  };

  const getStatusClass = (status) => {
    const value = normaliseStatus(status);

    if (value === "delivered") {
      return "orders-status orders-status--success";
    }

    if (value === "cancelled" || value === "refunded") {
      return "orders-status orders-status--danger";
    }

    if (value === "pending_confirmation") {
      return "orders-status orders-status--pending";
    }

    if (
      value === "driver_assigned" ||
      value === "collecting" ||
      value === "out_for_delivery"
    ) {
      return "orders-status orders-status--delivery";
    }

    return "orders-status orders-status--active";
  };

  const getStatusIcon = (status) => {
    const value = normaliseStatus(status);

    if (value === "delivered") {
      return <CheckCircle2 size={16} />;
    }

    if (value === "cancelled" || value === "refunded") {
      return <XCircle size={16} />;
    }

    if (value === "pending_confirmation") {
      return <Clock3 size={16} />;
    }

    if (
      value === "driver_assigned" ||
      value === "collecting" ||
      value === "out_for_delivery"
    ) {
      return <Truck size={16} />;
    }

    return <PackageCheck size={16} />;
  };

  const getOrderTotal = (order) =>
    Number(order?.total_price ?? order?.pricing?.total ?? 0);

  const getOrderItemCount = (order) => {
    const restaurantOrders = Array.isArray(order?.restaurant_orders)
      ? order.restaurant_orders
      : [];

    return restaurantOrders.reduce((restaurantTotal, restaurantOrder) => {
      const items = Array.isArray(restaurantOrder?.items)
        ? restaurantOrder.items
        : [];

      return (
        restaurantTotal +
        items.reduce(
          (itemTotal, item) =>
            itemTotal + Math.max(1, Number(item.quantity || 1)),
          0,
        )
      );
    }, 0);
  };

  const getRestaurantNames = (order) => {
    const restaurantOrders = Array.isArray(order?.restaurant_orders)
      ? order.restaurant_orders
      : [];

    const names = restaurantOrders
      .map((restaurantOrder) => restaurantOrder?.restaurant_name)
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }

    return (
      order?.restaurant_name ||
      (order?.is_bundled_order ? "Multiple restaurants" : "Restaurant")
    );
  };

  const getDeliveryAddress = (order) => {
    if (typeof order?.delivery_address === "string") {
      return order.delivery_address;
    }

    return (
      order?.delivery_address?.formatted_address ||
      [
        order?.delivery_address?.street_address,
        order?.delivery_address?.suburb,
        order?.delivery_address?.city,
        order?.delivery_address?.province,
      ]
        .filter(Boolean)
        .join(", ")
    );
  };

  const canStillEdit = (order) => {
    if (normaliseStatus(order?.status) !== "pending_confirmation") {
      return false;
    }

    if (!order?.editable_until) {
      return false;
    }

    return new Date(order.editable_until).getTime() > Date.now();
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") {
      return orders;
    }

    if (statusFilter === "delivered") {
      return orders.filter(
        (order) => normaliseStatus(order.status) === "delivered",
      );
    }

    if (statusFilter === "cancelled") {
      return orders.filter((order) => {
        const status = normaliseStatus(order.status);
        return status === "cancelled" || status === "refunded";
      });
    }

    if (statusFilter === "active") {
      return orders.filter((order) => {
        const status = normaliseStatus(order.status);
        return !["delivered", "cancelled", "refunded"].includes(status);
      });
    }

    return orders;
  }, [orders, statusFilter]);

  const activeCount = orders.filter(
    (order) =>
      !["delivered", "cancelled", "refunded"].includes(
        normaliseStatus(order.status),
      ),
  ).length;

  const deliveredCount = orders.filter(
    (order) => normaliseStatus(order.status) === "delivered",
  ).length;

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="orders-layout">
      <Navbar />

      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-top-actions">
            <button
              type="button"
              className="orders-back-button"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>

            <button
              type="button"
              className="orders-refresh-button"
              onClick={() => loadOrders(true)}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "orders-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <section className="orders-header">
            <div className="orders-header-content">
              <span className="orders-eyebrow">
                <ShoppingBag size={16} />
                Your orders
              </span>

              <h1>Orders</h1>

              <p>Track current orders and review your previous deliveries.</p>
            </div>

            {!loading && !error && orders.length > 0 && (
              <div className="orders-header-stats">
                <div>
                  <strong>{activeCount}</strong>
                  <span>Active</span>
                </div>

                <div>
                  <strong>{deliveredCount}</strong>
                  <span>Delivered</span>
                </div>
              </div>
            )}
          </section>

          {!loading && !error && orders.length > 0 && (
            <div className="orders-filters">
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={
                    statusFilter === filter.value
                      ? "orders-filter orders-filter--active"
                      : "orders-filter"
                  }
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <section className="orders-state">
              <div className="orders-loader" />
              <h2>Loading orders</h2>
              <p>Getting your latest Dish Dash orders.</p>
            </section>
          )}

          {!loading && error && (
            <section className="orders-state orders-state--error">
              <div className="orders-state-icon">
                <ShoppingBag size={30} />
              </div>

              <h2>Could not load orders</h2>
              <p>{error}</p>

              <button type="button" onClick={() => loadOrders()}>
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          )}

          {!loading && !error && orders.length === 0 && (
            <section className="orders-state">
              <div className="orders-state-icon">
                <ShoppingBag size={30} />
              </div>

              <h2>No orders yet</h2>

              <p>Your orders will appear here once you place one.</p>

              <button type="button" onClick={() => navigate("/restaurants")}>
                <Store size={17} />
                Browse Restaurants
              </button>
            </section>
          )}

          {!loading &&
            !error &&
            orders.length > 0 &&
            filteredOrders.length === 0 && (
              <section className="orders-filter-empty">
                <PackageCheck size={28} />
                <strong>No matching orders</strong>
                <span>Try another order filter.</span>
              </section>
            )}

          {!loading && !error && filteredOrders.length > 0 && (
            <section className="orders-list">
              {filteredOrders.map((order) => {
                const itemCount = getOrderItemCount(order);
                const total = getOrderTotal(order);
                const restaurantNames = getRestaurantNames(order);
                const address = getDeliveryAddress(order);
                const editable = canStillEdit(order);

                return (
                  <article key={order._id} className="orders-card">
                    <div className="orders-card-top">
                      <div className="orders-card-number">
                        <span>Order</span>

                        <strong>
                          #{order.order_number || String(order._id).slice(-8)}
                        </strong>

                        <small>{formatDate(order.createdAt)}</small>
                      </div>

                      <span className={getStatusClass(order.status)}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="orders-card-info">
                      <div className="orders-info-row">
                        <Store size={17} />

                        <div>
                          <span>
                            {order.is_bundled_order
                              ? "Restaurants"
                              : "Restaurant"}
                          </span>

                          <strong>{restaurantNames}</strong>
                        </div>
                      </div>

                      <div className="orders-info-row">
                        <ShoppingBag size={17} />

                        <div>
                          <span>Items</span>

                          <strong>
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </strong>
                        </div>
                      </div>

                      {address && (
                        <div className="orders-info-row orders-info-row--address">
                          <MapPin size={17} />

                          <div>
                            <span>Delivery</span>
                            <strong>{address}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="orders-card-footer">
                      <div className="orders-total">
                        <span>Total</span>
                        <strong>{formatCurrency(total)}</strong>
                      </div>

                      <div className="orders-card-actions">
                        {editable && (
                          <button
                            type="button"
                            className="orders-review-button"
                            onClick={() =>
                              navigate(`/order-confirmation/${order._id}`)
                            }
                          >
                            <Clock3 size={17} />
                            Review Order
                          </button>
                        )}

                        <button
                          type="button"
                          className="orders-view-button"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          View Order
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrdersPage;
