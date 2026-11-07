// ======================================
// IMPORTS
// ======================================

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Phone,
  Plus,
  Save,
  Store,
  Trash2,
} from "lucide-react";

import {
  createRestaurant,
  deleteRestaurant,
  getMyRestaurants,
  updateRestaurant,
} from "../../services/restaurantService";

import RestaurantNavbar from "./RestaurantNavbar";

import LocationPicker from "../../components/maps/LocationPicker";

import "../../styles/RestaurantProfilePage.css";

// ======================================
// EMPTY RESTAURANT LOCATION
// ======================================

const EMPTY_RESTAURANT_LOCATION = {
  street_address: "",
  suburb: "",
  city: "",
  province: "",
  postal_code: "",
  country: "South Africa",
  latitude: "",
  longitude: "",
  formatted_address: "",
  geoapify_place_id: "",
};

// ======================================
// RESTAURANT CATEGORIES
// ======================================

const RESTAURANT_CATEGORIES = [
  {
    label: "Fast Food",
    value: "fast-food",
  },

  {
    label: "African",
    value: "african",
  },

  {
    label: "Braai & Grill",
    value: "grill",
  },

  {
    label: "Italian",
    value: "italian",
  },

  {
    label: "Seafood",
    value: "seafood",
  },
];

// ======================================
// CATEGORY LABEL
// ======================================

const getRestaurantCategoryLabel = (categoryValue) => {
  const match = RESTAURANT_CATEGORIES.find(
    (category) => category.value === categoryValue,
  );

  return match?.label || "";
};

// ======================================
// RESTAURANT PROFILE PAGE
// ======================================

