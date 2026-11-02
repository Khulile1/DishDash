// ======================================
// IMPORTS
// ======================================

const Restaurant = require("../models/restaurant");

const MenuItem = require("../models/menuItem");

// ======================================
// RESTAURANT CATEGORIES
// ======================================
//
// These values MUST match the values
// inside models/restaurant.js.
//
// Customer labels:
//
// fast-food = Fast Food
// african   = African
// grill     = Braai & Grill
// italian   = Italian
// seafood   = Seafood
// ======================================

const RESTAURANT_CATEGORIES = [
  "fast-food",
  "african",
  "grill",
  "italian",
  "seafood",
];

// ======================================
// BUILD SAFE RESTAURANT DATA
// ======================================
//
// Only fields listed here can be written
// by the restaurant owner.
//
// owner_id is NEVER accepted from req.body.
// It comes from the logged-in JWT user.
// ======================================

const buildRestaurantPayload = (body = {}) => {
  const payload = {};

  // ======================================
  // NAME
  // ======================================

  if (body.name !== undefined) {
    payload.name = String(body.name).trim();
  }

  // ======================================
  // RESTAURANT CATEGORY
  // ======================================

  if (body.category !== undefined) {
    payload.category = String(body.category).trim().toLowerCase();
  }

  // ======================================
  // STREET ADDRESS
  // ======================================

  if (body.street_address !== undefined) {
    payload.street_address = String(body.street_address).trim();
  }

  // ======================================
  // SUBURB
  // ======================================

  if (body.suburb !== undefined) {
    payload.suburb = String(body.suburb).trim();
  }

  // ======================================
  // CITY
  // ======================================

  if (body.city !== undefined) {
    payload.city = String(body.city).trim();
  }

  // ======================================
  // PROVINCE
  // ======================================

  if (body.province !== undefined) {
    payload.province = String(body.province).trim();
  }

  // ======================================
  // POSTAL CODE
  // ======================================

  if (body.postal_code !== undefined) {
    payload.postal_code = String(body.postal_code).trim();
  }

  // ======================================
  // COUNTRY
  // ======================================

  if (body.country !== undefined) {
    payload.country = String(body.country).trim();
  }

  // ======================================
  // LATITUDE
  // ======================================

  if (body.latitude !== undefined) {
    payload.latitude = Number(body.latitude);
  }

  // ======================================
  // LONGITUDE
  // ======================================

  if (body.longitude !== undefined) {
    payload.longitude = Number(body.longitude);
  }

  // ======================================
  // GEOAPIFY PLACE ID
  // ======================================

  if (body.geoapify_place_id !== undefined) {
    payload.geoapify_place_id = body.geoapify_place_id
      ? String(body.geoapify_place_id).trim()
      : null;
  }

  // ======================================
  // FORMATTED ADDRESS
  // ======================================

  if (body.formatted_address !== undefined) {
    payload.formatted_address = String(body.formatted_address).trim();
  }

  // ======================================
  // PHONE
  // ======================================

  if (body.phone !== undefined) {
    // Example:
    //
    // 082 123 4567
    //
    // becomes:
    //
    // 0821234567

    payload.phone = String(body.phone).replace(/\D/g, "");
  }

  // ======================================
  // OPENING TIME
  // ======================================

  if (body.opening_time !== undefined) {
    payload.opening_time = String(body.opening_time).trim();
  }

  // ======================================
  // CLOSING TIME
  // ======================================

  if (body.closing_time !== undefined) {
    payload.closing_time = String(body.closing_time).trim();
  }

  // ======================================
  // IMAGE
  // ======================================

  if (body.image_url !== undefined) {
    payload.image_url = String(body.image_url).trim();
  }

  return payload;
};

// ======================================
// VALIDATE RESTAURANT CATEGORY
// ======================================

const validateRestaurantCategory = (category) => {
  const value = String(category || "")
    .trim()
    .toLowerCase();

  return RESTAURANT_CATEGORIES.includes(value);
};

