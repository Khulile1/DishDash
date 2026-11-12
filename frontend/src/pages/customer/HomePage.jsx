import { Children, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Search,
  Star,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getRestaurants } from "../../services/restaurantService";
import { getMenuItems } from "../../services/menuItemService";
import { getAddresses } from "../../services/addressService";
import { searchDishDash } from "../../services/searchService";
import {
  getFavouriteRestaurantIds,
  toggleFavouriteRestaurant,
} from "../../services/favouriteService";
import "../../styles/Homepage.css";

const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85";

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
    name: "Seafood",
    slug: "seafood",
    image:
      "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=85",
  },
  { name: "All restaurants", slug: "all", image: DEFAULT_RESTAURANT_IMAGE },
];

// Discovery banners: replace copy with real offers when promo data is available.
const promos = [
  {
    id: "fast-food",
    label: "QUICK CRAVINGS",
    title: "Big flavour. Easy choice.",
    text: "Explore your fast-food favourites.",
    cta: "Find fast food",
    to: "/restaurants?category=fast-food",
    image: categories[0].image,
  },
  {
    id: "grill",
    label: "MAKE A MEAL OF IT",
    title: "Make it a braai night.",
    text: "Discover local braai and grill menus.",
    cta: "Explore grills",
    to: "/restaurants?category=grill",
    image: categories[2].image,
  },
  {
    id: "menu",
    label: "SOMETHING DIFFERENT",
    title: "Your next favourite awaits.",
    text: "Browse dishes and discover a new craving.",
    cta: "Explore the menu",
    to: "/menu",
    image: categories[3].image,
  },
];

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

function idOf(value) {
  const id =
    value && typeof value === "object" ? (value._id ?? value.id) : value;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

function readArray(data, key) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.[key])
      ? data[key]
      : [];
}

function money(value) {
  if (value == null || value === "" || !Number.isFinite(Number(value)))
    return "";
  return currency.format(Number(value));
}

function matchesQuery(text, query) {
  const haystack = String(text || "").toLocaleLowerCase();
  return query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

function suggestionPath(item) {
  const id = idOf(item?.id);
  if (item?.type === "restaurant" && id)
    return `/restaurants/${encodeURIComponent(id)}`;
  if (item?.type === "menuItem" && id)
    return `/menu-items/${encodeURIComponent(id)}`;
  const restaurantId = idOf(item?.restaurant_id);
  return restaurantId ? `/restaurants/${encodeURIComponent(restaurantId)}` : "";
}

function getMenuRestaurantName(item, restaurantMap) {
  return (
    restaurantMap.get(idOf(item.restaurant_id))?.name ||
    (typeof item.restaurant_id === "object" ? item.restaurant_id?.name : "") ||
    "View dish"
  );
}

function isMenuItemAvailable(item) {
  return (
    item.available !== false &&
    (!item.track_stock || Number(item.stock_quantity || 0) > 0)
  );
}

function getTimeInMinutes(timeValue) {
  if (!timeValue) return null;
  const [hours, minutes] = String(timeValue).split(":").map(Number);
  return Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
    ? hours * 60 + minutes
    : null;
}

function getSouthAfricaCurrentMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return getTimeInMinutes(
    `${parts.find((part) => part.type === "hour")?.value}:${parts.find((part) => part.type === "minute")?.value}`,
  );
}

function getRestaurantOpenState(restaurant, current) {
  const opening = getTimeInMinutes(restaurant.opening_time);
  const closing = getTimeInMinutes(restaurant.closing_time);
  if (opening !== null && closing !== null && current !== null) {
    if (opening === closing) return true;
    return opening < closing
      ? current >= opening && current < closing
      : current >= opening || current < closing;
  }
  return typeof restaurant.is_open === "boolean" ? restaurant.is_open : null;
}

function formatOperatingHours(restaurant) {
  const { opening_time: opening, closing_time: closing } = restaurant;
  if (!opening || !closing) return "";
  return opening === closing ? "Open 24 hours" : `${opening} – ${closing}`;
}