function RestaurantProfilePage() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // RESTAURANTS
  // ======================================

  const [restaurants, setRestaurants] = useState([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  const [isAddingNew, setIsAddingNew] = useState(false);

  // ======================================
  // FORM STATE
  // ======================================

  const [name, setName] = useState("");

  const [category, setCategory] = useState("");

  const [locationData, setLocationData] = useState({
    ...EMPTY_RESTAURANT_LOCATION,
  });

  const [locationPickerKey, setLocationPickerKey] = useState(0);

  const [phone, setPhone] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  // ======================================
  // OPERATING HOURS
  // ======================================

  const [openingTime, setOpeningTime] = useState("08:00");

  const [closingTime, setClosingTime] = useState("20:00");

  const [, setStatusTick] = useState(0);

  // ======================================
  // PAGE STATE
  // ======================================

  const [loading, setLoading] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // SELECTED RESTAURANT
  // ======================================

  const selectedRestaurant =
    restaurants.find(
      (restaurant) => String(restaurant._id) === String(selectedRestaurantId),
    ) || null;

  // ======================================
  // TIME HELPERS
  // ======================================

  const getTimeInMinutes = (timeValue) => {
    const [hours, minutes] = String(timeValue || "")
      .split(":")
      .map(Number);

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
  // OPEN / CLOSED
  // ======================================

  const isRestaurantOpenNow = (openTime, closeTime) => {
    const openMinutes = getTimeInMinutes(openTime);

    const closeMinutes = getTimeInMinutes(closeTime);

    const currentMinutes = getSouthAfricaCurrentMinutes();

    if (
      openMinutes === null ||
      closeMinutes === null ||
      currentMinutes === null
    ) {
      return false;
    }

    // Same opening and closing = 24 hours
    if (openMinutes === closeMinutes) {
      return true;
    }

    // Same-day opening
    if (openMinutes < closeMinutes) {
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }

    // Overnight opening
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  };

  const previewIsOpen = isRestaurantOpenNow(openingTime, closingTime);

  // ======================================
  // REFRESH OPEN/CLOSED
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
  // FORMAT PHONE
  // ======================================

  const formatPhoneNumber = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  // ======================================
  // PHONE INPUT
  // ======================================

  const handlePhoneChange = (event) => {
    setPhone(formatPhoneNumber(event.target.value));
  };

  // ======================================
  // LOCATION SELECTED
  // ======================================

  const handleLocationSelect = (location) => {
    setError("");

    setSuccess("");

    const latitude = Number(location.latitude);

    const longitude = Number(location.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("The selected location does not contain valid coordinates.");

      return;
    }

    setLocationData({
      street_address: location.addressLine1 || location.formatted || "",

      suburb: location.suburb || "",

      city: location.city || "",

      province: location.province || "",

      postal_code: location.postcode || "",

      country: location.country || "South Africa",

      latitude,

      longitude,

      formatted_address: location.formatted || "",

      geoapify_place_id: location.placeId || "",
    });
  };

  // ======================================
  // CLEAR FORM
  // ======================================

  const clearForm = () => {
    setName("");

    setCategory("");

    setLocationData({
      ...EMPTY_RESTAURANT_LOCATION,
    });

    setLocationPickerKey((current) => current + 1);

    setPhone("");

    setImageUrl("");

    setOpeningTime("08:00");

    setClosingTime("20:00");
  };

  // ======================================
  // POPULATE FORM
  // ======================================

  const populateForm = (restaurant) => {
    if (!restaurant) {
      clearForm();

      return;
    }

    setName(restaurant.name || "");

    setCategory(restaurant.category || "");

    setLocationData({
      street_address: restaurant.street_address || "",

      suburb: restaurant.suburb || "",

      city: restaurant.city || "",

      province: restaurant.province || "",

      postal_code: restaurant.postal_code || "",

      country: restaurant.country || "South Africa",

      latitude: restaurant.latitude ?? "",

      longitude: restaurant.longitude ?? "",

      formatted_address:
        restaurant.formatted_address ||
        restaurant.street_address ||
        restaurant.address ||
        "",

      geoapify_place_id: restaurant.geoapify_place_id || "",
    });

    setLocationPickerKey((current) => current + 1);

    setPhone(formatPhoneNumber(restaurant.phone || ""));

    setImageUrl(restaurant.image_url || "");

    setOpeningTime(restaurant.opening_time || "08:00");

    setClosingTime(restaurant.closing_time || "20:00");
  };

  // ======================================
  // LOAD OWNER RESTAURANTS
  // ======================================

  const loadRestaurantProfiles = async (restaurantIdToSelect = null) => {
    try {
      setLoadingProfile(true);

      setError("");

      const data = await getMyRestaurants();

      const restaurantList = Array.isArray(data)
        ? data
        : Array.isArray(data?.restaurants)
          ? data.restaurants
          : [];

      setRestaurants(restaurantList);

      // ======================================
      // NO RESTAURANTS
      // ======================================

      if (restaurantList.length === 0) {
        setSelectedRestaurantId("");

        setIsAddingNew(true);

        clearForm();

        return;
      }

      // ======================================
      // CHOOSE RESTAURANT
      // ======================================

      const restaurantToSelect =
        restaurantList.find(
          (restaurant) =>
            String(restaurant._id) === String(restaurantIdToSelect),
        ) ||
        restaurantList.find(
          (restaurant) =>
            String(restaurant._id) === String(selectedRestaurantId),
        ) ||
        restaurantList[0];

      setSelectedRestaurantId(restaurantToSelect._id);

      setIsAddingNew(false);

      populateForm(restaurantToSelect);
    } catch (error) {
      console.error("Load restaurant profiles error:", error);

      setError(
        error.response?.data?.message || "Failed to load restaurant profiles.",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // ======================================
  // LOAD PROFILE
  // ======================================

  useEffect(() => {
    loadRestaurantProfiles();
  }, []);

  // ======================================
  // SELECT RESTAURANT
  // ======================================

  const handleRestaurantSelect = (restaurantId) => {
    const selected = restaurants.find(
      (restaurant) => String(restaurant._id) === String(restaurantId),
    );

    if (!selected) {
      return;
    }

    setSelectedRestaurantId(selected._id);

    setIsAddingNew(false);

    populateForm(selected);

    setError("");

    setSuccess("");
  };

  // ======================================
  // ADD ANOTHER RESTAURANT
  // ======================================

  const handleAddAnotherRestaurant = () => {
    setSelectedRestaurantId("");

    setIsAddingNew(true);

    clearForm();

    setError("");

    setSuccess("");
  };

  // ======================================
  // CANCEL ADD
  // ======================================

  const handleCancelNewRestaurant = () => {
    if (restaurants.length === 0) {
      return;
    }

    const restaurant = restaurants[0];

    setSelectedRestaurantId(restaurant._id);

    setIsAddingNew(false);

    populateForm(restaurant);

    setError("");

    setSuccess("");
  };

  // ======================================
  // DELETE RESTAURANT
  // ======================================

  const handleDeleteRestaurant = async () => {
    if (isAddingNew || !selectedRestaurant?._id) {
      return;
    }

    const restaurantId = selectedRestaurant._id;

    const restaurantName = selectedRestaurant.name || "this restaurant";

    // ======================================
    // DELETE WARNING
    // ======================================

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${restaurantName}"?\n\n` +
        `This will permanently delete the restaurant AND ALL food/menu items belonging to it.\n\n` +
        `This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      setError("");

      setSuccess("");

      // ======================================
      // BACKEND WILL DELETE:
      //
      // 1. ALL MENU ITEMS
      // 2. RESTAURANT
      // ======================================

      const data = await deleteRestaurant(restaurantId);

      console.log("Restaurant deleted:", data);

      // ======================================
      // REMOVE FROM LOCAL LIST
      // ======================================

      const remainingRestaurants = restaurants.filter(
        (restaurant) => String(restaurant._id) !== String(restaurantId),
      );

      setRestaurants(remainingRestaurants);

      // ======================================
      // ANOTHER RESTAURANT EXISTS
      // ======================================

      if (remainingRestaurants.length > 0) {
        const nextRestaurant = remainingRestaurants[0];

        setSelectedRestaurantId(nextRestaurant._id);

        setIsAddingNew(false);

        populateForm(nextRestaurant);
      }

      // ======================================
      // NO RESTAURANTS LEFT
      // ======================================
      else {
        setSelectedRestaurantId("");

        setIsAddingNew(true);

        clearForm();
      }

      // ======================================
      // SUCCESS
      // ======================================

      setSuccess(
        data?.message ||
          `${restaurantName} and all of its menu items were deleted successfully.`,
      );
    } catch (error) {
      console.error("Delete restaurant error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to delete the restaurant and its menu items.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ======================================
  // CREATE OR UPDATE
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    // ======================================
    // NAME
    // ======================================

    if (!name.trim()) {
      setError("Restaurant name is required.");

      return;
    }

    // ======================================
    // RESTAURANT CATEGORY
    // ======================================

    if (!category) {
      setError("Please choose the type of restaurant.");

      return;
    }

    const categoryIsValid = RESTAURANT_CATEGORIES.some(
      (restaurantCategory) => restaurantCategory.value === category,
    );

    if (!categoryIsValid) {
      setError("Please choose a valid restaurant category.");

      return;
    }

    // ======================================
    // LOCATION
    // ======================================

    const latitude = Number(locationData.latitude);

    const longitude = Number(locationData.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(
        "Search for the restaurant address and select it from the map suggestions before saving.",
      );

      return;
    }

    if (
      !locationData.street_address ||
      !locationData.suburb ||
      !locationData.city ||
      !locationData.province
    ) {
      setError(
        "The selected location is missing some address information. Search for a more specific street address.",
      );

      return;
    }

    // ======================================
    // PHONE
    // ======================================

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length !== 10) {
      setError("Phone number must contain exactly 10 digits.");

      return;
    }

    // ======================================
    // HOURS
    // ======================================

    if (!openingTime || !closingTime) {
      setError("Opening and closing times are required.");

      return;
    }

    // ======================================
    // IMAGE
    // ======================================

    if (!imageUrl.trim()) {
      setError("Restaurant image URL is required.");

      return;
    }

    // ======================================
    // RESTAURANT DATA
    // ======================================

    const restaurantData = {
      name: name.trim(),

      category,

      street_address: locationData.street_address,

      suburb: locationData.suburb,

      city: locationData.city,

      province: locationData.province,

      postal_code: locationData.postal_code,

      country: locationData.country,

      latitude,

      longitude,

      formatted_address: locationData.formatted_address,

      geoapify_place_id: locationData.geoapify_place_id || null,

      phone: phoneDigits,

      opening_time: openingTime,

      closing_time: closingTime,

      image_url: imageUrl.trim(),
    };

    try {
      setLoading(true);

      // ======================================
      // UPDATE
      // ======================================

      if (!isAddingNew && selectedRestaurant?._id) {
        const data = await updateRestaurant(
          selectedRestaurant._id,
          restaurantData,
        );

        console.log("Restaurant updated:", data);

        setSuccess("Restaurant profile updated successfully.");

        await loadRestaurantProfiles(selectedRestaurant._id);

        return;
      }

      // ======================================
      // CREATE
      // ======================================

      const data = await createRestaurant(restaurantData);

      console.log("Restaurant created:", data);

      const createdRestaurant = data?.restaurant || data;

      const createdRestaurantId = createdRestaurant?._id;

      setSuccess("New restaurant created successfully.");

      await loadRestaurantProfiles(createdRestaurantId);
    } catch (error) {
      console.error("Restaurant profile error:", error);

      setError(
        error.response?.data?.message || "Failed to save restaurant profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-profile-layout">
      <RestaurantNavbar />

      <main className="restaurant-profile-page">
        <div className="restaurant-profile-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="restaurant-profile-back"
            onClick={() => navigate("/restaurant")}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="restaurant-profile-header">
            <div>
              <span className="restaurant-profile-eyebrow">
                <Store size={16} />
                Restaurant Details
              </span>

              <h1>Your Restaurants</h1>

              <p>
                Create and manage multiple restaurants from your Dish Dash
                restaurant account.
              </p>
            </div>

            {!loadingProfile && (
              <div className="restaurant-profile-count">
                <strong>{restaurants.length}</strong>

                <span>
                  {restaurants.length === 1 ? "Restaurant" : "Restaurants"}
                </span>
              </div>
            )}
          </section>

          {/* ======================================
              LOADING
          ====================================== */}

          {loadingProfile ? (
            <section className="restaurant-profile-loading">
              <div className="restaurant-profile-loader" />

              <h2>Loading restaurants</h2>

              <p>Getting your restaurant details.</p>
            </section>
          ) : (
            <>
              {/* ======================================
                  MESSAGES
              ====================================== */}

              {error && (
                <div className="restaurant-profile-message restaurant-profile-message--error">
                  <AlertCircle size={18} />

                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="restaurant-profile-message restaurant-profile-message--success">
                  <CheckCircle2 size={18} />

                  <span>{success}</span>
                </div>
              )}

              {/* ======================================
                  MANAGER
              ====================================== */}

              <section className="restaurant-profile-manager">
                <div className="restaurant-profile-manager-heading">
                  <div>
                    <h2>Manage Restaurants</h2>

                    <p>
                      Select an existing restaurant to edit or add another one.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="restaurant-profile-add-restaurant"
                    onClick={handleAddAnotherRestaurant}
                    disabled={loading || deleting}
                  >
                    <Plus size={17} />
                    Add Another Restaurant
                  </button>
                </div>

                {/* ======================================
                    RESTAURANT SELECTOR
                ====================================== */}

                {restaurants.length > 0 && (
                  <div className="restaurant-profile-selector">
                    <label htmlFor="restaurant-profile-selector">
                      Your Restaurants
                    </label>

                    <select
                      id="restaurant-profile-selector"
                      value={isAddingNew ? "" : selectedRestaurantId}
                      disabled={loading || deleting}
                      onChange={(event) => {
                        if (event.target.value) {
                          handleRestaurantSelect(event.target.value);
                        }
                      }}
                    >
                      {isAddingNew && (
                        <option value="">Adding a new restaurant</option>
                      )}

                      {restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}

                          {restaurant.category
                            ? ` — ${getRestaurantCategoryLabel(
                                restaurant.category,
                              )}`
                            : " — Choose category"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ======================================
                    ADD MODE
                ====================================== */}

                {isAddingNew && (
                  <div className="restaurant-profile-add-mode">
                    <div>
                      <Plus size={18} />

                      <span>You are adding a new restaurant.</span>
                    </div>

                    {restaurants.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCancelNewRestaurant}
                        disabled={loading || deleting}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* ======================================
                  GRID
              ====================================== */}

              <div className="restaurant-profile-grid">
                {/* ======================================
                    FORM
                ====================================== */}

                <section className="restaurant-profile-form-card">
                  <div className="restaurant-profile-section-heading">
                    <div className="restaurant-profile-section-icon">
                      {isAddingNew ? <Plus size={22} /> : <Store size={22} />}
                    </div>

                    <div>
                      <h2>
                        {isAddingNew
                          ? "Add New Restaurant"
                          : "Restaurant Information"}
                      </h2>

                      <p>
                        {isAddingNew
                          ? "Enter the details for your additional restaurant."
                          : `Editing ${
                              selectedRestaurant?.name || "restaurant"
                            }.`}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="restaurant-profile-form"
                  >
                    {/* ======================================
                        NAME
                    ====================================== */}

                    <div className="restaurant-profile-field restaurant-profile-field--full">
                      <label htmlFor="restaurant-profile-name">
                        Restaurant Name
                      </label>

                      <div className="restaurant-profile-input-wrapper">
                        <Store size={18} />

                        <input
                          id="restaurant-profile-name"
                          type="text"
                          placeholder="Enter restaurant name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* ======================================
                        RESTAURANT TYPE
                    ====================================== */}

                    <div className="restaurant-profile-field restaurant-profile-field--full">
                      <label htmlFor="restaurant-profile-category">
                        Type of Restaurant
                      </label>

                      <p className="restaurant-profile-field-help">
                        Choose the category customers will use to find this
                        restaurant.
                      </p>

                      <select
                        id="restaurant-profile-category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        required
                      >
                        <option value="">Select restaurant type</option>

                        {RESTAURANT_CATEGORIES.map((restaurantCategory) => (
                          <option
                            key={restaurantCategory.value}
                            value={restaurantCategory.value}
                          >
                            {restaurantCategory.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ======================================
                        ADDRESS
                    ====================================== */}

                    <div className="restaurant-profile-field restaurant-profile-field--full">
                      <label>Restaurant Address</label>

                      <p className="restaurant-profile-field-help">
                        Search for the restaurant address and choose the correct
                        location from the map suggestions.
                      </p>

                      <LocationPicker
                        key={locationPickerKey}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>

                    {/* ======================================
                        LOCATION DETAILS
                    ====================================== */}

                    {locationData.latitude !== "" && (
                      <>
                        <div className="restaurant-profile-field restaurant-profile-field--full">
                          <label htmlFor="restaurant-profile-street">
                            Street Address
                          </label>

                          <div className="restaurant-profile-input-wrapper">
                            <MapPin size={18} />

                            <input
                              id="restaurant-profile-street"
                              type="text"
                              value={locationData.street_address}
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="restaurant-profile-field">
                          <label htmlFor="restaurant-profile-suburb">
                            Suburb
                          </label>

                          <input
                            id="restaurant-profile-suburb"
                            type="text"
                            value={locationData.suburb}
                            readOnly
                          />
                        </div>

                        <div className="restaurant-profile-field">
                          <label htmlFor="restaurant-profile-city">City</label>

                          <input
                            id="restaurant-profile-city"
                            type="text"
                            value={locationData.city}
                            readOnly
                          />
                        </div>

                        <div className="restaurant-profile-field">
                          <label htmlFor="restaurant-profile-province">
                            Province
                          </label>

                          <input
                            id="restaurant-profile-province"
                            type="text"
                            value={locationData.province}
                            readOnly
                          />
                        </div>

                        <div className="restaurant-profile-field">
                          <label htmlFor="restaurant-profile-postal-code">
                            Postal Code
                          </label>

                          <input
                            id="restaurant-profile-postal-code"
                            type="text"
                            value={locationData.postal_code}
                            readOnly
                          />
                        </div>

                        <div className="restaurant-profile-field restaurant-profile-field--full">
                          <label htmlFor="restaurant-profile-country">
                            Country
                          </label>

                          <input
                            id="restaurant-profile-country"
                            type="text"
                            value={locationData.country}
                            readOnly
                          />
                        </div>
                      </>
                    )}

                    {/* ======================================
                        PHONE
                    ====================================== */}

                    <div className="restaurant-profile-field">
                      <label htmlFor="restaurant-profile-phone">
                        Phone Number
                      </label>

                      <div className="restaurant-profile-input-wrapper">
                        <Phone size={18} />

                        <input
                          id="restaurant-profile-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={12}
                          placeholder="082 123 4567"
                          value={phone}
                          onChange={handlePhoneChange}
                          required
                        />
                      </div>
                    </div>

                    {/* ======================================
                        OPERATING HOURS INFO
                    ====================================== */}

                    <div className="restaurant-profile-field restaurant-profile-field--full restaurant-profile-hours-intro">
                      <div className="restaurant-profile-hours-intro-icon">
                        <Clock3 size={18} />
                      </div>

                      <div>
                        <strong>Operating Hours</strong>

                        <span>
                          These times automatically control the Open / Closed
                          status customers see.
                        </span>
                      </div>
                    </div>

                    {/* ======================================
                        OPENING
                    ====================================== */}

                    <div className="restaurant-profile-field">
                      <label htmlFor="restaurant-profile-opening-time">
                        Opening Time
                      </label>

                      <div className="restaurant-profile-input-wrapper">
                        <Clock3 size={18} />

                        <input
                          id="restaurant-profile-opening-time"
                          type="time"
                          value={openingTime}
                          onChange={(event) =>
                            setOpeningTime(event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* ======================================
                        CLOSING
                    ====================================== */}

                    <div className="restaurant-profile-field">
                      <label htmlFor="restaurant-profile-closing-time">
                        Closing Time
                      </label>

                      <div className="restaurant-profile-input-wrapper">
                        <Clock3 size={18} />

                        <input
                          id="restaurant-profile-closing-time"
                          type="time"
                          value={closingTime}
                          onChange={(event) =>
                            setClosingTime(event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* ======================================
                        IMAGE
                    ====================================== */}

                    <div className="restaurant-profile-field">
                      <label htmlFor="restaurant-profile-image">
                        Restaurant Image
                      </label>

                      <div className="restaurant-profile-input-wrapper">
                        <ImageIcon size={18} />

                        <input
                          id="restaurant-profile-image"
                          type="url"
                          placeholder="https://example.com/restaurant.jpg"
                          value={imageUrl}
                          onChange={(event) => setImageUrl(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* ======================================
                        ACTIONS
                    ====================================== */}

                    <div className="restaurant-profile-form-actions restaurant-profile-field--full">
                      {/* UPDATE / CREATE */}

                      <button
                        type="submit"
                        className="restaurant-profile-save-button"
                        disabled={loading || deleting}
                      >
                        {isAddingNew ? <Plus size={17} /> : <Save size={17} />}

                        {loading
                          ? "Saving..."
                          : isAddingNew
                            ? "Create Restaurant"
                            : "Update Restaurant"}
                      </button>

                      {/* DELETE */}

                      {!isAddingNew && selectedRestaurant?._id && (
                        <button
                          type="button"
                          className="restaurant-profile-delete-button"
                          onClick={handleDeleteRestaurant}
                          disabled={loading || deleting}
                        >
                          <Trash2 size={17} />

                          {deleting
                            ? "Deleting Restaurant..."
                            : "Delete Restaurant"}
                        </button>
                      )}
                    </div>
                  </form>
                </section>

                {/* ======================================
                    PREVIEW
                ====================================== */}

                <aside className="restaurant-profile-preview-card">
                  <div className="restaurant-profile-preview-heading">
                    <span>Preview</span>

                    <h2>Customer View</h2>

                    <p>Preview the restaurant information before saving.</p>
                  </div>

                  {/* ======================================
                      IMAGE
                  ====================================== */}

                  <div className="restaurant-profile-preview-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name || "Restaurant preview"} />
                    ) : (
                      <div className="restaurant-profile-image-placeholder">
                        <ImageIcon size={36} />

                        <span>Add an image URL</span>
                      </div>
                    )}
                  </div>

                  {/* ======================================
                      CONTENT
                  ====================================== */}

                  <div className="restaurant-profile-preview-content">
                    <span className="restaurant-profile-preview-label">
                      {isAddingNew ? "New Restaurant" : "Restaurant"}
                    </span>

                    <h3>{name || "Your Restaurant Name"}</h3>

                    {/* CATEGORY */}

                    <div className="restaurant-profile-preview-detail">
                      <Store size={16} />

                      <span>
                        {category
                          ? getRestaurantCategoryLabel(category)
                          : "Restaurant category"}
                      </span>
                    </div>

                    {/* ADDRESS */}

                    <div className="restaurant-profile-preview-detail">
                      <MapPin size={16} />

                      <span>
                        {locationData.formatted_address ||
                          locationData.street_address ||
                          "Restaurant address"}
                      </span>
                    </div>

                    {/* ======================================
                        STATUS
                    ====================================== */}

                    <div
                      className={`restaurant-profile-live-status ${
                        previewIsOpen
                          ? "restaurant-profile-live-status--open"
                          : "restaurant-profile-live-status--closed"
                      }`}
                    >
                      <span className="restaurant-profile-live-status-dot" />

                      <div>
                        <strong>
                          {previewIsOpen ? "Open now" : "Closed now"}
                        </strong>

                        <span>
                          {openingTime === closingTime
                            ? "Open 24 hours"
                            : `${openingTime} – ${closingTime}`}
                        </span>
                      </div>
                    </div>

                    {/* ======================================
                        PHONE
                    ====================================== */}

                    <div className="restaurant-profile-preview-detail">
                      <Phone size={16} />

                      <span>{phone || "Restaurant phone number"}</span>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default RestaurantProfilePage;
