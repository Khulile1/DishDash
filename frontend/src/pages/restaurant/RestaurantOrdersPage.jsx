import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

import { getRestaurants } from "../../services/restaurantService";
import { findOrders } from "../../services/orderService";
import RestaurantNavbar from "./RestaurantNavbar";

import "../../styles/RestaurantOrdersPage.css";

const STATUS_LABELS = {
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

const TERMINAL_STATUSES = new Set(["delivered", "cancelled", "refunded"]);
const READY_STATUSES = new Set([
  "ready_for_pickup",
  "driver_assigned",
  "collecting",
  "out_for_delivery",
]);

const getId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }
  return String(value ?? "");
};

const normalizeStatus = (value) =>
  String(value || "pending_confirmation")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

const getStatusLabel = (status) =>
  STATUS_LABELS[normalizeStatus(status)] ||
  normalizeStatus(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusTone = (status) => {
  const value = normalizeStatus(status);
  if (["cancelled", "refunded"].includes(value)) return "danger";
  if (value === "delivered") return "success";
  if (value === "pending_confirmation") return "pending";
  if (READY_STATUSES.has(value)) return "delivery";
  return "active";
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    Number(value) || 0,
  );

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getOrderDate = (order) =>
  order.createdAt || order.created_at || order.order_date;

const getItems = (order, restaurantOrder) => {
  if (restaurantOrder) {
    return Array.isArray(restaurantOrder.items) ? restaurantOrder.items : [];
  }
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.orderItems)) return order.orderItems;
  return [];
};

const getItemName = (item) =>
  item.name || item.menu_item_id?.name || item.menu_item?.name || "Menu item";

const getQuantity = (item) => Math.max(1, Number(item.quantity) || 1);

const getItemPrice = (item) => {
  const value = item.price ?? item.unit_price ?? item.menu_item_id?.price;
  return value == null || !Number.isFinite(Number(value))
    ? null
    : Number(value);
};

const getRestaurantTotal = (order, restaurantOrder, items) => {
  const value = restaurantOrder
    ? (restaurantOrder.subtotal ??
      restaurantOrder.total_price ??
      restaurantOrder.total)
    : (order.total_price ??
      order.pricing?.total ??
      order.total ??
      order.grand_total);

  if (value != null && Number.isFinite(Number(value))) return Number(value);

  // Never use a bundled order's grand total for a single restaurant.
  if (items.length > 0 && items.every((item) => getItemPrice(item) !== null)) {
    return items.reduce(
      (sum, item) => sum + getItemPrice(item) * getQuantity(item),
      0,
    );
  }
  return null;
};

const getCustomerName = (order) => {
  const customer = order.customer_id || order.customer || order.user_id || {};
  const name = [
    customer.first_name || customer.firstName,
    customer.last_name || customer.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    order.customer_name ||
    name ||
    customer.name ||
    order.user_name ||
    "Customer"
  );
};

const getDeliveryAddress = (order) => {
  const address = order.delivery_address;
  if (typeof address === "string") return address;
  if (!address) return "";
  return (
    address.formatted_address ||
    [address.street_address, address.suburb, address.city, address.province]
      .filter(Boolean)
      .join(", ")
  );
};

const normalizeOrdersForRestaurant = (orders, restaurantId) => {
  if (!restaurantId) return [];
  const result = [];

  orders.forEach((order, index) => {
    const restaurantOrders = Array.isArray(order.restaurant_orders)
      ? order.restaurant_orders
      : [];

    if (restaurantOrders.length > 0) {
      restaurantOrders.forEach((restaurantOrder, restaurantIndex) => {
        const ownerRestaurantId = getId(
          restaurantOrder.restaurant_id || restaurantOrder.restaurant,
        );
        if (ownerRestaurantId !== restaurantId) return;

        const items = getItems(order, restaurantOrder);
        result.push({
          id: `${getId(order._id || order.id) || index}-${getId(restaurantOrder._id) || restaurantIndex}`,
          order,
          restaurantOrder,
          items,
          total: getRestaurantTotal(order, restaurantOrder, items),
          status: normalizeStatus(restaurantOrder.status || order.status),
        });
      });
      return;
    }

    if (getId(order.restaurant_id || order.restaurant) !== restaurantId) return;
    const items = getItems(order, null);
    result.push({
      id: getId(order._id || order.id) || String(index),
      order,
      restaurantOrder: null,
      items,
      total: getRestaurantTotal(order, null, items),
      status: normalizeStatus(order.status),
    });
  });

  return result.sort(
    (a, b) =>
      new Date(getOrderDate(b.order) || 0).getTime() -
      new Date(getOrderDate(a.order) || 0).getTime(),
  );
};

const FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function RestaurantOrdersPage() {
  const navigate = useNavigate();
  const hasLoaded = useRef(false);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      if (hasLoaded.current) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const [restaurantData, orderData] = await Promise.all([
          getRestaurants(),
          findOrders(),
        ]);
        if (cancelled) return;

        const restaurantList = Array.isArray(restaurantData)
          ? restaurantData
          : Array.isArray(restaurantData?.restaurants)
            ? restaurantData.restaurants
            : [];

        const token = localStorage.getItem("token");
        let ownerId = null;
        if (token) {
          try {
            const decoded = jwtDecode(token);
            ownerId = decoded.id || decoded._id || decoded.userId || null;
          } catch (decodeError) {
            console.error(
              "Could not decode restaurant owner token:",
              decodeError,
            );
          }
        }

        // Mirrors RestaurantAnalyticsPage. The API must also enforce ownership.
        const ownedRestaurants = ownerId
          ? restaurantList.filter(
              (restaurant) => getId(restaurant.owner_id) === String(ownerId),
            )
          : restaurantList;

        const orderList = Array.isArray(orderData)
          ? orderData
          : Array.isArray(orderData?.orders)
            ? orderData.orders
            : [];

        setRestaurants(ownedRestaurants);
        setSelectedRestaurantId((currentId) =>
          ownedRestaurants.some(
            (restaurant) => getId(restaurant._id) === currentId,
          )
            ? currentId
            : getId(ownedRestaurants[0]?._id),
        );
        setOrders(orderList);
      } catch (requestError) {
        if (!cancelled) {
          console.error("Restaurant order loading error:", requestError);
          setError(
            requestError.response?.data?.message ||
              "Could not load restaurant orders.",
          );
        }
      } finally {
        if (!cancelled) {
          hasLoaded.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setReloadKey((value) => value + 1);
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedRestaurant = restaurants.find(
    (restaurant) => getId(restaurant._id) === selectedRestaurantId,
  );

  const restaurantOrders = useMemo(
    () => normalizeOrdersForRestaurant(orders, selectedRestaurantId),
    [orders, selectedRestaurantId],
  );

  const counts = useMemo(
    () => ({
      all: restaurantOrders.length,
      new: restaurantOrders.filter(
        (row) => row.status === "pending_confirmation",
      ).length,
      inProgress: restaurantOrders.filter(
        (row) =>
          row.status !== "pending_confirmation" &&
          !TERMINAL_STATUSES.has(row.status),
      ).length,
      completed: restaurantOrders.filter((row) => row.status === "delivered")
        .length,
    }),
    [restaurantOrders],
  );

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return restaurantOrders.filter((row) => {
      const statusMatches =
        filter === "all" ||
        (filter === "new" && row.status === "pending_confirmation") ||
        (filter === "in_progress" &&
          row.status !== "pending_confirmation" &&
          !TERMINAL_STATUSES.has(row.status)) ||
        (filter === "completed" && row.status === "delivered") ||
        (filter === "cancelled" &&
          ["cancelled", "refunded"].includes(row.status));

      if (!statusMatches) return false;
      if (!searchText) return true;

      const searchable = [
        row.order.order_number,
        getId(row.order._id || row.order.id),
        getCustomerName(row.order),
        getDeliveryAddress(row.order),
        ...row.items.map(getItemName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(searchText);
    });
  }, [restaurantOrders, filter, search]);

  const changeFilter = (value) => {
    setFilter(value);
    setVisibleCount(20);
  };

  return (
    <div className="restaurant-orders-layout">
      <RestaurantNavbar />

      <main className="restaurant-orders-page">
        <div className="restaurant-orders-container">
          <div className="restaurant-orders-top-actions">
            <button
              type="button"
              className="restaurant-orders-back"
              onClick={() => navigate("/restaurant")}
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <div className="restaurant-orders-top-right">
              <button
                type="button"
                className="restaurant-orders-outline"
                onClick={() => navigate("/restaurant/analytics")}
              >
                <BarChart3 size={17} /> Analytics
              </button>
              <button
                type="button"
                className="restaurant-orders-outline"
                onClick={() => setReloadKey((value) => value + 1)}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "restaurant-orders-spin" : ""}
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>

          <section className="restaurant-orders-header">
            <div>
              <span className="restaurant-orders-eyebrow">
                <ClipboardList size={16} /> Order Management
              </span>
              <h1>Restaurant Orders</h1>
              <p>
                See incoming orders, track their progress and review the items
                your customers ordered.
              </p>
            </div>
            {restaurants.length > 1 && (
              <label className="restaurant-orders-restaurant-picker">
                <span>Restaurant</span>
                <select
                  value={selectedRestaurantId}
                  onChange={(event) => {
                    setSelectedRestaurantId(event.target.value);
                    setExpandedOrderId("");
                    setVisibleCount(20);
                  }}
                >
                  {restaurants.map((restaurant) => (
                    <option
                      key={getId(restaurant._id)}
                      value={getId(restaurant._id)}
                    >
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          {loading ? (
            <section className="restaurant-orders-state" role="status">
              <div className="restaurant-orders-loader" />
              <h2>Loading restaurant orders</h2>
              <p>Connecting to your latest Dish Dash orders.</p>
            </section>
          ) : error ? (
            <section
              className="restaurant-orders-state restaurant-orders-state--error"
              role="alert"
            >
              <XCircle size={34} />
              <h2>Could not load orders</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Try Again
              </button>
            </section>
          ) : !selectedRestaurant ? (
            <section className="restaurant-orders-state">
              <Store size={34} />
              <h2>No restaurant profile</h2>
              <p>Create your restaurant profile before managing its orders.</p>
              <button
                type="button"
                onClick={() => navigate("/restaurant/profile")}
              >
                Restaurant Profile
              </button>
            </section>
          ) : (
            <>
              <div className="restaurant-orders-current">
                <Store size={17} /> Orders for{" "}
                <strong>{selectedRestaurant.name}</strong>
                <span>Refreshes every minute</span>
              </div>

              <section
                className="restaurant-orders-metrics"
                aria-label="Order summary"
              >
                <article className="restaurant-orders-metric-card">
                  <div className="restaurant-orders-metric-icon">
                    <ShoppingBag size={22} />
                  </div>
                  <span>All Orders</span>
                  <strong>{counts.all}</strong>
                  <small>For this restaurant</small>
                </article>
                <article className="restaurant-orders-metric-card">
                  <div className="restaurant-orders-metric-icon">
                    <Clock3 size={22} />
                  </div>
                  <span>Awaiting Confirmation</span>
                  <strong>{counts.new}</strong>
                  <small>New orders</small>
                </article>
                <article className="restaurant-orders-metric-card">
                  <div className="restaurant-orders-metric-icon">
                    <PackageCheck size={22} />
                  </div>
                  <span>In Progress</span>
                  <strong>{counts.inProgress}</strong>
                  <small>Being handled</small>
                </article>
                <article className="restaurant-orders-metric-card">
                  <div className="restaurant-orders-metric-icon">
                    <CheckCircle2 size={22} />
                  </div>
                  <span>Delivered</span>
                  <strong>{counts.completed}</strong>
                  <small>Completed orders</small>
                </article>
              </section>

              <section
                className="restaurant-orders-panel"
                aria-label="Restaurant order list"
              >
                <div className="restaurant-orders-panel-header">
                  <div>
                    <h2>Order Queue</h2>
                    <p>Newest orders appear first.</p>
                  </div>
                  <label className="restaurant-orders-search">
                    <Search size={18} />
                    <span className="restaurant-orders-sr-only">
                      Search orders
                    </span>
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setVisibleCount(20);
                      }}
                      placeholder="Search orders, customers, items"
                    />
                  </label>
                </div>

                <div
                  className="restaurant-orders-filters"
                  role="group"
                  aria-label="Filter by order status"
                >
                  {FILTERS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        filter === option.value
                          ? "restaurant-orders-filter restaurant-orders-filter--active"
                          : "restaurant-orders-filter"
                      }
                      onClick={() => changeFilter(option.value)}
                      aria-pressed={filter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="restaurant-orders-empty">
                    <ClipboardList size={30} />
                    <strong>
                      {restaurantOrders.length === 0
                        ? "No orders yet"
                        : "No matching orders"}
                    </strong>
                    <span>
                      {restaurantOrders.length === 0
                        ? "Customer orders will appear here once received."
                        : "Try a different filter or search term."}
                    </span>
                  </div>
                ) : (
                  <div className="restaurant-orders-list">
                    {filteredOrders.slice(0, visibleCount).map((row) => {
                      const number =
                        row.order.order_number ||
                        getId(row.order._id || row.order.id).slice(-8);
                      const customer = getCustomerName(row.order);
                      const address = getDeliveryAddress(row.order);
                      const expanded = expandedOrderId === row.id;
                      const itemCount = row.items.reduce(
                        (sum, item) => sum + getQuantity(item),
                        0,
                      );
                      const detailsId = `restaurant-order-details-${row.id.replace(/[^a-zA-Z0-9-]/g, "")}`;

                      return (
                        <article
                          className="restaurant-orders-card"
                          key={row.id}
                        >
                          <div className="restaurant-orders-card-head">
                            <div>
                              <span className="restaurant-orders-order-label">
                                Order #{number || "New"}
                              </span>
                              <small>
                                {formatDate(getOrderDate(row.order))}
                              </small>
                            </div>
                            <span
                              className={`restaurant-orders-status restaurant-orders-status--${getStatusTone(row.status)}`}
                            >
                              {getStatusTone(row.status) === "success" ? (
                                <CheckCircle2 size={14} />
                              ) : getStatusTone(row.status) === "danger" ? (
                                <XCircle size={14} />
                              ) : getStatusTone(row.status) === "delivery" ? (
                                <Truck size={14} />
                              ) : (
                                <Clock3 size={14} />
                              )}
                              {getStatusLabel(row.status)}
                            </span>
                          </div>

                          <div className="restaurant-orders-card-body">
                            <div>
                              <span>Customer</span>
                              <strong>{customer}</strong>
                            </div>
                            <div>
                              <span>Items</span>
                              <strong>
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                              </strong>
                            </div>
                            <div>
                              <span>Restaurant Total</span>
                              <strong>
                                {row.total === null
                                  ? "—"
                                  : formatCurrency(row.total)}
                              </strong>
                            </div>
                          </div>

                          <div className="restaurant-orders-card-foot">
                            <span className="restaurant-orders-card-hint">
                              <ShoppingBag size={16} />{" "}
                              {row.items
                                .slice(0, 2)
                                .map(getItemName)
                                .join(", ") || "Order details"}
                              {row.items.length > 2 ? " + more" : ""}
                            </span>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={detailsId}
                              onClick={() =>
                                setExpandedOrderId(expanded ? "" : row.id)
                              }
                            >
                              {expanded ? "Hide details" : "View details"}
                              {expanded ? (
                                <ChevronUp size={17} />
                              ) : (
                                <ChevronDown size={17} />
                              )}
                            </button>
                          </div>

                          {expanded && (
                            <div
                              className="restaurant-orders-details"
                              id={detailsId}
                            >
                              <h3>Items ordered</h3>
                              {row.items.length === 0 ? (
                                <p>
                                  Item details are not available for this order.
                                </p>
                              ) : (
                                <ul className="restaurant-orders-items">
                                  {row.items.map((item, itemIndex) => (
                                    <li
                                      key={`${getItemName(item)}-${itemIndex}`}
                                    >
                                      <span>
                                        <b>{getQuantity(item)}×</b>{" "}
                                        {getItemName(item)}
                                      </span>
                                      <strong>
                                        {getItemPrice(item) === null
                                          ? "—"
                                          : formatCurrency(
                                              getItemPrice(item) *
                                                getQuantity(item),
                                            )}
                                      </strong>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {address && (
                                <p className="restaurant-orders-address">
                                  <MapPin size={16} /> {address}
                                </p>
                              )}
                              {(row.restaurantOrder?.special_instructions ||
                                row.order.special_instructions) && (
                                <p className="restaurant-orders-note">
                                  Instructions:{" "}
                                  {row.restaurantOrder?.special_instructions ||
                                    row.order.special_instructions}
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                    {filteredOrders.length > visibleCount && (
                      <button
                        className="restaurant-orders-load-more"
                        type="button"
                        onClick={() => setVisibleCount((value) => value + 20)}
                      >
                        Show more orders ({filteredOrders.length - visibleCount}{" "}
                        remaining)
                      </button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default RestaurantOrdersPage;
