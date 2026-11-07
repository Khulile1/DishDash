// ======================================
// REACT
// ======================================

import { useEffect, useState } from "react";

// ======================================
// LEAFLET
// ======================================

import L from "leaflet";

import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

// ======================================
// SERVICE
// ======================================

import { getDrivingRoute } from "../../services/mapService";

// ======================================
// LEAFLET CSS
// ======================================

import "leaflet/dist/leaflet.css";

// ======================================
// PAGE CSS
// ======================================

import "../../styles/RouteTest.css";

// ======================================
// TEST LOCATIONS
// ======================================

// Approximate Sandton point
const LOCATION_A = {
  name: "Point A - Sandton",

  latitude: -26.1076,

  longitude: 28.0567,
};

// Approximate Midrand / Mall of Africa point
const LOCATION_B = {
  name: "Point B - Midrand",

  latitude: -26.0159,

  longitude: 28.1074,
};

// ======================================
// FIT MAP TO ROUTE
// ======================================

function FitRoute({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route) {
      return;
    }

    try {
      const layer = L.geoJSON(route);

      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [40, 40],
        });
      }

      // Important if the map is inside
      // a changing layout.
      window.setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error("FIT ROUTE ERROR:", error);
    }
  }, [route, map]);

  return null;
}

// ======================================
// MAP SIZE FIX
// ======================================

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize({
        animate: false,
      });
    }, 100);

    const container = map.getContainer();

    const observer = new ResizeObserver(() => {
      map.invalidateSize({
        animate: false,
      });
    });

    observer.observe(container);

    return () => {
      window.clearTimeout(timer);

      observer.disconnect();
    };
  }, [map]);

  return null;
}

// ======================================
// ROUTE TEST PAGE
// ======================================

function RouteTest() {
  const [route, setRoute] = useState(null);

  const [distanceKm, setDistanceKm] = useState(null);

  const [durationMinutes, setDurationMinutes] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ======================================
  // CALCULATE ROUTE
  // ======================================

  const calculateTestRoute = async () => {
    try {
      setLoading(true);

      setError("");

      setRoute(null);

      // ======================================
      // GEOAPIFY ROUTING
      // ======================================

      const data = await getDrivingRoute({
        fromLatitude: LOCATION_A.latitude,

        fromLongitude: LOCATION_A.longitude,

        toLatitude: LOCATION_B.latitude,

        toLongitude: LOCATION_B.longitude,
      });

      console.log("ROUTE RESPONSE:", data);

      // ======================================
      // SAVE RESULTS
      // ======================================

      setRoute(data.route);

      setDistanceKm(data.distanceKm);

      setDurationMinutes(data.durationMinutes);
    } catch (error) {
      console.error("ROUTE TEST ERROR:", error);

      setError(
        error?.response?.data?.message || "Could not calculate the route.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <main className="route-test-page">
      <section className="route-test-card">
        <h1>Geoapify Route Test</h1>

        <p>Test driving directions from Point A to Point B.</p>

        {/* ====================================== */}
        {/* LOCATIONS */}
        {/* ====================================== */}

        <div className="route-test-points">
          <div>
            <strong>A</strong>

            <span>{LOCATION_A.name}</span>

            <small>
              {LOCATION_A.latitude}, {LOCATION_A.longitude}
            </small>
          </div>

          <div>
            <strong>B</strong>

            <span>{LOCATION_B.name}</span>

            <small>
              {LOCATION_B.latitude}, {LOCATION_B.longitude}
            </small>
          </div>
        </div>

        {/* ====================================== */}
        {/* CALCULATE */}
        {/* ====================================== */}

        <button
          type="button"
          className="route-test-button"
          disabled={loading}
          onClick={calculateTestRoute}
        >
          {loading ? "Calculating..." : "Calculate A → B Route"}
        </button>

        {/* ====================================== */}
        {/* ERROR */}
        {/* ====================================== */}

        {error && <div className="route-test-error">{error}</div>}

        {/* ====================================== */}
        {/* RESULT */}
        {/* ====================================== */}

        {distanceKm !== null && (
          <div className="route-test-result">
            <div>
              <span>Distance</span>

              <strong>{distanceKm} km</strong>
            </div>

            <div>
              <span>Estimated drive</span>

              <strong>{durationMinutes} min</strong>
            </div>
          </div>
        )}

        {/* ====================================== */}
        {/* MAP */}
        {/* ====================================== */}

        <div className="route-test-map">
          <MapContainer
            center={[-26.06, 28.08]}
            zoom={11}
            className="route-test-leaflet"
          >
            <MapSizeFix />

            {/* ====================================== */}
            {/* GEOAPIFY TILES */}
            {/* ====================================== */}

            <TileLayer
              tileSize={256}
              detectRetina={false}
              url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${
                import.meta.env.VITE_GEOAPIFY_MAP_KEY
              }`}
              attribution='&copy; OpenStreetMap contributors | Powered by <a href="https://www.geoapify.com/">Geoapify</a>'
            />

            {/* ====================================== */}
            {/* POINT A */}
            {/* ====================================== */}

            <CircleMarker
              center={[LOCATION_A.latitude, LOCATION_A.longitude]}
              radius={10}
            >
              <Popup>
                <strong>Point A</strong>

                <br />

                {LOCATION_A.name}
              </Popup>
            </CircleMarker>

            {/* ====================================== */}
            {/* POINT B */}
            {/* ====================================== */}

            <CircleMarker
              center={[LOCATION_B.latitude, LOCATION_B.longitude]}
              radius={10}
            >
              <Popup>
                <strong>Point B</strong>

                <br />

                {LOCATION_B.name}
              </Popup>
            </CircleMarker>

            {/* ====================================== */}
            {/* ROAD ROUTE */}
            {/* ====================================== */}

            {route && (
              <>
                <GeoJSON key={JSON.stringify(route)} data={route} />

                <FitRoute route={route} />
              </>
            )}
          </MapContainer>
        </div>
      </section>
    </main>
  );
}

export default RouteTest;