// ======================================
// VALIDATE COORDINATES
// ======================================

const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);

  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      valid: false,

      message: "Valid latitude and longitude are required.",
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,

      message: "Latitude must be between -90 and 90.",
    };
  }

  if (lon < -180 || lon > 180) {
    return {
      valid: false,

      message: "Longitude must be between -180 and 180.",
    };
  }

  return {
    valid: true,

    latitude: lat,

    longitude: lon,
  };
};

// ======================================
// VALIDATE PHONE
// ======================================

const validatePhone = (phone) => {
  return /^\d{10}$/.test(String(phone || ""));
};

// ======================================
// VALIDATE OPERATING TIME
// ======================================

const validateOperatingTime = (timeValue) => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(timeValue || ""));
};

// ======================================
// CREATE RESTAURANT
// ======================================

const createRestaurant = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to create a restaurant.",
      });
    }

    // ======================================
    // BUILD SAFE DATA
    // ======================================

    const restaurantData = buildRestaurantPayload(req.body);

    // ======================================
    // NAME
    // ======================================

    if (!restaurantData.name) {
      return res.status(400).json({
        message: "Restaurant name is required.",
      });
    }

    // ======================================
    // RESTAURANT CATEGORY
    // ======================================

    if (!restaurantData.category) {
      return res.status(400).json({
        message: "Restaurant category is required.",
      });
    }

    if (!validateRestaurantCategory(restaurantData.category)) {
      return res.status(400).json({
        message:
          "Restaurant category must be Fast Food, African, Braai & Grill, Italian or Seafood.",
      });
    }

    // ======================================
    // REQUIRED ADDRESS FIELDS
    // ======================================

    if (
      !restaurantData.street_address ||
      !restaurantData.suburb ||
      !restaurantData.city ||
      !restaurantData.province
    ) {
      return res.status(400).json({
        message: "Street address, suburb, city and province are required.",
      });
    }

    // ======================================
    // FORMATTED ADDRESS
    // ======================================

    if (!restaurantData.formatted_address) {
      return res.status(400).json({
        message: "Please select a valid restaurant address.",
      });
    }

    // ======================================
    // PHONE
    // ======================================

    if (!restaurantData.phone) {
      return res.status(400).json({
        message: "Restaurant phone number is required.",
      });
    }

    if (!validatePhone(restaurantData.phone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    // ======================================
    // OPERATING HOURS
    // ======================================

    if (!restaurantData.opening_time) {
      restaurantData.opening_time = "08:00";
    }

    if (!restaurantData.closing_time) {
      restaurantData.closing_time = "20:00";
    }

    if (!validateOperatingTime(restaurantData.opening_time)) {
      return res.status(400).json({
        message: "Opening time must use HH:mm format.",
      });
    }

    if (!validateOperatingTime(restaurantData.closing_time)) {
      return res.status(400).json({
        message: "Closing time must use HH:mm format.",
      });
    }

    // ======================================
    // IMAGE
    // ======================================

    if (!restaurantData.image_url) {
      return res.status(400).json({
        message: "Restaurant image is required.",
      });
    }

    // ======================================
    // COORDINATES
    // ======================================

    const coordinateCheck = validateCoordinates(
      restaurantData.latitude,

      restaurantData.longitude,
    );

    if (!coordinateCheck.valid) {
      return res.status(400).json({
        message: coordinateCheck.message,
      });
    }

    restaurantData.latitude = coordinateCheck.latitude;

    restaurantData.longitude = coordinateCheck.longitude;

    // ======================================
    // OWNER FROM JWT
    // ======================================

    restaurantData.owner_id = userId;

    // ======================================
    // CREATE RESTAURANT
    // ======================================

    const restaurant = await Restaurant.create(restaurantData);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(201).json(restaurant);
  } catch (error) {
    console.error("CREATE RESTAURANT ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Server error while creating restaurant.",
    });
  }
};

