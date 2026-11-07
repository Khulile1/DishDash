// ======================================
// REACT
// ======================================

import { useEffect, useRef, useState } from "react";

// ======================================
// LEAFLET
// ======================================

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// ======================================
// MAP SERVICE
// ======================================

import { searchAddresses } from "../../services/mapService";

// ======================================
// STYLES
// ======================================

import "../../styles/LocationPicker.css";

// ======================================
// CSS-ONLY MAP PIN
// ======================================
//
// Do not use Leaflet's marker PNG files here.
// Vite can produce broken marker image paths.
//
// This pin is pure HTML/CSS, so it works for
// both customer and restaurant address forms.
// ======================================

const selectedLocationIcon = L.divIcon({
  className: "dishdash-map-pin-wrapper",

  html: `
    <div class="dishdash-map-pin">
      <span class="dishdash-map-pin-dot"></span>
    </div>
  `,

  iconSize: [34, 44],

  iconAnchor: [17, 42],

  popupAnchor: [0, -38],
});

// ======================================
// DEFAULT MAP POSITION
// Johannesburg
// ======================================

const DEFAULT_POSITION = [-26.2041, 28.0473];

// ======================================
// FIX MAP SIZE
// ======================================

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const mapContainer = map.getContainer();

    // ======================================
    // INITIAL SIZE RECALCULATION
    // ======================================

    const firstTimer = window.setTimeout(() => {
      map.invalidateSize({
        animate: false,
      });
    }, 100);

    const secondTimer = window.setTimeout(() => {
      map.invalidateSize({
        animate: false,
      });
    }, 400);

    // ======================================
    // WATCH MAP CONTAINER SIZE
    // ======================================

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({
        animate: false,
      });
    });

    resizeObserver.observe(mapContainer);

    // Also watch the parent because your
    // Addresses page uses a two-column layout.
    if (mapContainer.parentElement) {
      resizeObserver.observe(mapContainer.parentElement);
    }

    // ======================================
    // WINDOW RESIZE
    // ======================================

    const handleResize = () => {
      map.invalidateSize({
        animate: false,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(firstTimer);

      window.clearTimeout(secondTimer);

      resizeObserver.disconnect();

      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

// ======================================
// MAP UPDATER
// ======================================

function MapUpdater({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    // Recalculate size first.
    map.invalidateSize({
      animate: false,
    });

    // Move map to selected address.
    map.flyTo([latitude, longitude], 16, {
      duration: 1,
    });
  }, [latitude, longitude, map]);

  return null;
}

// ======================================
// LOCATION PICKER
// ======================================

function LocationPicker({ onLocationSelect }) {
  // ======================================
  // SEARCH TEXT
  // ======================================

  const [searchText, setSearchText] = useState("");

  // ======================================
  // SUGGESTIONS
  // ======================================

  const [suggestions, setSuggestions] = useState([]);

  // ======================================
  // SELECTED LOCATION
  // ======================================

  const [selectedLocation, setSelectedLocation] = useState(null);

  // ======================================
  // LOADING
  // ======================================

  const [loading, setLoading] = useState(false);

  // ======================================
  // ERROR
  // ======================================

  const [error, setError] = useState("");

  // ======================================
  // REQUEST VERSION
  // ======================================

  const requestVersionRef = useRef(0);

  // Prevent Geoapify from searching again
  // immediately after selecting a suggestion.
  const selectedAddressRef = useRef(false);

  // ======================================
  // SEARCH GEOAPIFY
  // ======================================

  useEffect(() => {
    const text = searchText.trim();

    // ======================================
    // ADDRESS WAS JUST SELECTED
    // ======================================

    if (selectedAddressRef.current) {
      selectedAddressRef.current = false;

      return undefined;
    }

    // ======================================
    // DO NOT SEARCH SHORT TEXT
    // ======================================

    if (text.length < 3) {
      setSuggestions([]);

      setLoading(false);

      return undefined;
    }

    // ======================================
    // DEBOUNCE SEARCH
    // ======================================

    const timer = window.setTimeout(async () => {
      const requestVersion = ++requestVersionRef.current;

      try {
        setLoading(true);

        setError("");

        // ======================================
        // CALL OUR BACKEND
        // ======================================

        const data = await searchAddresses(text);

        // Ignore old requests.
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        // ======================================
        // SAVE SUGGESTIONS
        // ======================================

        setSuggestions(Array.isArray(data?.results) ? data.results : []);
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        console.error("ADDRESS SEARCH ERROR:", error);

        setSuggestions([]);

        setError(
          error?.response?.data?.message || "Could not search for addresses.",
        );
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }
    }, 400);

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchText]);

  // ======================================
  // SELECT EXACT AUTOCOMPLETE RESULT
  // ======================================

  const handleSelectLocation = (place) => {
    const latitude = Number(place.latitude);

    const longitude = Number(place.longitude);

    // ======================================
    // VALIDATE COORDINATES
    // ======================================

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("The selected address does not contain valid coordinates.");

      return;
    }

    // ======================================
    // KEEP EXACT SELECTED RESULT
    // ======================================
    //
    // Important:
    // Do NOT reverse-geocode after the user
    // selects an autocomplete suggestion.
    //
    // The autocomplete result already contains
    // the address + coordinates for the exact
    // option the user clicked.
    //
    // Reverse geocoding can snap those same
    // coordinates to a nearby property and make
    // "29 Bowling Avenue" appear as "21 Bowling
    // Avenue", which is not what the user chose.
    // ======================================

    const location = {
      ...place,
      latitude,
      longitude,
    };

    // ======================================
    // SAVE EXACT SELECTION
    // ======================================

    setSelectedLocation(location);

    selectedAddressRef.current = true;

    setSearchText(location.formatted || location.addressLine1 || "");

    setSuggestions([]);

    setError("");

    // ======================================
    // SEND EXACT RESULT TO PARENT
    // ======================================

    if (typeof onLocationSelect === "function") {
      onLocationSelect(location);
    }
  };

  // ======================================
  // HANDLE SEARCH INPUT
  // ======================================

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchText(value);

    // User is searching for another location.
    setSelectedLocation(null);

    setError("");
  };

  // ======================================
  // MAP POSITION
  // ======================================

  const mapPosition = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : DEFAULT_POSITION;

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="location-picker">
      {/* ====================================== */}
      {/* ADDRESS SEARCH */}
      {/* ====================================== */}

      <div className="location-search">
        <label htmlFor="geoapify-address-search">Search address</label>

        <div className="location-search-input-wrapper">
          <input
            id="geoapify-address-search"
            type="text"
            value={searchText}
            placeholder="Start typing a street, building or business..."
            autoComplete="off"
            onChange={handleSearchChange}
          />
        </div>

        {/* ====================================== */}
        {/* LOADING */}
        {/* ====================================== */}

        {loading && (
          <p className="location-search-status">Searching addresses...</p>
        )}

        {/* ====================================== */}
        {/* ERROR */}
        {/* ====================================== */}

        {error && <p className="location-search-error">{error}</p>}

        {/* ====================================== */}
        {/* ADDRESS SUGGESTIONS */}
        {/* ====================================== */}

        {suggestions.length > 0 && (
          <div className="location-suggestions">
            {suggestions.map((place, index) => (
              <button
                key={
                  place.placeId ||
                  `${place.latitude}-${place.longitude}-${index}`
                }
                type="button"
                className="location-suggestion"
                onClick={() => handleSelectLocation(place)}
              >
                <strong>{place.addressLine1 || place.formatted}</strong>

                {place.addressLine2 && <span>{place.addressLine2}</span>}

                {!place.addressLine2 && place.formatted && (
                  <span>{place.formatted}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* LEAFLET MAP */}
      {/* ====================================== */}

      <div className="location-map">
        <MapContainer
          center={mapPosition}
          zoom={selectedLocation ? 16 : 10}
          scrollWheelZoom={true}
          className="location-leaflet-map"
        >
          {/* ====================================== */}
          {/* FIX MAP DIMENSIONS */}
          {/* ====================================== */}

          <MapSizeFix />

          {/* ====================================== */}
          {/* GEOAPIFY MAP TILES */}
          {/* ====================================== */}

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* ====================================== */}
          {/* SELECTED LOCATION */}
          {/* ====================================== */}

          {selectedLocation && (
            <>
              {/* MOVE MAP */}

              <MapUpdater
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
              />

              {/* LOCATION PIN */}

              <Marker
                position={[
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                ]}
                icon={selectedLocationIcon}
              >
                <Popup>
                  <strong>Selected Address</strong>

                  <br />

                  {selectedLocation.formatted}
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* ====================================== */}
      {/* SELECTED ADDRESS SUMMARY */}
      {/* ====================================== */}

      {selectedLocation && (
        <div className="selected-location">
          <div className="selected-location-header">
            <strong>Selected location</strong>
          </div>

          <p>{selectedLocation.formatted}</p>

          <div className="selected-location-coordinates">
            <span>Latitude: {selectedLocation.latitude}</span>

            <span>Longitude: {selectedLocation.longitude}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default LocationPicker;
