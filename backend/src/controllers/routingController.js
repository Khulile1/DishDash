// IMPORTS

const Address = require("../models/address");

const Restaurant = require("../models/restaurant");

const {
  calculateDrivingRoute,
  calculateDrivingMatrix,
} = require("../services/routing/geoapifyRoutingService");

const {
  PRICE_PER_KM,
  calculateDeliveryPrice,
  calculateOrderPricing,
} = require("../services/pricing/deliveryPricingService");

// FORMAT SAVED ADDRESS

const formatSavedAddress = (location) => {
  if (!location) {
    return "";
  }

  const structuredAddress = [
    location.street_address,
    location.suburb,
    location.city,
    location.province,
    location.postal_code,
    location.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  return structuredAddress || String(location.formatted_address || "").trim();
};

// GET VALID COORDINATES

const getCoordinates = (location) => {
  if (!location) {
    return null;
  }

  const latitude = Number(location.latitude);

  const longitude = Number(location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

// GET CUSTOMER ADDRESS

//
// If checkout sends an address ID,
// use that exact saved address.
//
// Otherwise:
//
// 1. Default address
// 2. Newest saved address
//

const getCustomerAddress = async (userId, addressId = null) => {
  // SPECIFIC SELECTED ADDRESS

  if (addressId) {
    const selectedAddress = await Address.findOne({
      _id: addressId,
      user_id: userId,
    });

    if (selectedAddress) {
      return selectedAddress;
    }
  }

  // DEFAULT ADDRESS

  let address = await Address.findOne({
    user_id: userId,
    is_default: true,
  });

  // FALLBACK

  if (!address) {
    address = await Address.findOne({
      user_id: userId,
    }).sort({
      createdAt: -1,
    });
  }

  return address;
};

// ROUND ROUTE VALUE

const roundRouteValue = (value, decimals = 2) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number(number.toFixed(decimals));
};

// CREATE ROUTE SEGMENT

const createRouteSegment = ({ from, to, routeData }) => {
  return {
    from,

    to,

    distanceMeters: routeData.distanceMeters,

    distanceKm: routeData.distanceKm,

    durationSeconds: routeData.durationSeconds,

    durationMinutes: routeData.durationMinutes,

    routeGeoJson: routeData.routeGeoJson,

    origin: routeData.origin,

    destination: routeData.destination,
  };
};

// GET ONE RESTAURANT ROUTE

const getRestaurantRoute = async (req, res) => {
  try {
    // USER

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to calculate a delivery route.",
      });
    }

    // RESTAURANT

    const restaurantId = req.params.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    // CUSTOMER ADDRESS

    const customerAddress = await getCustomerAddress(userId);

    if (!customerAddress) {
      return res.status(404).json({
        message:
          "Add a delivery address to see driving distance and travel time.",
      });
    }

    // FIND RESTAURANT

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    // COORDINATES

    const customerCoordinates = getCoordinates(customerAddress);

    const restaurantCoordinates = getCoordinates(restaurant);

    if (!customerCoordinates) {
      return res.status(400).json({
        message: "Your delivery address does not have valid coordinates.",
      });
    }

    if (!restaurantCoordinates) {
      return res.status(400).json({
        message: "This restaurant does not have valid coordinates.",
      });
    }

    // ADDRESS STRINGS

    const customerAddressText = formatSavedAddress(customerAddress);

    const restaurantAddressText = formatSavedAddress(restaurant);

    // GEOAPIFY

    const routeData = await calculateDrivingRoute({
      origin: customerCoordinates,

      destination: restaurantCoordinates,
    });

    // DELIVERY PRICE PREVIEW

    const deliveryPrice = calculateDeliveryPrice(routeData.distanceKm);

    // RESPONSE

    return res.status(200).json({
      restaurantId: String(restaurant._id),

      restaurantName: restaurant.name,

      addressId: String(customerAddress._id),

      distanceMeters: routeData.distanceMeters,

      distanceKm: routeData.distanceKm,

      durationSeconds: routeData.durationSeconds,

      durationMinutes: routeData.durationMinutes,

      pricePerKm: PRICE_PER_KM,

      deliveryPrice,

      routeGeoJson: routeData.routeGeoJson,

      origin: routeData.origin || customerCoordinates,

      destination: routeData.destination || restaurantCoordinates,

      originAddress: customerAddressText,

      destinationAddress: restaurantAddressText,
    });
  } catch (error) {
    console.error("GET RESTAURANT ROUTE ERROR:", error);

    return res.status(500).json({
      message: "Server error while calculating the restaurant route.",
    });
  }
};