// ======================================
// GET ALL RESTAURANTS
// CUSTOMER SIDE
// ======================================
//
// Supports:
//
// GET /api/restaurants
//
// GET /api/restaurants?category=african
//
// GET /api/restaurants?category=grill
//
// GET /api/restaurants?category=seafood
//
// category=all returns everything.
// ======================================

const getRestaurants = async (req, res) => {
  try {
    // ======================================
    // CATEGORY QUERY
    // ======================================

    const category = String(req.query?.category || "")
      .trim()
      .toLowerCase();

    // ======================================
    // DATABASE FILTER
    // ======================================

    const filter = {};

    // ======================================
    // FILTER BY CATEGORY
    // ======================================

    if (category && category !== "all") {
      if (!validateRestaurantCategory(category)) {
        return res.status(400).json({
          message: "Invalid restaurant category.",
        });
      }

      filter.category = category;
    }

    // ======================================
    // FIND
    // ======================================

    const restaurants = await Restaurant.find(filter).sort({
      createdAt: -1,
    });

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("GET RESTAURANTS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Server error while loading restaurants.",
    });
  }
};

// ======================================
// GET LOGGED-IN OWNER'S RESTAURANTS
// ======================================

const getMyRestaurants = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // ======================================
    // FIND OWNER'S RESTAURANTS
    // ======================================

    const restaurants = await Restaurant.find({
      owner_id: userId,
    }).sort({
      createdAt: -1,
    });

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("GET MY RESTAURANTS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Server error while loading your restaurants.",
    });
  }
};

// ======================================
// GET ONE RESTAURANT
// CUSTOMER SIDE
// ======================================

const getRestaurant = async (req, res) => {
  try {
    // ======================================
    // FIND RESTAURANT
    // ======================================

    const restaurant = await Restaurant.findById(req.params.id);

    // ======================================
    // NOT FOUND
    // ======================================

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(restaurant);
  } catch (error) {
    console.error("GET RESTAURANT ERROR:", error);

    // ======================================
    // INVALID ID
    // ======================================

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid restaurant ID",
      });
    }

    return res.status(500).json({
      message: error.message || "Server error while loading restaurant.",
    });
  }
};

// ======================================
// UPDATE RESTAURANT
// OWNER ONLY
// ======================================

