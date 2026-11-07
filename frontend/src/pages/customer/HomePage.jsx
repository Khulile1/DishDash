// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Search,
  Star,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "../../styles/HomePage.css";

import { getRestaurants } from "../../services/restaurantService";

import {
  getFavouriteRestaurantIds,
  toggleFavouriteRestaurant,
} from "../../services/favouriteService";

// ======================================
// FALLBACK RESTAURANT IMAGE
// ======================================

const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85";

// ======================================
// RESTAURANT CATEGORIES
// ======================================

const categories = [
  {
    name: "Fast Food",
    slug: "fast-food",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=85",
  },

  {
    name: "African",
    slug: "african",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=85",
  },

  {
    name: "Braai & Grill",
    slug: "grill",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=85",
  },

  {
    name: "Italian",
    slug: "italian",
    image:
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=85",
  },

  {
    name: "Indian",
    slug: "indian",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=85",
  },

  {
    name: "Asian",
    slug: "asian",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=85",
  },
];

// ======================================
// HOME PAGE
// ======================================

function HomePage() {
  const navigate = useNavigate();

  // ======================================
  // SEARCH
  // ======================================

  const [location, setLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ======================================
  // RESTAURANTS
  // ======================================

  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);

  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  const [restaurantsError, setRestaurantsError] = useState("");

  // ======================================
  // FORCE OPEN / CLOSED REFRESH
  // ======================================

  const [, setStatusTick] = useState(0);

  // ======================================
  // FAVOURITES
  // ======================================

  const [favouriteRestaurantIds, setFavouriteRestaurantIds] = useState(() => {
    const favourites = getFavouriteRestaurantIds();

    return Array.isArray(favourites) ? favourites.map(String) : [];
  });

  // ======================================
  // TIME HELPER
  // ======================================

  const getTimeInMinutes = (timeValue) => {
    if (!timeValue) {
      return null;
    }

    const [hours, minutes] = String(timeValue).split(":").map(Number);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  };

  // ======================================
  // CURRENT SOUTH AFRICA TIME
  // ======================================

  const getSouthAfricaCurrentMinutes = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg",

      hour: "2-digit",

      minute: "2-digit",

      hour12: false,
    }).formatToParts(new Date());

    const hours = Number(parts.find((part) => part.type === "hour")?.value);

    const minutes = Number(parts.find((part) => part.type === "minute")?.value);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  };

  // ======================================
  // RESTAURANT OPEN / CLOSED STATE
  // ======================================

  const getRestaurantOpenState = (restaurant) => {
    if (!restaurant) {
      return null;
    }

    const opening = getTimeInMinutes(restaurant.opening_time);

    const closing = getTimeInMinutes(restaurant.closing_time);

    const current = getSouthAfricaCurrentMinutes();

    if (opening !== null && closing !== null && current !== null) {
      // OPEN 24 HOURS

      if (opening === closing) {
        return true;
      }

      // SAME DAY

      if (opening < closing) {
        return current >= opening && current < closing;
      }

      // OVERNIGHT

      return current >= opening || current < closing;
    }

    // BACKEND FALLBACK

    if (typeof restaurant.is_open === "boolean") {
      return restaurant.is_open;
    }

    return null;
  };

  // ======================================
  // OPERATING HOURS
  // ======================================

  const formatOperatingHours = (restaurant) => {
    const opening = restaurant?.opening_time;

    const closing = restaurant?.closing_time;

    if (!opening || !closing) {
      return "";
    }

    if (opening === closing) {
      return "Open 24 hours";
    }

    return `${opening} – ${closing}`;
  };

  // ======================================
  // FORMAT ADDRESS
  // ======================================

  const formatAddress = (restaurant) => {
    if (!restaurant) {
      return "";
    }

    if (restaurant.formatted_address) {
      return restaurant.formatted_address;
    }

    return [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
      restaurant.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ======================================
  // LOAD RESTAURANTS
  // ======================================

  useEffect(() => {
    let cancelled = false;

    const loadRestaurants = async () => {
      try {
        setRestaurantsLoading(true);

        setRestaurantsError("");

        const data = await getRestaurants();

        if (cancelled) {
          return;
        }

        const restaurantList = Array.isArray(data)
          ? data
          : Array.isArray(data?.restaurants)
            ? data.restaurants
            : [];

        setFeaturedRestaurants(restaurantList.slice(0, 4));
      } catch (error) {
        console.error("Failed to load restaurants:", error);

        if (!cancelled) {
          setRestaurantsError("Could not load restaurants.");

          setFeaturedRestaurants([]);
        }
      } finally {
        if (!cancelled) {
          setRestaurantsLoading(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, []);

  // ======================================
  // REFRESH OPEN / CLOSED EVERY MINUTE
  // ======================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusTick((current) => current + 1);
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ======================================
  // FAVOURITES SYNCHRONISATION
  // ======================================

  useEffect(() => {
    const syncFavourites = () => {
      const favourites = getFavouriteRestaurantIds();

      setFavouriteRestaurantIds(
        Array.isArray(favourites) ? favourites.map(String) : [],
      );
    };

    window.addEventListener("favouritesChanged", syncFavourites);

    return () => {
      window.removeEventListener("favouritesChanged", syncFavourites);
    };
  }, []);

  // ======================================
  // SEARCH
  // ======================================

  const handleSearch = (event) => {
    event.preventDefault();

    const query = new URLSearchParams();

    const cleanLocation = location.trim();

    const cleanSearchTerm = searchTerm.trim();

    if (cleanLocation) {
      query.set("location", cleanLocation);
    }

    if (cleanSearchTerm) {
      query.set("search", cleanSearchTerm);
    }

    const queryString = query.toString();

    navigate(`/restaurants${queryString ? `?${queryString}` : ""}`);
  };

  // ======================================
  // TOGGLE FAVOURITE
  // ======================================

  const handleToggleFavourite = (restaurantId) => {
    const updatedFavourites = toggleFavouriteRestaurant(String(restaurantId));

    setFavouriteRestaurantIds(
      Array.isArray(updatedFavourites) ? updatedFavourites.map(String) : [],
    );
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <>
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          CUSTOMER HOME
      ====================================== */}

      <main className="home-page">
        {/* ======================================
            DISCOVERY
        ====================================== */}

        <section
          className="home-discovery"
          aria-labelledby="home-discovery-title"
        >
          <div className="home-container home-discovery__inner">
            {/* INTRO */}

            <div className="home-discovery__heading">
              <h1 id="home-discovery-title">What are you craving today?</h1>

              <p>Find restaurants near you and order the food you love.</p>
            </div>

            {/* ======================================
                SEARCH
            ====================================== */}

            <form
              className="home-search home-discovery__search"
              onSubmit={handleSearch}
            >
              {/* LOCATION */}

              <label className="home-search__field">
                <span className="home-sr-only">Delivery location</span>

                <MapPin size={20} aria-hidden="true" />

                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Enter your delivery address"
                  autoComplete="street-address"
                />
              </label>

              {/* RESTAURANT / FOOD */}

              <label className="home-search__field">
                <span className="home-sr-only">Search restaurants or food</span>

                <Search size={20} aria-hidden="true" />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search restaurants or food"
                />
              </label>

              {/* BUTTON */}

              <button type="submit" className="home-search__button">
                Find food
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>

        {/* ======================================
            CUISINE CATEGORIES
        ====================================== */}

        <section
          className="home-section home-categories"
          aria-labelledby="home-categories-title"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <div>
                <h2 id="home-categories-title">
                  What are you in the mood for?
                </h2>

                <p>Browse restaurants by cuisine.</p>
              </div>

              <NavLink to="/restaurants" className="home-text-link">
                View all
                <ArrowRight size={18} aria-hidden="true" />
              </NavLink>
            </div>

            <div className="home-category-grid">
              {categories.map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/restaurants?category=${encodeURIComponent(
                    category.slug,
                  )}`}
                  className="home-category-card"
                  aria-label={`Browse ${category.name} restaurants`}
                >
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />

                  <span className="home-category-card__overlay" />

                  <span className="home-category-card__content">
                    <strong>{category.name}</strong>

                    <small>Explore</small>
                  </span>

                  <span className="home-category-card__arrow">
                    <ChevronRight size={19} aria-hidden="true" />
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================
            POPULAR RESTAURANTS
        ====================================== */}

        <section
          className="home-section home-section--soft ddx-featured-section"
          aria-labelledby="featured-restaurants-title"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <div>
                <h2 id="featured-restaurants-title">Popular near you</h2>

                <p>Discover restaurants available around you.</p>
              </div>

              <NavLink to="/restaurants" className="home-text-link">
                Browse all
                <ArrowRight size={18} aria-hidden="true" />
              </NavLink>
            </div>

            {/* LOADING */}

            {restaurantsLoading && (
              <div className="home-restaurants-message">
                Loading restaurants...
              </div>
            )}

            {/* ERROR */}

            {!restaurantsLoading && restaurantsError && (
              <div className="home-restaurants-message">{restaurantsError}</div>
            )}

            {/* EMPTY */}

            {!restaurantsLoading &&
              !restaurantsError &&
              featuredRestaurants.length === 0 && (
                <div className="home-restaurants-message">
                  No restaurants available yet.
                </div>
              )}

            {/* RESTAURANTS */}

            {!restaurantsLoading &&
              !restaurantsError &&
              featuredRestaurants.length > 0 && (
                <div className="ddx-restaurant-grid">
                  {featuredRestaurants.map((restaurant) => {
                    const restaurantId = String(restaurant._id);

                    const isFavourite =
                      favouriteRestaurantIds.includes(restaurantId);

                    const address = formatAddress(restaurant);

                    const isOpen = getRestaurantOpenState(restaurant);

                    const operatingHours = formatOperatingHours(restaurant);

                    return (
                      <article key={restaurant._id} className="ddx-card">
                        {/* IMAGE */}

                        <div className="ddx-card-media">
                          <img
                            src={
                              restaurant.image_url || DEFAULT_RESTAURANT_IMAGE
                            }
                            alt={`Food served by ${restaurant.name}`}
                            loading="lazy"
                            decoding="async"
                          />

                          {/* STATUS */}

                          {typeof isOpen === "boolean" && (
                            <span
                              className={`ddx-status ${
                                isOpen
                                  ? "ddx-status--open"
                                  : "ddx-status--closed"
                              }`}
                            >
                              {isOpen ? "Open" : "Closed"}
                            </span>
                          )}

                          {/* FAVOURITE */}

                          <button
                            type="button"
                            className={`ddx-favourite${
                              isFavourite ? " ddx-favourite--active" : ""
                            }`}
                            onClick={() => handleToggleFavourite(restaurantId)}
                            aria-label={
                              isFavourite
                                ? `Remove ${restaurant.name} from favourites`
                                : `Add ${restaurant.name} to favourites`
                            }
                            aria-pressed={isFavourite}
                          >
                            <Heart
                              size={20}
                              fill={isFavourite ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        {/* BODY */}

                        <div className="ddx-card-body">
                          <div className="ddx-card-topline">
                            <div>
                              <p className="ddx-card-cuisine">
                                {restaurant.cuisine ||
                                  restaurant.category ||
                                  "Restaurant"}
                              </p>

                              <h3>{restaurant.name}</h3>
                            </div>

                            {restaurant.rating != null && (
                              <span className="ddx-rating">
                                <Star
                                  size={15}
                                  fill="currentColor"
                                  aria-hidden="true"
                                />

                                {restaurant.rating}
                              </span>
                            )}
                          </div>

                          {/* DESCRIPTION */}

                          {restaurant.description && (
                            <p className="ddx-card-description">
                              {restaurant.description}
                            </p>
                          )}

                          {/* META */}

                          <div className="ddx-card-meta">
                            {typeof isOpen === "boolean" && (
                              <div
                                className={
                                  isOpen
                                    ? "ddx-open-state ddx-open-state--open"
                                    : "ddx-open-state ddx-open-state--closed"
                                }
                              >
                                <Clock3 size={16} aria-hidden="true" />

                                <strong>
                                  {isOpen ? "Open now" : "Closed now"}
                                </strong>

                                {operatingHours && (
                                  <span className="ddx-hours">
                                    {operatingHours}
                                  </span>
                                )}
                              </div>
                            )}

                            {address && (
                              <div className="ddx-location">
                                <MapPin size={16} aria-hidden="true" />

                                <p>{address}</p>
                              </div>
                            )}
                          </div>

                          {/* VIEW MENU */}

                          <NavLink
                            to={`/restaurants/${restaurant._id}`}
                            className="ddx-action"
                            aria-label={`View ${restaurant.name} menu`}
                          >
                            View menu
                            <ArrowRight size={17} aria-hidden="true" />
                          </NavLink>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </div>
        </section>
      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </>
  );
}

// ======================================
// EXPORT
// ======================================

export default HomePage;