function formatAddress(restaurant) {
  return (
    restaurant.formatted_address ||
    [
      restaurant.street_address,
      restaurant.suburb,
      restaurant.city,
      restaurant.province,
      restaurant.postal_code,
      restaurant.country,
    ]
      .filter(Boolean)
      .join(", ")
  );
}

function readFavourites() {
  const values = getFavouriteRestaurantIds();
  return Array.isArray(values) ? values.map(String) : [];
}

function HomeImage({ src, alt = "", ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) {
    return (
      <span
        className={`home-image-placeholder ${props.className || ""}`}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <UtensilsCrossed size={28} />
      </span>
    );
  }
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function HomeCarousel({
  id,
  title,
  description,
  to,
  linkLabel = "View all",
  kind,
  children,
  empty,
  resetKey = "",
}) {
  const trackRef = useRef(null);
  const count = Children.count(children);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
  }, [resetKey]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const next = {
        left: track.scrollLeft > 2,
        right: track.scrollLeft < track.scrollWidth - track.clientWidth - 2,
      };
      setEdges((old) =>
        old.left === next.left && old.right === next.right ? old : next,
      );
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(track);
    if (track.firstElementChild) observer?.observe(track.firstElementChild);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [count, resetKey]);

  function move(direction) {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth =
      track.firstElementChild?.getBoundingClientRect().width || 0;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 12;
    const amount = Math.max(
      cardWidth + gap,
      Math.floor(track.clientWidth / (cardWidth + gap)) * (cardWidth + gap),
    );
    track.scrollBy({
      left: direction * amount,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.currentTarget.scrollLeft =
        event.key === "Home" ? 0 : event.currentTarget.scrollWidth;
    }
  }

  return (
    <section
      className={`home-section home-section--${kind}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="home-container">
        <div className="home-section-heading">
          <div>
            <h2 id={`${id}-title`}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <div className="home-section-actions">
            {to && (
              <NavLink to={to} className="home-text-link">
                {linkLabel}
                <ChevronRight size={16} aria-hidden="true" />
              </NavLink>
            )}
            <div
              className="home-slider-controls"
              aria-label={`${title} controls`}
            >
              <button
                type="button"
                onClick={() => move(-1)}
                disabled={!count || !edges.left}
                aria-label={`Scroll ${title} left`}
                aria-controls={`${id}-track`}
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={!count || !edges.right}
                aria-label={`Scroll ${title} right`}
                aria-controls={`${id}-track`}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div
          id={`${id}-track`}
          ref={trackRef}
          className={`home-slider home-slider--${kind}`}
          role="region"
          aria-label={`${title}, scrollable cards`}
          tabIndex={count ? 0 : -1}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
        {!count && (
          <div className="home-restaurants-message" role="status">
            {empty || "Nothing available yet."}
          </div>
        )}
      </div>
    </section>
  );
}

function HomeDiscovery({
  restaurants,
  menuItems,
  restaurantsLoading,
  menuLoading,
  restaurantsError,
  menuError,
  foodTypes,
  restaurantMap,
}) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [submitted, setSubmitted] = useState("");
  const [remote, setRemote] = useState({
    query: "",
    items: [],
    loading: false,
    error: false,
  });
  const query = term.trim();

  const records = useMemo(
    () =>
      [
        ...restaurants.map((restaurant) => ({
          type: "restaurant",
          id: idOf(restaurant),
          label: restaurant.name || "Restaurant",
          image_url: restaurant.image_url,
          subtitle: restaurant.cuisine || restaurant.category || "Restaurant",
          searchText: [
            restaurant.name,
            restaurant.cuisine,
            restaurant.category,
            restaurant.description,
          ]
            .filter(Boolean)
            .join(" "),
        })),
        ...menuItems.map((item) => ({
          type: "menuItem",
          id: idOf(item),
          label: item.name || "Menu item",
          price: item.price,
          image_url: item.image_url,
          subtitle:
            getMenuRestaurantName(item, restaurantMap) ||
            item.category ||
            "Menu item",
          searchText: [
            item.name,
            item.category,
            item.description,
            getMenuRestaurantName(item, restaurantMap),
          ]
            .filter(Boolean)
            .join(" "),
        })),
      ].filter((item) => item.id && suggestionPath(item)),
    [restaurants, menuItems, restaurantMap],
  );
  const localSuggestions = useMemo(
    () =>
      query.length < 2
        ? []
        : records
            .filter((item) => matchesQuery(item.searchText, query))
            .slice(0, 8),
    [records, query],
  );
  const suggestions = useMemo(() => {
    const live =
      remote.query === query && !remote.loading && !remote.error
        ? remote.items
        : [];
    const seen = new Set();
    return [...live, ...localSuggestions]
      .filter((item) => {
        const path = suggestionPath(item);
        if (!path || seen.has(path)) return false;
        seen.add(path);
        return true;
      })
      .slice(0, 8);
  }, [remote, query, localSuggestions]);
  const showSuggestions = focused && query.length >= 2;
  const searching =
    showSuggestions && (remote.query !== query || remote.loading);
  const results = useMemo(
    () =>
      submitted
        ? records.filter((item) => matchesQuery(item.searchText, submitted))
        : [],
    [records, submitted],
  );

  useEffect(() => {
    if (!focused || query.length < 2) return undefined;
    let current = true;
    setRemote({ query, items: [], loading: true, error: false });
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchDishDash(query, 8);
        if (!current) return;
        const items = readArray(data, "suggestions")
          .filter(
            (item) =>
              item && suggestionPath(item) && String(item.label || "").trim(),
          )
          .slice(0, 8);
        setRemote({ query, items, loading: false, error: false });
        setActiveIndex(-1);
      } catch {
        if (current) {
          setRemote({ query, items: [], loading: false, error: true });
          setActiveIndex(-1);
        }
      }
    }, 300);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query, focused]);

  useEffect(() => {
    const dismiss = (event) => {
      if (!formRef.current?.contains(event.target)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  useEffect(() => {
    if (!showSuggestions || activeIndex < 0) return;
    formRef.current
      ?.querySelector(`#home-discovery-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex, showSuggestions]);

  useEffect(() => {
    if (!submitted) return undefined;
    const frame = window.requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [submitted]);

  const selectSuggestion = (item) => {
    const path = suggestionPath(item);
    if (!path) return;
    setFocused(false);
    setActiveIndex(-1);
    navigate(path);
  };
  const search = (value) => {
    const next = value.trim();
    if (!next) {
      setFocused(false);
      navigate("/menu");
      return;
    }
    setTerm(next);
    setSubmitted(next);
    setFocused(false);
    setActiveIndex(-1);
  };
  const clear = () => {
    setTerm("");
    setSubmitted("");
    setActiveIndex(-1);
    setRemote({ query: "", items: [], loading: false, error: false });
    inputRef.current?.focus();
  };
  const onKeyDown = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      query.length >= 2
    ) {
      event.preventDefault();
      setFocused(true);
      if (suggestions.length)
        setActiveIndex((index) =>
          event.key === "ArrowDown"
            ? (index + 1) % suggestions.length
            : index <= 0
              ? suggestions.length - 1
              : index - 1,
        );
    } else if (
      event.key === "Enter" &&
      showSuggestions &&
      suggestions[activeIndex]
    ) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setFocused(false);
      setActiveIndex(-1);
    }
  };
  const emptyMessage =
    restaurantsLoading || menuLoading
      ? "Loading restaurants and dishes…"
      : restaurantsError && menuError
        ? "Search data could not load. Please try again later."
        : "No matches. Try a restaurant name, dish or food category.";

  return (
    <>
      <section
        className="home-discovery"
        aria-labelledby="home-discovery-title"
      >
        <div className="home-container">
          <div className="home-discovery__heading">
            <span className="home-eyebrow">DISCOVER DISH DASH</span>
            <h1 id="home-discovery-title">What are you craving today?</h1>
            <p>Add a delivery address and find your next favourite meal.</p>
          </div>
          <form
            ref={formRef}
            className="home-search"
            role="search"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setFocused(false);
                setActiveIndex(-1);
              }
            }}
            onSubmit={(event) => {
              event.preventDefault();
              search(term);
            }}
          >
            <NavLink to="/addresses" className="home-search__address-link">
              <MapPin size={18} aria-hidden="true" />
              <span>Add delivery address</span>
              <ChevronRight size={16} aria-hidden="true" />
            </NavLink>
            <div className="home-search__input-wrap">
              <div className="home-search__field">
                <Search size={19} aria-hidden="true" />
                <input
                  ref={inputRef}
                  id="home-discovery-input"
                  type="text"
                  role="combobox"
                  aria-label="Search restaurants or food"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                  aria-controls={
                    showSuggestions ? "home-discovery-suggestions" : undefined
                  }
                  aria-activedescendant={
                    showSuggestions && suggestions[activeIndex]
                      ? `home-discovery-option-${activeIndex}`
                      : undefined
                  }
                  placeholder="Search restaurants or food…"
                  autoComplete="off"
                  value={term}
                  onFocus={() => setFocused(true)}
                  onKeyDown={onKeyDown}
                  onChange={(event) => {
                    setTerm(event.target.value);
                    setFocused(true);
                    setActiveIndex(-1);
                  }}
                />
                {term && (
                  <button
                    type="button"
                    className="home-search__clear"
                    aria-label="Clear search"
                    onClick={clear}
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              {showSuggestions && (
                <div className="home-suggestions-panel">
                  {searching && (
                    <p className="home-search-message" role="status">
                      Searching…
                    </p>
                  )}
                  {remote.query === query && remote.error && (
                    <p className="home-search-message" role="status">
                      Live search is unavailable. Showing matches from loaded
                      menus.
                    </p>
                  )}
                  <ul
                    id="home-discovery-suggestions"
                    className="home-suggestions"
                    role="listbox"
                    aria-label="Search suggestions"
                    aria-busy={searching}
                  >
                    {suggestions.map((item, index) => (
                      <li
                        key={`${item.type}-${item.id || item.restaurant_id}`}
                        id={`home-discovery-option-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        className={`home-suggestion${index === activeIndex ? " home-suggestion--active" : ""}`}
                        onPointerDown={(event) => event.preventDefault()}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => selectSuggestion(item)}
                      >
                        <HomeImage
                          src={item.image_url}
                          alt=""
                          className="home-suggestion__image"
                        />
                        <span className="home-suggestion__text">
                          <strong>{item.label}</strong>
                          <small>
                            {item.subtitle ||
                              (item.type === "restaurant"
                                ? "Restaurant"
                                : "Menu item")}
                          </small>
                        </span>
                        <span className="home-suggestion__meta">
                          {item.type === "menuItem" && item.price != null ? (
                            money(item.price)
                          ) : (
                            <ChevronRight size={16} aria-hidden="true" />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {!searching && !suggestions.length && (
                    <p className="home-search-message">
                      No suggestions found. Try another search.
                    </p>
                  )}
                </div>
              )}
            </div>
            <button type="submit" className="home-search__button">
              Find food <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
          {foodTypes.length > 0 && (
            <div className="home-quick-searches">
              <span>Try:</span>
              {foodTypes.slice(0, 4).map((type) => (
                <button
                  key={type.name}
                  type="button"
                  className="home-quick-search-link"
                  onClick={() => search(type.name)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {submitted && (
        <div ref={resultsRef} className="home-search-results-region">
          <HomeCarousel
            id="home-search-results"
            title={`Results for “${submitted}”`}
            description={`${results.length} matching restaurant or menu item results`}
            kind="results"
            empty={emptyMessage}
            resetKey={submitted}
          >
            {results.map((item) => (
              <NavLink
                key={`${item.type}-${item.id}`}
                to={suggestionPath(item)}
                className="home-result-card"
              >
                <HomeImage src={item.image_url} alt="" />
                <span className="home-result-card__body">
                  <small>
                    {item.type === "restaurant" ? "Restaurant" : "Menu item"}
                  </small>
                  <strong>{item.label}</strong>
                  <span>{item.subtitle}</span>
                  {item.type === "menuItem" && item.price != null && (
                    <b>{money(item.price)}</b>
                  )}
                </span>
                <ChevronRight size={17} aria-hidden="true" />
              </NavLink>
            ))}
          </HomeCarousel>
          <div className="home-container home-search-summary">
            {(restaurantsError || menuError) && (
              <p>
                Some results could not load. Other sections may still be
                available.
              </p>
            )}
            <button
              type="button"
              className="home-quick-search-link"
              onClick={clear}
            >
              Clear results <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function HomePage() {
  const [addressStatus, setAddressStatus] = useState("loading");
  const [addressRetry, setAddressRetry] = useState(0);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [dataRetry, setDataRetry] = useState(0);
  const [activeFood, setActiveFood] = useState("");
  const [currentMinutes, setCurrentMinutes] = useState(
    getSouthAfricaCurrentMinutes,
  );
  const [favouriteRestaurantIds, setFavouriteRestaurantIds] =
    useState(readFavourites);
  const [favouriteError, setFavouriteError] = useState("");

  // Match Navbar: default address, first saved address, or no address.
  useEffect(() => {
    let active = true;
    let request = 0;
    async function loadAddress() {
      const version = ++request;
      setAddressStatus("loading");
      try {
        const data = await getAddresses();
        if (!Array.isArray(data) && !Array.isArray(data?.addresses))
          throw new Error("Invalid address response");
        const addresses = readArray(data, "addresses");
        const selected =
          addresses.find((address) => address.is_default === true) ||
          addresses[0] ||
          null;
        if (active && version === request)
          setAddressStatus(selected ? "saved" : "missing");
      } catch {
        if (active && version === request) setAddressStatus("error");
      }
    }
    loadAddress();
    window.addEventListener("addressChanged", loadAddress);
    return () => {
      active = false;
      window.removeEventListener("addressChanged", loadAddress);
    };
  }, [addressRetry]);

  // Independent requests: a menu failure does not hide restaurants.
  useEffect(() => {
    let active = true;
    async function load(fetcher, key, setData, setLoading, setError, message) {
      setLoading(true);
      setError("");
      try {
        const data = await fetcher();
        if (active)
          setData(readArray(data, key).filter((item) => item && idOf(item)));
      } catch {
        if (active) {
          setData([]);
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load(
      getRestaurants,
      "restaurants",
      setRestaurants,
      setRestaurantsLoading,
      setRestaurantsError,
      "Could not load restaurants.",
    );
    load(
      getMenuItems,
      "menuItems",
      setMenuItems,
      setMenuLoading,
      setMenuError,
      "Could not load the menu.",
    );
    return () => {
      active = false;
    };
  }, [dataRetry]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentMinutes(getSouthAfricaCurrentMinutes()),
      60000,
    );
    const sync = () => setFavouriteRestaurantIds(readFavourites());
    window.addEventListener("favouritesChanged", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("favouritesChanged", sync);
    };
  }, []);

  const restaurantMap = useMemo(
    () =>
      new Map(restaurants.map((restaurant) => [idOf(restaurant), restaurant])),
    [restaurants],
  );
  const availableItems = useMemo(
    () => menuItems.filter(isMenuItemAvailable),
    [menuItems],
  );
  const foodTypes = useMemo(() => {
    const types = new Map();
    availableItems.forEach((item) => {
      const name = String(item.category || "Other").trim() || "Other";
      const key = name.toLowerCase();
      const type = types.get(key) || { name, key, count: 0, image: "" };
      type.count += 1;
      if (!type.image && item.image_url) type.image = item.image_url;
      types.set(key, type);
    });
    return [...types.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }, [availableItems]);
  const selectedFood = foodTypes.some((type) => type.key === activeFood)
    ? activeFood
    : "";
  const dishes = useMemo(
    () =>
      availableItems.filter(
        (item) =>
          !selectedFood ||
          (String(item.category || "Other").trim() || "Other").toLowerCase() ===
            selectedFood,
      ),
    [availableItems, selectedFood],
  );
  const selectedFoodName = foodTypes.find(
    (type) => type.key === selectedFood,
  )?.name;

  function handleToggleFavourite(restaurantId) {
    try {
      const updated = toggleFavouriteRestaurant(restaurantId);
      setFavouriteRestaurantIds(
        Array.isArray(updated) ? updated.map(String) : [],
      );
      setFavouriteError("");
    } catch {
      setFavouriteError("Could not update favourites. Please try again.");
    }
  }

  const menuMessage = menuLoading
    ? "Loading food…"
    : menuError || "No available menu items yet.";

  return (
    <>
      <Navbar />
      <main className="home-page">
        {addressStatus !== "missing" && (
          <h1 className="home-sr-only">
            Dish Dash — discover restaurants and food
          </h1>
        )}
        {addressStatus === "loading" && (
          <p className="home-address-status home-container" role="status">
            Checking your delivery address…
          </p>
        )}
        {addressStatus === "error" && (
          <div className="home-notice home-container" role="status">
            <span>We couldn’t check your saved address.</span>
            <button
              type="button"
              onClick={() => setAddressRetry((value) => value + 1)}
            >
              Try again
            </button>
            <NavLink to="/addresses">Manage addresses</NavLink>
          </div>
        )}
        {addressStatus === "missing" && (
          <HomeDiscovery
            restaurants={restaurants}
            menuItems={availableItems}
            restaurantMap={restaurantMap}
            foodTypes={foodTypes}
            restaurantsLoading={restaurantsLoading}
            menuLoading={menuLoading}
            restaurantsError={restaurantsError}
            menuError={menuError}
          />
        )}

        <HomeCarousel
          id="home-promos"
          kind="promos"
          title="Promos & inspiration"
          description="Swipe through your next meal ideas."
        >
          {promos.map((promo) => (
            <NavLink key={promo.id} to={promo.to} className="home-promo-card">
              <div className="home-promo-card__content">
                <span>{promo.label}</span>
                <h3>{promo.title}</h3>
                <p>{promo.text}</p>
                <strong>
                  {promo.cta}
                  <ArrowRight size={16} aria-hidden="true" />
                </strong>
              </div>
              <div className="home-promo-card__image">
                <HomeImage src={promo.image} />
              </div>
            </NavLink>
          ))}
        </HomeCarousel>

        <HomeCarousel
          id="home-categories"
          kind="categories"
          title="Restaurant types"
          description="Pick the kind of restaurant you’re in the mood for."
          to="/restaurants"
        >
          {categories.map((category) => (
            <NavLink
              key={category.slug}
              to={`/restaurants?category=${encodeURIComponent(category.slug)}`}
              className="home-category-card"
            >
              <HomeImage src={category.image} />
              <span className="home-category-card__overlay" />
              <span className="home-category-card__content">
                <strong>{category.name}</strong>
                <small>
                  Explore
                  <ChevronRight size={14} aria-hidden="true" />
                </small>
              </span>
            </NavLink>
          ))}
        </HomeCarousel>

        <HomeCarousel
          id="home-food-types"
          kind="foods"
          title="Types of food"
          description="Choose a food type to update the suggestions below."
          to="/menu"
          empty={menuMessage}
        >
          {foodTypes.map((type) => (
            <button
              key={type.key}
              type="button"
              className={`home-food-card${selectedFood === type.key ? " home-food-card--active" : ""}`}
              aria-pressed={selectedFood === type.key}
              aria-controls="home-dishes-track"
              onClick={() =>
                setActiveFood((current) =>
                  current === type.key ? "" : type.key,
                )
              }
            >
              <div className="home-food-card__media">
                <HomeImage src={type.image} />
              </div>
              <span className="home-food-card__content">
                <strong>{type.name}</strong>
                <small>
                  {type.count} {type.count === 1 ? "dish" : "dishes"}
                </small>
              </span>
            </button>
          ))}
        </HomeCarousel>

        {selectedFood && (
          <div className="home-filter-bar home-container" role="status">
            <span>Showing {selectedFoodName}</span>
            <button type="button" onClick={() => setActiveFood("")}>
              Show all food
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        <HomeCarousel
          id="home-dishes"
          kind="dishes"
          title={
            selectedFoodName
              ? `${selectedFoodName} to try`
              : "Something delicious to try"
          }
          description="Explore available dishes from restaurant menus."
          to={
            selectedFoodName
              ? `/menu?category=${encodeURIComponent(selectedFoodName)}`
              : "/menu"
          }
          empty={menuMessage}
          resetKey={selectedFood}
        >
          {dishes.map((item) => (
            <NavLink
              key={idOf(item)}
              to={`/menu-items/${encodeURIComponent(idOf(item))}`}
              className="home-dish-card"
            >
              <div className="home-dish-card__media">
                <HomeImage src={item.image_url} />
                <span className="home-dish-card__badge">
                  {String(item.category || "Other")}
                </span>
              </div>
              <div className="home-dish-card__body">
                <div className="home-dish-card__top">
                  <h3>{item.name}</h3>
                  {money(item.price) && <strong>{money(item.price)}</strong>}
                </div>
                {item.description && <p>{item.description}</p>}
                <div className="home-dish-card__footer">
                  <span>
                    <Store size={14} aria-hidden="true" />
                    {getMenuRestaurantName(item, restaurantMap)}
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </div>
              </div>
            </NavLink>
          ))}
        </HomeCarousel>

        {favouriteError && (
          <p className="home-notice home-container" role="alert">
            {favouriteError}
          </p>
        )}
        <HomeCarousel
          id="home-restaurants"
          kind="restaurants"
          title="Restaurants to explore"
          description="Find a favourite, check opening hours and view the menu."
          to="/restaurants"
          empty={
            restaurantsLoading
              ? "Loading restaurants…"
              : restaurantsError || "No restaurants available yet."
          }
        >
          {restaurants.map((restaurant) => {
            const id = idOf(restaurant);
            const isFavourite = favouriteRestaurantIds.includes(id);
            const isOpen = getRestaurantOpenState(restaurant, currentMinutes);
            const hours = formatOperatingHours(restaurant);
            const address = formatAddress(restaurant);
            return (
              <article key={id} className="ddx-card">
                <div className="ddx-card-media">
                  <HomeImage
                    src={restaurant.image_url || DEFAULT_RESTAURANT_IMAGE}
                    alt={restaurant.name}
                  />
                  {typeof isOpen === "boolean" && (
                    <span
                      className={`ddx-status ${isOpen ? "ddx-status--open" : "ddx-status--closed"}`}
                    >
                      {isOpen ? "Open" : "Closed"}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`ddx-favourite${isFavourite ? " ddx-favourite--active" : ""}`}
                    onClick={() => handleToggleFavourite(id)}
                    aria-pressed={isFavourite}
                    aria-label={`${isFavourite ? "Remove" : "Add"} ${restaurant.name} ${isFavourite ? "from" : "to"} favourites`}
                  >
                    <Heart
                      size={18}
                      fill={isFavourite ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
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
                          size={13}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                        {restaurant.rating}
                      </span>
                    )}
                  </div>
                  {restaurant.description && (
                    <p className="ddx-card-description">
                      {restaurant.description}
                    </p>
                  )}
                  {hours && (
                    <p className="ddx-hours">
                      <Clock3 size={14} aria-hidden="true" />
                      {hours}
                    </p>
                  )}
                  {address && (
                    <p className="ddx-location" title={address}>
                      <MapPin size={14} aria-hidden="true" />
                      <span>{address}</span>
                    </p>
                  )}
                  <NavLink
                    to={`/restaurants/${encodeURIComponent(id)}`}
                    className="ddx-action"
                    aria-label={`View ${restaurant.name} menu`}
                  >
                    View menu
                    <ArrowRight size={16} aria-hidden="true" />
                  </NavLink>
                </div>
              </article>
            );
          })}
        </HomeCarousel>

        {(menuError || restaurantsError) && (
          <div className="home-notice home-container">
            <span>Some food or restaurant information couldn’t load.</span>
            <button
              type="button"
              onClick={() => setDataRetry((value) => value + 1)}
              disabled={menuLoading || restaurantsLoading}
            >
              Retry loading
            </button>
          </div>
        )}
        <section className="home-outro">
          <div className="home-container home-outro__inner">
            <div>
              <h2>Still deciding?</h2>
              <p>Explore the full menu and find your next favourite.</p>
            </div>
            <NavLink to="/menu" className="home-outro__button">
              Browse all food
              <ArrowRight size={17} aria-hidden="true" />
            </NavLink>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default HomePage;