const updateRestaurant = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // ======================================
    // FIND EXISTING RESTAURANT
    // ======================================

    const existingRestaurant = await Restaurant.findOne({
      _id: req.params.id,

      owner_id: userId,
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found or you do not own this restaurant.",
      });
    }

    // ======================================
    // BUILD SAFE UPDATE
    // ======================================

    const updateData = buildRestaurantPayload(req.body);

    // ======================================
    // CATEGORY VALIDATION
    // ======================================

    const finalCategory =
      updateData.category !== undefined
        ? updateData.category
        : existingRestaurant.category;

    // Existing restaurants created before
    // categories were added must choose
    // a category the next time they save.

    if (!finalCategory) {
      return res.status(400).json({
        message: "Please choose a restaurant category.",
      });
    }

    if (!validateRestaurantCategory(finalCategory)) {
      return res.status(400).json({
        message:
          "Restaurant category must be Fast Food, African, Braai & Grill, Italian or Seafood.",
      });
    }

    // ======================================
    // PHONE VALIDATION
    // ======================================

    if (updateData.phone !== undefined && !validatePhone(updateData.phone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    // ======================================
    // OPENING TIME VALIDATION
    // ======================================

    if (
      updateData.opening_time !== undefined &&
      !validateOperatingTime(updateData.opening_time)
    ) {
      return res.status(400).json({
        message: "Opening time must use HH:mm format.",
      });
    }

    // ======================================
    // CLOSING TIME VALIDATION
    // ======================================

    if (
      updateData.closing_time !== undefined &&
      !validateOperatingTime(updateData.closing_time)
    ) {
      return res.status(400).json({
        message: "Closing time must use HH:mm format.",
      });
    }

    // ======================================
    // CHECK ADDRESS CHANGE
    // ======================================

    const addressChanged =
      updateData.street_address !== undefined ||
      updateData.suburb !== undefined ||
      updateData.city !== undefined ||
      updateData.province !== undefined ||
      updateData.postal_code !== undefined ||
      updateData.formatted_address !== undefined ||
      updateData.geoapify_place_id !== undefined;

    // ======================================
    // ADDRESS CHANGE REQUIRES
    // LATITUDE + LONGITUDE
    // ======================================

    if (addressChanged) {
      if (
        updateData.latitude === undefined ||
        updateData.longitude === undefined
      ) {
        return res.status(400).json({
          message:
            "Latitude and longitude are required when changing the restaurant address.",
        });
      }
    }

    // ======================================
    // VALIDATE COORDINATES
    // ======================================

    if (
      updateData.latitude !== undefined ||
      updateData.longitude !== undefined
    ) {
      const latitude = updateData.latitude ?? existingRestaurant.latitude;

      const longitude = updateData.longitude ?? existingRestaurant.longitude;

      const coordinateCheck = validateCoordinates(
        latitude,

        longitude,
      );

      if (!coordinateCheck.valid) {
        return res.status(400).json({
          message: coordinateCheck.message,
        });
      }

      updateData.latitude = coordinateCheck.latitude;

      updateData.longitude = coordinateCheck.longitude;
    }

    // ======================================
    // UPDATE
    // ======================================

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        _id: existingRestaurant._id,

        owner_id: userId,
      },

      {
        // ======================================
        // SAVE NEW DATA
        // ======================================

        $set: updateData,

        // ======================================
        // REMOVE OLD LEGACY ADDRESS FIELD
        // ======================================

        $unset: {
          address: "",
        },
      },

      {
        new: true,

        runValidators: true,
      },
    );

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(restaurant);
  } catch (error) {
    console.error("UPDATE RESTAURANT ERROR:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Server error while updating restaurant.",
    });
  }
};

// ======================================
// DELETE RESTAURANT
// OWNER ONLY
// ======================================
//
// IMPORTANT:
//
// Deleting a restaurant permanently
// deletes:
//
// 1. The restaurant
// 2. ALL MenuItem documents belonging
//    to the restaurant.
//
// Historical orders remain untouched.
// ======================================

const deleteRestaurant = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // ======================================
    // FIND RESTAURANT
    // ======================================

    const restaurant = await Restaurant.findOne({
      _id: req.params.id,

      owner_id: userId,
    });

    // ======================================
    // NOT FOUND
    // ======================================

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found or you do not own this restaurant.",
      });
    }

    // ======================================
    // SAVE DETAILS
    // ======================================

    const restaurantId = restaurant._id;

    const restaurantName = restaurant.name;

    // ======================================
    // DELETE RESTAURANT MENU ITEMS
    // ======================================

    const menuDeleteResult = await MenuItem.deleteMany({
      restaurant_id: restaurantId,
    });

    // ======================================
    // DELETE RESTAURANT
    // ======================================

    const restaurantDeleteResult = await Restaurant.deleteOne({
      _id: restaurantId,

      owner_id: userId,
    });

    // ======================================
    // VERIFY DELETE
    // ======================================

    if (restaurantDeleteResult.deletedCount !== 1) {
      return res.status(500).json({
        message:
          "Menu items were removed, but the restaurant could not be deleted.",
      });
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: `${restaurantName} and all of its menu items were deleted successfully.`,

      restaurantId: String(restaurantId),

      restaurantName,

      deletedMenuItems: menuDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error("DELETE RESTAURANT ERROR:", error);

    // ======================================
    // INVALID MONGODB ID
    // ======================================

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid restaurant ID",
      });
    }

    // ======================================
    // SERVER ERROR
    // ======================================

    return res.status(500).json({
      message:
        error.message ||
        "Server error while deleting the restaurant and its menu items.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  createRestaurant,

  getRestaurants,

  getMyRestaurants,

  getRestaurant,

  updateRestaurant,

  deleteRestaurant,
};
