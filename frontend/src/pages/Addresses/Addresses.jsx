// ======================================
// REACT
// ======================================

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

// ======================================
// ICONS
// ======================================

import {
  ArrowLeft,
  Briefcase,
  Check,
  Home,
  LoaderCircle,
  MapPin,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

// ======================================
// ADDRESS SERVICES
// ======================================

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
} from "../../services/addressService";

// ======================================
// COMPONENTS
// ======================================

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import LocationPicker from "../../components/maps/LocationPicker";

// ======================================
// STYLES
// ======================================

import "../../styles/Addresses.css";

// ======================================
// EMPTY ADDRESS FORM
// ======================================

const EMPTY_ADDRESS_FORM = {
  label: "Home",

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

  is_default: false,
};

// ======================================
// NORMALISE LABEL
// ======================================

const normaliseLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

// ======================================
// DOES ADDRESS TYPE EXIST?
// ======================================

const hasAddressType = (addressList, label) => {
  const targetLabel = normaliseLabel(label);

  return addressList.some(
    (address) => normaliseLabel(address.label) === targetLabel,
  );
};

// ======================================
// NEXT AVAILABLE LABEL
// ======================================

const getNextAvailableLabel = (addressList) => {
  if (!hasAddressType(addressList, "Home")) {
    return "Home";
  }

  if (!hasAddressType(addressList, "Work")) {
    return "Work";
  }

  return "Other";
};

// ======================================
// ADDRESSES PAGE
// ======================================

