// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Heart,
  MapPin,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { getRestaurants } from "../../services/restaurantService";

import {
  getFavouriteRestaurantIds,
  removeFavouriteRestaurant,
} from "../../services/favouriteService";

import "../../styles/FavouritesPage.css";

// ======================================
// FAVOURITES PAGE
// ======================================

function FavouritesPage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // STATE
  // ======================================

  const [favouriteRestaurants, setFavouriteRestaurants] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================
  // LOAD FAVOURITES
  // ======================================

  const loadFavourites = async () => {
    try {
      setLoading(true);

      setError("");

      // ======================================
      // GET SAVED FAVOURITE IDS
      // ======================================

      const favouriteIds = getFavouriteRestaurantIds();

      // ======================================
      // NO FAVOURITES
      // ======================================

      if (favouriteIds.length === 0) {
        setFavouriteRestaurants([]);

        return;
      }

      // ======================================
      // GET RESTAURANTS
      // ======================================

      const data = await getRestaurants();

      const restaurantList = Array.isArray(data)
        ? data
        : Array.isArray(data?.restaurants)
          ? data.restaurants
          : [];

      // ======================================
      // FILTER FAVOURITES
      // ======================================

      const favourites = restaurantList.filter((restaurant) =>
        favouriteIds.includes(String(restaurant._id)),
      );

      setFavouriteRestaurants(favourites);
    } catch (error) {
      console.error("Failed to load favourites:", error);

      setError(
        error.response?.data?.message ||
          "Could not load your favourite restaurants.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD PAGE
  // ======================================

  useEffect(() => {
    loadFavourites();
  }, []);

  // ======================================
  // LISTEN FOR FAVOURITE CHANGES
  // ======================================

  useEffect(() => {
    const handleChange = () => {
      loadFavourites();
    };

    window.addEventListener("favouritesChanged", handleChange);

    return () => {
      window.removeEventListener("favouritesChanged", handleChange);
    };
  }, []);

  // ======================================
  // REMOVE FAVOURITE
  // ======================================

  const handleRemoveFavourite = (restaurantId) => {
    removeFavouriteRestaurant(restaurantId);

    setFavouriteRestaurants((restaurants) =>
      restaurants.filter(
        (restaurant) => String(restaurant._id) !== String(restaurantId),
      ),
    );
  };

  // ======================================
  // FORMAT RESTAURANT ADDRESS
  // ======================================

  const formatRestaurantAddress = (restaurant) => {
    if (!restaurant) {
      return "";
    }

    // ======================================
    // FULL GEOAPIFY ADDRESS
    // ======================================

    if (restaurant.formatted_address) {
      return restaurant.formatted_address;
    }

    // ======================================
    // STRUCTURED ADDRESS
    // ======================================

    const structuredAddress = [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
      restaurant.country,
    ]
      .filter(Boolean)
      .join(", ");

    if (structuredAddress) {
      return structuredAddress;
    }

    // ======================================
    // OLD LEGACY ADDRESS FALLBACK
    // ======================================

    if (typeof restaurant.address === "string") {
      return restaurant.address;
    }

    return "";
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="favourites-layout">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN PAGE
      ====================================== */}

      <main className="favourites-page">
        <div className="favourites-container">
          {/* ======================================
              BACK BUTTON
          ====================================== */}

          <button
            type="button"
            className="favourites-back-button"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="favourites-header mobile-page-header">
            <div className="favourites-header-content">
              <span className="favourites-eyebrow">
                <Heart size={16} fill="currentColor" />
                Your favourites
              </span>

              <h1>Favourite Restaurants</h1>

              <p>
                Keep your favourite restaurants together so you can quickly find
                them again.
              </p>
            </div>

            {!loading && !error && favouriteRestaurants.length > 0 && (
              <div className="favourites-count">
                <strong>{favouriteRestaurants.length}</strong>

                <span>
                  {favouriteRestaurants.length === 1
                    ? "Favourite"
                    : "Favourites"}
                </span>
              </div>
            )}
          </section>

          {/* ======================================
              LOADING
          ====================================== */}

          {loading && (
            <section className="favourites-state">
              <div className="favourites-loader" />

              <h2>Loading favourites</h2>

              <p>Getting your favourite restaurants.</p>
            </section>
          )}

          {/* ======================================
              ERROR
          ====================================== */}

          {!loading && error && (
            <section className="favourites-state favourites-state--error">
              <div className="favourites-state-icon">
                <Heart size={28} />
              </div>

              <h2>Could not load favourites</h2>

              <p>{error}</p>

              <button
                type="button"
                className="favourites-retry-button"
                onClick={loadFavourites}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          )}

          {/* ======================================
              EMPTY FAVOURITES
          ====================================== */}

          {!loading && !error && favouriteRestaurants.length === 0 && (
            <section className="favourites-empty">
              <div className="favourites-empty-icon">
                <Heart size={32} />
              </div>

              <h2>No favourites yet</h2>

              <p>Restaurants you favourite will appear here.</p>

              <button
                type="button"
                className="favourites-browse-button"
                onClick={() => navigate("/restaurants")}
              >
                <Store size={17} />
                Browse Restaurants
              </button>
            </section>
          )}

          {/* ======================================
              FAVOURITE GRID
          ====================================== */}

          {!loading && !error && favouriteRestaurants.length > 0 && (
            <section className="favourites-grid">
              {favouriteRestaurants.map((restaurant) => {
                // ======================================
                // UPDATED RESTAURANT ADDRESS
                // ======================================

                const address = formatRestaurantAddress(restaurant);

                return (
                  <article
                    key={restaurant._id}
                    className="favourites-card"
                    onClick={() => navigate(`/restaurants/${restaurant._id}`)}
                  >
                    {/* ======================================
                            IMAGE
                        ====================================== */}

                    <div className="favourites-image-wrapper">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="favourites-image"
                        />
                      ) : (
                        <div className="favourites-image-placeholder">
                          <Store size={32} />

                          <span>No image</span>
                        </div>
                      )}

                      {/* ======================================
                              FAVOURITE HEART
                          ====================================== */}

                      <div className="favourites-heart-badge">
                        <Heart size={18} fill="currentColor" />
                      </div>

                      {/* ======================================
                              STATUS
                          ====================================== */}

                      {typeof restaurant.is_open === "boolean" && (
                        <span
                          className={
                            restaurant.is_open
                              ? "favourites-status favourites-status--open"
                              : "favourites-status favourites-status--closed"
                          }
                        >
                          {restaurant.is_open ? "Open" : "Closed"}
                        </span>
                      )}
                    </div>

                    {/* ======================================
                            CONTENT
                        ====================================== */}

                    <div className="favourites-card-content">
                      <h2>{restaurant.name}</h2>

                      <p className="favourites-description">
                        {restaurant.description ||
                          "View this restaurant and explore its menu."}
                      </p>

                      {/* ======================================
                              UPDATED ADDRESS
                          ====================================== */}

                      {address && (
                        <div className="favourites-address">
                          <MapPin size={16} />

                          <span>{address}</span>
                        </div>
                      )}

                      {/* ======================================
                              ACTIONS
                          ====================================== */}

                      <div className="favourites-card-actions">
                        <button
                          type="button"
                          className="favourites-view-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            navigate(`/restaurants/${restaurant._id}`);
                          }}
                        >
                          View Restaurant
                        </button>

                        <button
                          type="button"
                          className="favourites-remove-button"
                          aria-label={`Remove ${restaurant.name} from favourites`}
                          onClick={(event) => {
                            event.stopPropagation();

                            handleRemoveFavourite(restaurant._id);
                          }}
                        >
                          <Trash2 size={17} />
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

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

export default FavouritesPage;
