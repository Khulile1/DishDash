import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { LogIn, MapPin, RefreshCw, Search, Store } from "lucide-react";

import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "../../components/common/PublicFooter";

import { getRestaurants } from "../../services/restaurantService";

import "../../styles/PublicPages.css";

function PublicRestaurantsPage() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================
  // LOAD RESTAURANTS
  // ======================================

  const loadRestaurants = async () => {
    try {
      setLoading(true);

      setError("");

      const data = await getRestaurants();

      const restaurantList = Array.isArray(data)
        ? data
        : Array.isArray(data?.restaurants)
          ? data.restaurants
          : [];

      setRestaurants(restaurantList);
    } catch (error) {
      console.error("Could not load public restaurants:", error);

      setError(
        error.response?.data?.message ||
          "Could not load restaurants right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    loadRestaurants();
  }, []);

  // ======================================
  // ADDRESS
  // ======================================

  const formatAddress = (restaurant) => {
    if (restaurant?.formatted_address) {
      return restaurant.formatted_address;
    }

    return [
      restaurant?.street_address,
      restaurant?.suburb,
      restaurant?.city,
      restaurant?.province,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ======================================
  // FILTER
  // ======================================

  const visibleRestaurants = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return restaurants;
    }

    return restaurants.filter((restaurant) =>
      [
        restaurant.name,
        restaurant.description,
        restaurant.city,
        restaurant.suburb,
        restaurant.cuisine_type,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [restaurants, search]);

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="public-page-layout">
      <PublicNavbar />

      <main className="public-page">
        <div className="public-container">
          <section className="public-hero">
            <span className="public-eyebrow">Restaurants</span>

            <h1>Discover restaurants on Dish Dash.</h1>

            <p>
              Browse restaurants available on Dish Dash. Sign in when you're
              ready to order.
            </p>
          </section>

          <section className="public-section">
            <div className="public-restaurant-toolbar">
              <div>
                <h2>Explore restaurants</h2>

                <p>
                  {visibleRestaurants.length}{" "}
                  {visibleRestaurants.length === 1
                    ? "restaurant"
                    : "restaurants"}
                </p>
              </div>

              <label className="public-search">
                <Search size={19} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search restaurants"
                />
              </label>
            </div>

            {loading && (
              <div className="public-state">
                <div className="public-loader" />

                <h3>Loading restaurants</h3>

                <p>Finding restaurants available on Dish Dash.</p>
              </div>
            )}

            {!loading && error && (
              <div className="public-state">
                <span className="public-state-icon">
                  <Store size={27} />
                </span>

                <h3>Could not load restaurants</h3>

                <p>{error}</p>

                <button
                  type="button"
                  className="public-primary-button"
                  onClick={loadRestaurants}
                >
                  <RefreshCw size={17} />
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && visibleRestaurants.length === 0 && (
              <div className="public-state">
                <span className="public-state-icon">
                  <Store size={27} />
                </span>

                <h3>No restaurants found</h3>

                <p>Try another search.</p>
              </div>
            )}

            {!loading && !error && visibleRestaurants.length > 0 && (
              <div className="public-restaurant-grid">
                {visibleRestaurants.map((restaurant) => {
                  const address = formatAddress(restaurant);

                  return (
                    <article
                      key={restaurant._id}
                      className="public-restaurant-card"
                    >
                      <div className="public-restaurant-image">
                        {restaurant.image_url ? (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="public-restaurant-placeholder">
                            <Store size={36} />
                          </div>
                        )}
                      </div>

                      <div className="public-restaurant-content">
                        <span className="public-restaurant-label">
                          Restaurant
                        </span>

                        <h3>{restaurant.name || "Restaurant"}</h3>

                        {restaurant.description && (
                          <p className="public-restaurant-description">
                            {restaurant.description}
                          </p>
                        )}

                        {address && (
                          <div className="public-restaurant-address">
                            <MapPin size={16} />

                            <span>{address}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          className="public-restaurant-button"
                          onClick={() => navigate("/login")}
                        >
                          <LogIn size={17} />
                          Sign in to order
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PublicRestaurantsPage;