// GET ALL RESTAURANT DISTANCES

const getRestaurantDistances = async (req, res) => {
  try {
    // USER

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to calculate restaurant travel times.",
      });
    }

    // CUSTOMER ADDRESS

    const customerAddress = await getCustomerAddress(userId);

    if (!customerAddress) {
      return res.status(404).json({
        message: "Add a delivery address to see restaurant travel times.",
      });
    }

    const origin = getCoordinates(customerAddress);

    if (!origin) {
      return res.status(400).json({
        message: "Your delivery address does not have valid coordinates.",
      });
    }

    // RESTAURANTS

    const restaurantDocuments = await Restaurant.find({
      latitude: {
        $ne: null,
      },

      longitude: {
        $ne: null,
      },
    }).select("_id name latitude longitude");

    // DESTINATIONS

    const destinations = restaurantDocuments
      .map((restaurant) => {
        const coordinates = getCoordinates(restaurant);

        if (!coordinates) {
          return null;
        }

        return {
          restaurantId: String(restaurant._id),

          restaurantName: restaurant.name,

          latitude: coordinates.latitude,

          longitude: coordinates.longitude,
        };
      })
      .filter(Boolean);

    // NOTHING TO CALCULATE

    if (destinations.length === 0) {
      return res.status(200).json({
        addressId: String(customerAddress._id),

        originAddress: formatSavedAddress(customerAddress),

        pricePerKm: PRICE_PER_KM,

        distances: [],
      });
    }

    // GEOAPIFY MATRIX

    const matrixData = await calculateDrivingMatrix({
      origin,

      destinations,
    });

    // ADD DELIVERY PRICES

    const distancesWithDeliveryPrice = matrixData.map((restaurant) => {
      const deliveryPrice = calculateDeliveryPrice(restaurant.distanceKm);

      return {
        ...restaurant,

        pricePerKm: PRICE_PER_KM,

        deliveryPrice,
      };
    });

    // RESPONSE

    return res.status(200).json({
      addressId: String(customerAddress._id),

      originAddress: formatSavedAddress(customerAddress),

      pricePerKm: PRICE_PER_KM,

      distances: distancesWithDeliveryPrice,
    });
  } catch (error) {
    console.error("GET RESTAURANT DISTANCES ERROR:", error);

    return res.status(500).json({
      message: "Server error while calculating restaurant travel times.",
    });
  }
};

// GET DELIVERY QUOTE

//
// SINGLE:
//
// Restaurant
//    ↓
// Customer
//
// BUNDLED:
//
// Restaurant A
//     ↓
// Restaurant B
//     ↓
// Customer
//
// It also compares:
//
// B -> A -> Customer
//
// and selects the shorter route.
//

