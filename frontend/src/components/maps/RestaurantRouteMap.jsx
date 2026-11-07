// ======================================
// IMPORTS
// ======================================

import { useEffect, useMemo } from "react";

import L from "leaflet";

import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

// ======================================
// DEFAULT POSITION
// Johannesburg
// ======================================

const DEFAULT_POSITION = [-26.2041, 28.0473];

// ======================================
// NORMALISE COORDINATES
// ======================================

const toLatLng = (point) => {
  const latitude = Number(point?.latitude ?? point?.lat);

  const longitude = Number(point?.longitude ?? point?.lon ?? point?.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
};

// ======================================
// FIT MAP TO ROUTE
// ======================================

function RouteBounds({ routeGeoJson, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    // Give Leaflet a moment to measure the
    // responsive map container.
    const timer = window.setTimeout(() => {
      map.invalidateSize({
        animate: false,
      });

      try {
        if (routeGeoJson) {
          const routeLayer = L.geoJSON(routeGeoJson);

          const routeBounds = routeLayer.getBounds();

          if (routeBounds.isValid()) {
            map.fitBounds(routeBounds, {
              padding: [35, 35],
              maxZoom: 15,
              animate: false,
            });

            return;
          }
        }

        const points = [origin, destination].filter(Boolean);

        if (points.length === 2) {
          map.fitBounds(points, {
            padding: [35, 35],
            maxZoom: 15,
            animate: false,
          });
        } else if (points.length === 1) {
          map.setView(points[0], 14, {
            animate: false,
          });
        }
      } catch (error) {
        console.error("Could not fit route map:", error);
      }
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [routeGeoJson, origin, destination, map]);

  return null;
}

// ======================================
// CSS-ONLY ROUTE PINS
// ======================================

const customerRouteIcon = L.divIcon({
  className: "dishdash-route-pin-wrapper",

  html: `
    <div class="dishdash-route-pin dishdash-route-pin--customer">
      <span class="dishdash-route-pin-dot"></span>
    </div>
  `,

  iconSize: [32, 42],

  iconAnchor: [16, 40],

  popupAnchor: [0, -36],
});

const restaurantRouteIcon = L.divIcon({
  className: "dishdash-route-pin-wrapper",

  html: `
    <div class="dishdash-route-pin dishdash-route-pin--restaurant">
      <span class="dishdash-route-pin-dot"></span>
    </div>
  `,

  iconSize: [32, 42],

  iconAnchor: [16, 40],

  popupAnchor: [0, -36],
});

// ======================================
// RESTAURANT ROUTE MAP
// ======================================

function RestaurantRouteMap({ routeInfo, restaurantName }) {
  // ======================================
  // ROUTE DATA
  // ======================================

  const routeGeoJson = routeInfo?.routeGeoJson || routeInfo?.route || null;

  // ======================================
  // ORIGIN / DESTINATION
  // ======================================

  const origin = useMemo(
    () => toLatLng(routeInfo?.origin),
    [routeInfo?.origin],
  );

  const destination = useMemo(
    () => toLatLng(routeInfo?.destination),
    [routeInfo?.destination],
  );

  // ======================================
  // MAP CENTER
  // ======================================

  const center = origin || destination || DEFAULT_POSITION;

  // ======================================
  // TILE PROVIDER
  // ======================================
  //
  // Use OpenStreetMap tiles for display.
  // Geoapify remains responsible for
  // autocomplete, distance and routing.
  //
  // This removes the browser-side API key
  // dependency that can cause grey tiles.
  // ======================================

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="restaurant-route-map">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="restaurant-route-map-leaflet"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <RouteBounds
          routeGeoJson={routeGeoJson}
          origin={origin}
          destination={destination}
        />

        {routeGeoJson && (
          <GeoJSON
            data={routeGeoJson}
            style={{
              color: "#ff5a00",
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}

        {origin && (
          <Marker position={origin} icon={customerRouteIcon}>
            <Popup>
              <strong>Your delivery address</strong>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination} icon={restaurantRouteIcon}>
            <Popup>
              <strong>{restaurantName || "Restaurant"}</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// ======================================
// EXPORT
// ======================================

export default RestaurantRouteMap;