function Addresses() {
  // ======================================
  // NAVIGATION
  // ======================================

  const navigate = useNavigate();

  // ======================================
  // SAVED ADDRESSES
  // ======================================

  const [addresses, setAddresses] = useState([]);

  // ======================================
  // FORM
  // ======================================

  const [formData, setFormData] = useState({
    ...EMPTY_ADDRESS_FORM,
  });

  // ======================================
  // MAP PICKER KEY
  // ======================================

  const [locationPickerKey, setLocationPickerKey] = useState(0);

  // ======================================
  // LOADING
  // ======================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [changingDefault, setChangingDefault] = useState(null);

  // ======================================
  // FEEDBACK
  // ======================================

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================
  // ADDRESS TYPE STATUS
  // ======================================

  const hasHomeAddress = hasAddressType(addresses, "Home");

  const hasWorkAddress = hasAddressType(addresses, "Work");

  // ======================================
  // HAS SELECTED LOCATION
  // ======================================

  const hasSelectedLocation =
    formData.latitude !== "" && formData.longitude !== "";

  // ======================================
  // GET ADDRESSES
  // ======================================

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      setError("");

      const data = await getAddresses();

      const addressList = Array.isArray(data)
        ? data
        : Array.isArray(data?.addresses)
          ? data.addresses
          : [];

      setAddresses(addressList);

      // ======================================
      // MAKE SURE FORM DOES NOT REMAIN
      // ON HOME/WORK IF THAT TYPE
      // ALREADY EXISTS
      // ======================================

      setFormData((previous) => {
        const currentLabel = normaliseLabel(previous.label);

        if (currentLabel === "home" && hasAddressType(addressList, "Home")) {
          return {
            ...previous,

            label: getNextAvailableLabel(addressList),
          };
        }

        if (currentLabel === "work" && hasAddressType(addressList, "Work")) {
          return {
            ...previous,

            label: getNextAvailableLabel(addressList),
          };
        }

        return previous;
      });

      return addressList;
    } catch (error) {
      console.error("Could not load addresses:", error);

      setError(
        error.response?.data?.message || "Could not load your addresses.",
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // LOAD WHEN PAGE OPENS
  // ======================================

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ======================================
  // CLEAR SUCCESS MESSAGE
  // ======================================

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => {
        setSuccess("");
      },

      3000,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  // ======================================
  // NORMAL FORM INPUT
  // ======================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");

    setSuccess("");
  };

  // ======================================
  // GEOAPIFY LOCATION SELECTED
  // ======================================

  const handleLocationSelect = (location) => {
    setError("");

    setSuccess("");

    // ======================================
    // COORDINATES
    // ======================================

    const latitude = Number(location.latitude);

    const longitude = Number(location.longitude);

    // ======================================
    // VALIDATE COORDINATES
    // ======================================

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("The selected location does not contain valid coordinates.");

      return;
    }

    // ======================================
    // SAVE ADDRESS INFORMATION
    // ======================================

    setFormData((previous) => ({
      ...previous,

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
    }));
  };

  // ======================================
  // ADD ADDRESS
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    // ======================================
    // ONE HOME ONLY
    // ======================================

    if (normaliseLabel(formData.label) === "home" && hasHomeAddress) {
      setError(
        "You already have a Home address. Only one Home address can be saved.",
      );

      return;
    }

    // ======================================
    // ONE WORK ONLY
    // ======================================

    if (normaliseLabel(formData.label) === "work" && hasWorkAddress) {
      setError(
        "You already have a Work address. Only one Work address can be saved.",
      );

      return;
    }

    // ======================================
    // CHECK MAP LOCATION
    // ======================================

    const latitude = Number(formData.latitude);

    const longitude = Number(formData.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(
        "Search for your address and select it from the suggestions before saving.",
      );

      return;
    }

    // ======================================
    // CHECK ADDRESS INFORMATION
    // ======================================

    if (
      !formData.street_address ||
      !formData.suburb ||
      !formData.city ||
      !formData.province
    ) {
      setError(
        "The selected location is missing some address information. Search for a more specific street address.",
      );

      return;
    }

    try {
      // ======================================
      // START SAVING
      // ======================================

      setSaving(true);

      // ======================================
      // BUILD PAYLOAD
      // ======================================

      const addressData = {
        label: formData.label,

        street_address: formData.street_address,

        suburb: formData.suburb,

        city: formData.city,

        province: formData.province,

        postal_code: formData.postal_code,

        country: formData.country,

        latitude,

        longitude,

        formatted_address: formData.formatted_address,

        geoapify_place_id: formData.geoapify_place_id || null,

        is_default: formData.is_default,
      };

      // ======================================
      // CREATE
      // ======================================

      await createAddress(addressData);

      // ======================================
      // RELOAD
      // ======================================

      const updatedAddresses = await fetchAddresses();

      // ======================================
      // RESET FORM
      // ======================================

      setFormData({
        ...EMPTY_ADDRESS_FORM,

        label: getNextAvailableLabel(updatedAddresses),
      });

      setLocationPickerKey((current) => current + 1);

      // ======================================
      // UPDATE NAVBAR / ROUTING
      // ======================================

      window.dispatchEvent(new Event("addressChanged"));

      setSuccess("Address added successfully.");
    } catch (error) {
      console.error("Could not create address:", error);

      setError(error.response?.data?.message || "Could not save the address.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // SET DEFAULT ADDRESS
  // ======================================

  const handleSetDefault = async (id) => {
    try {
      setChangingDefault(id);

      setError("");

      setSuccess("");

      await setDefaultAddress(id);

      await fetchAddresses();

      window.dispatchEvent(new Event("addressChanged"));

      setSuccess("Delivery location updated.");
    } catch (error) {
      console.error("Could not change address:", error);

      setError(
        error.response?.data?.message || "Could not change delivery location.",
      );
    } finally {
      setChangingDefault(null);
    }
  };

  // ======================================
  // DELETE ADDRESS
  // ======================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setSuccess("");

      await deleteAddress(id);

      const updatedAddresses = await fetchAddresses();

      // ======================================
      // UPDATE NEXT AVAILABLE TYPE
      // ======================================

      setFormData((previous) => ({
        ...previous,

        label: getNextAvailableLabel(updatedAddresses),
      }));

      window.dispatchEvent(new Event("addressChanged"));

      setSuccess("Address deleted successfully.");
    } catch (error) {
      console.error("Could not delete address:", error);

      setError(
        error.response?.data?.message || "Could not delete the address.",
      );
    }
  };

  // ======================================
  // ADDRESS ICON
  // ======================================

  const getAddressIcon = (label) => {
    const normalised = normaliseLabel(label);

    if (normalised === "home") {
      return <Home size={20} />;
    }

    if (normalised === "work") {
      return <Briefcase size={20} />;
    }

    return <MapPin size={20} />;
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="addresses-layout-root">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar />

      {/* ======================================
          MAIN PAGE
      ====================================== */}

      <main className="addresses-page">
        <div className="addresses-container">
          {/* ======================================
              BACK
          ====================================== */}

          <button
            type="button"
            className="addresses-back-button"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft size={18} />

            <span>Back to Home</span>
          </button>

          {/* ======================================
              HEADER
          ====================================== */}

          <section className="addresses-header">
            <div className="addresses-header-content">
              <span className="addresses-eyebrow">
                <MapPin size={16} />
                Delivery locations
              </span>

              <h1>My Addresses</h1>

              <p>
                Save your Home, Work and other delivery locations so Dish Dash
                knows exactly where to deliver.
              </p>
            </div>

            <div className="addresses-header-count">
              <strong>{addresses.length}</strong>

              <span>
                {addresses.length === 1 ? "Saved address" : "Saved addresses"}
              </span>
            </div>
          </section>

          {/* ======================================
              PAGE MESSAGES
          ====================================== */}

          {error && (
            <div className="address-message error-message">{error}</div>
          )}

          {success && (
            <div className="address-message success-message">{success}</div>
          )}

          {/* ======================================
              LAYOUT
          ====================================== */}

          <div className="addresses-layout">
            {/* ======================================
                ADD ADDRESS
            ====================================== */}

            <section className="address-form-section">
              {/* ======================================
                  SECTION HEADING
              ====================================== */}

              <div className="address-section-heading">
                <div className="address-heading-icon">
                  <Plus size={20} />
                </div>

                <div>
                  <h2>Add New Address</h2>

                  <p>
                    Search for the exact address and select it from the results.
                  </p>
                </div>
              </div>

              {/* ======================================
                  FORM
              ====================================== */}

              <form className="address-form" onSubmit={handleSubmit}>
                {/* ======================================
                    ADDRESS TYPE
                ====================================== */}

                <div className="form-group">
                  <label htmlFor="label">Address Type</label>

                  <select
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                  >
                    <option value="Home" disabled={hasHomeAddress}>
                      {hasHomeAddress ? "Home — already added" : "Home"}
                    </option>

                    <option value="Work" disabled={hasWorkAddress}>
                      {hasWorkAddress ? "Work — already added" : "Work"}
                    </option>

                    <option value="Other">Other</option>
                  </select>

                  <p className="address-type-note">
                    You can save one Home address and one Work address. Other
                    locations can be added as needed.
                  </p>
                </div>

                {/* ======================================
                    LOCATION PICKER
                ====================================== */}

                <LocationPicker
                  key={locationPickerKey}
                  onLocationSelect={handleLocationSelect}
                />

                {/* ======================================
                    SELECTED ADDRESS INFORMATION
                ====================================== */}

                {hasSelectedLocation && (
                  <section className="selected-address-details">
                    <div className="selected-address-details-heading">
                      <div className="selected-address-details-icon">
                        <MapPin size={20} />
                      </div>

                      <div>
                        <h3>Selected Address</h3>

                        <p>Address information returned by the map service.</p>
                      </div>
                    </div>

                    {/* ======================================
                        DETAILS GRID
                    ====================================== */}

                    <div className="address-details-grid">
                      {/* STREET */}

                      <div className="address-detail-block address-detail-block--wide">
                        <span className="address-detail-label">
                          Street Address
                        </span>

                        <strong className="address-detail-value">
                          {formData.street_address || "Not available"}
                        </strong>
                      </div>

                      {/* SUBURB */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">Suburb</span>

                        <strong className="address-detail-value">
                          {formData.suburb || "Not available"}
                        </strong>
                      </div>

                      {/* CITY */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">City</span>

                        <strong className="address-detail-value">
                          {formData.city || "Not available"}
                        </strong>
                      </div>

                      {/* PROVINCE */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">Province</span>

                        <strong className="address-detail-value">
                          {formData.province || "Not available"}
                        </strong>
                      </div>

                      {/* POSTAL */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">
                          Postal Code
                        </span>

                        <strong className="address-detail-value">
                          {formData.postal_code || "Not available"}
                        </strong>
                      </div>

                      {/* COUNTRY */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">Country</span>

                        <strong className="address-detail-value">
                          {formData.country || "Not available"}
                        </strong>
                      </div>

                      {/* TYPE */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">
                          Address Type
                        </span>

                        <strong className="address-detail-value">
                          {formData.label}
                        </strong>
                      </div>

                      {/* LATITUDE */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">Latitude</span>

                        <strong className="address-detail-value address-detail-value--small">
                          {formData.latitude}
                        </strong>
                      </div>

                      {/* LONGITUDE */}

                      <div className="address-detail-block">
                        <span className="address-detail-label">Longitude</span>

                        <strong className="address-detail-value address-detail-value--small">
                          {formData.longitude}
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

                {/* ======================================
                    DEFAULT ADDRESS
                ====================================== */}

                <label className="default-address-option">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                  />

                  <span className="default-address-option-check">
                    <Check size={15} />
                  </span>

                  <span className="default-address-option-content">
                    <strong>Make this my delivery location</strong>

                    <small>
                      Dish Dash will use this address when calculating
                      restaurant distance and delivery fees.
                    </small>
                  </span>
                </label>

                {/* ======================================
                    SAVE
                ====================================== */}

                <button
                  type="submit"
                  className="save-address-button"
                  disabled={saving || !hasSelectedLocation}
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={18} className="spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Address
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* ======================================
                SAVED ADDRESSES
            ====================================== */}

            <section className="saved-addresses-section">
              {/* ======================================
                  HEADING
              ====================================== */}

              <div className="saved-addresses-heading">
                <div>
                  <h2>Saved Addresses</h2>

                  <p>
                    {addresses.length}{" "}
                    {addresses.length === 1 ? "location" : "locations"}
                  </p>
                </div>

                <MapPin size={23} />
              </div>

              {/* ======================================
                  LOADING
              ====================================== */}

              {loading ? (
                <div className="addresses-loading">
                  <LoaderCircle size={30} className="spinner" />

                  <p>Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                // ======================================
                // EMPTY
                // ======================================

                <div className="addresses-empty">
                  <div className="empty-address-icon">
                    <MapPin size={28} />
                  </div>

                  <h3>No addresses yet</h3>

                  <p>Search for your first delivery address using the map.</p>
                </div>
              ) : (
                // ======================================
                // ADDRESS LIST
                // ======================================

                <div className="address-list">
                  {addresses.map((address) => (
                    <article
                      key={address._id}
                      className={`address-card${
                        address.is_default ? " selected-address-card" : ""
                      }`}
                    >
                      {/* ======================================
                            ADDRESS INFORMATION
                        ====================================== */}

                      <div className="address-card-main">
                        <div className="address-card-icon">
                          {getAddressIcon(address.label)}
                        </div>

                        <div className="address-card-content">
                          <div className="address-card-title">
                            <h3>{address.label}</h3>

                            {address.is_default && (
                              <span className="default-badge">Default</span>
                            )}
                          </div>

                          <p className="street-address">
                            {address.street_address}
                          </p>

                          <p>
                            {[address.suburb, address.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>

                          <p>
                            {[address.province, address.postal_code]
                              .filter(Boolean)
                              .join(", ")}
                          </p>

                          <p>{address.country}</p>

                          {/* ======================================
                                CURRENT / USE ADDRESS
                            ====================================== */}

                          {address.is_default ? (
                            <div className="current-address">
                              <Check size={15} />
                              Current delivery location
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="use-address-button"
                              disabled={changingDefault === address._id}
                              onClick={() => handleSetDefault(address._id)}
                            >
                              {changingDefault === address._id ? (
                                <>
                                  <LoaderCircle size={15} className="spinner" />
                                  Changing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={15} />
                                  Use for Delivery
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ======================================
                            DELETE
                        ====================================== */}

                      <button
                        type="button"
                        className="delete-address-button"
                        title="Delete address"
                        aria-label={`Delete ${address.label} address`}
                        onClick={() => handleDelete(address._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default Addresses;