const getDeliveryQuote = async (req, res) => {
  try {
    // USER

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to calculate delivery pricing.",
      });
    }

    // REQUEST

    const restaurantIdsInput = req.body?.restaurantIds;

    const subtotal = Number(req.body?.subtotal);

    const selectedAddressId = req.body?.addressId || null;

    // VALIDATE RESTAURANTS

    if (!Array.isArray(restaurantIdsInput)) {
      return res.status(400).json({
        message: "restaurantIds must be an array.",
      });
    }

    const restaurantIds = [
      ...new Set(
        restaurantIdsInput.map((id) => String(id || "").trim()).filter(Boolean),
      ),
    ];

    if (restaurantIds.length === 0) {
      return res.status(400).json({
        message: "At least one restaurant is required.",
      });
    }

    // For now support maximum 2
    if (restaurantIds.length > 2) {
      return res.status(400).json({
        message:
          "A bundled delivery can currently contain a maximum of 2 restaurants.",
      });
    }

    // VALIDATE SUBTOTAL

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({
        message: "A valid food subtotal is required.",
      });
    }

    // SELECTED DELIVERY ADDRESS

    const customerAddress = await getCustomerAddress(userId, selectedAddressId);

    if (!customerAddress) {
      return res.status(404).json({
        message: "Add a delivery address before calculating checkout pricing.",
      });
    }

    const customerCoordinates = getCoordinates(customerAddress);

    if (!customerCoordinates) {
      return res.status(400).json({
        message: "Your delivery address does not have valid coordinates.",
      });
    }

    // LOAD RESTAURANTS

    const restaurantDocuments = await Restaurant.find({
      _id: {
        $in: restaurantIds,
      },
    }).select(
      "_id name latitude longitude street_address suburb city province postal_code country formatted_address",
    );

    if (restaurantDocuments.length !== restaurantIds.length) {
      return res.status(404).json({
        message: "One or more selected restaurants could not be found.",
      });
    }

    // Preserve original restaurant order
    const restaurants = restaurantIds.map((restaurantId) =>
      restaurantDocuments.find(
        (restaurant) => String(restaurant._id) === String(restaurantId),
      ),
    );

    // COORDINATES

    const restaurantStops = restaurants.map((restaurant) => ({
      restaurant,

      coordinates: getCoordinates(restaurant),
    }));

    const invalidRestaurant = restaurantStops.find((stop) => !stop.coordinates);

    if (invalidRestaurant) {
      return res.status(400).json({
        message: `${invalidRestaurant.restaurant.name} does not have valid delivery coordinates.`,
      });
    }

    // ONE RESTAURANT

    if (restaurantStops.length === 1) {
      const stop = restaurantStops[0];

      const routeData = await calculateDrivingRoute({
        origin: stop.coordinates,

        destination: customerCoordinates,
      });

      const pricing = calculateOrderPricing({
        subtotal,

        distanceKm: routeData.distanceKm,
      });

      return res.status(200).json({
        bundle: false,

        restaurantCount: 1,

        pickupOrder: [
          {
            restaurantId: String(stop.restaurant._id),

            restaurantName: stop.restaurant.name,
          },
        ],

        route: {
          distanceKm: pricing.distanceKm,

          durationMinutes: routeData.durationMinutes,

          segments: [
            createRouteSegment({
              from: {
                type: "restaurant",

                restaurantId: String(stop.restaurant._id),

                name: stop.restaurant.name,
              },

              to: {
                type: "customer",

                addressId: String(customerAddress._id),

                address: formatSavedAddress(customerAddress),
              },

              routeData,
            }),
          ],
        },

        pricing,
      });
    }

    // TWO RESTAURANTS

    const restaurantA = restaurantStops[0];

    const restaurantB = restaurantStops[1];

    // CALCULATE ROUTES

    const [aToB, bToA, aToCustomer, bToCustomer] = await Promise.all([
      // Restaurant A -> Restaurant B
      calculateDrivingRoute({
        origin: restaurantA.coordinates,

        destination: restaurantB.coordinates,
      }),

      // Restaurant B -> Restaurant A
      calculateDrivingRoute({
        origin: restaurantB.coordinates,

        destination: restaurantA.coordinates,
      }),

      // Restaurant A -> Customer
      calculateDrivingRoute({
        origin: restaurantA.coordinates,

        destination: customerCoordinates,
      }),

      // Restaurant B -> Customer
      calculateDrivingRoute({
        origin: restaurantB.coordinates,

        destination: customerCoordinates,
      }),
    ]);

    // A -> B -> CUSTOMER

    const routeABDistance =
      Number(aToB.distanceKm) + Number(bToCustomer.distanceKm);

    const routeABDuration =
      Number(aToB.durationMinutes) + Number(bToCustomer.durationMinutes);

    // B -> A -> CUSTOMER

    const routeBADistance =
      Number(bToA.distanceKm) + Number(aToCustomer.distanceKm);

    const routeBADuration =
      Number(bToA.durationMinutes) + Number(aToCustomer.durationMinutes);

    // VALIDATE

    if (
      !Number.isFinite(routeABDistance) ||
      !Number.isFinite(routeBADistance) ||
      !Number.isFinite(routeABDuration) ||
      !Number.isFinite(routeBADuration)
    ) {
      return res.status(400).json({
        message: "Could not calculate the bundled delivery route.",
      });
    }

    // CHOOSE SHORTEST ROUTE

    const useAB =
      routeABDistance < routeBADistance ||
      (routeABDistance === routeBADistance &&
        routeABDuration <= routeBADuration);

    let selectedDistanceKm;
    let selectedDurationMinutes;

    let pickupOrder;
    let segments;

    // A -> B -> CUSTOMER

    if (useAB) {
      selectedDistanceKm = routeABDistance;

      selectedDurationMinutes = routeABDuration;

      pickupOrder = [
        {
          restaurantId: String(restaurantA.restaurant._id),

          restaurantName: restaurantA.restaurant.name,
        },

        {
          restaurantId: String(restaurantB.restaurant._id),

          restaurantName: restaurantB.restaurant.name,
        },
      ];

      segments = [
        createRouteSegment({
          from: {
            type: "restaurant",

            restaurantId: String(restaurantA.restaurant._id),

            name: restaurantA.restaurant.name,
          },

          to: {
            type: "restaurant",

            restaurantId: String(restaurantB.restaurant._id),

            name: restaurantB.restaurant.name,
          },

          routeData: aToB,
        }),

        createRouteSegment({
          from: {
            type: "restaurant",

            restaurantId: String(restaurantB.restaurant._id),

            name: restaurantB.restaurant.name,
          },

          to: {
            type: "customer",

            addressId: String(customerAddress._id),

            address: formatSavedAddress(customerAddress),
          },

          routeData: bToCustomer,
        }),
      ];
    }

    // B -> A -> CUSTOMER
    else {
      selectedDistanceKm = routeBADistance;

      selectedDurationMinutes = routeBADuration;

      pickupOrder = [
        {
          restaurantId: String(restaurantB.restaurant._id),

          restaurantName: restaurantB.restaurant.name,
        },

        {
          restaurantId: String(restaurantA.restaurant._id),

          restaurantName: restaurantA.restaurant.name,
        },
      ];

      segments = [
        createRouteSegment({
          from: {
            type: "restaurant",

            restaurantId: String(restaurantB.restaurant._id),

            name: restaurantB.restaurant.name,
          },

          to: {
            type: "restaurant",

            restaurantId: String(restaurantA.restaurant._id),

            name: restaurantA.restaurant.name,
          },

          routeData: bToA,
        }),

        createRouteSegment({
          from: {
            type: "restaurant",

            restaurantId: String(restaurantA.restaurant._id),

            name: restaurantA.restaurant.name,
          },

          to: {
            type: "customer",

            addressId: String(customerAddress._id),

            address: formatSavedAddress(customerAddress),
          },

          routeData: aToCustomer,
        }),
      ];
    }

    // CALCULATE PRICING

    const pricing = calculateOrderPricing({
      subtotal,

      distanceKm: selectedDistanceKm,
    });

    // RESPONSE

    return res.status(200).json({
      bundle: true,

      restaurantCount: 2,

      pickupOrder,

      route: {
        distanceKm: roundRouteValue(selectedDistanceKm, 2),

        durationMinutes: Math.ceil(selectedDurationMinutes),

        segments,
      },

      pricing,
    });
  } catch (error) {
    console.error("GET DELIVERY QUOTE ERROR:", error);

    return res.status(500).json({
      message: "Server error while calculating checkout delivery pricing.",
    });
  }
};

// EXPORTS

module.exports = {
  getRestaurantRoute,

  getRestaurantDistances,

  getDeliveryQuote,
};
