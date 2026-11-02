// ======================================
// DEBUG FILE LOCATION
// ======================================

console.log("LOADING SEARCH CONTROLLER:", __filename);

// ======================================
// IMPORTS
// ======================================

const Restaurant = require("../models/restaurant");

const MenuItem = require("../models/menuItem");

// ======================================
// ESCAPE REGEX
// ======================================

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ======================================
// GLOBAL SEARCH
// ======================================

const globalSearch = async (req, res) => {
  try {
    // ======================================
    // GET SEARCH QUERY
    // ======================================

    const searchTerm = String(req.query.q || "").trim();

    // ======================================
    // EMPTY SEARCH
    // ======================================

    if (!searchTerm) {
      return res.status(200).json({
        query: "",

        restaurants: [],

        menuItems: [],

        suggestions: [],
      });
    }

    // ======================================
    // REQUIRE AT LEAST 2 CHARACTERS
    // ======================================

    if (searchTerm.length < 2) {
      return res.status(200).json({
        query: searchTerm,

        restaurants: [],

        menuItems: [],

        suggestions: [],
      });
    }

    // ======================================
    // RESULT LIMIT
    // ======================================

    const requestedLimit = Number(req.query.limit || 8);

    const limit = Math.min(Math.max(requestedLimit, 1), 20);

    // ======================================
    // SAFE SEARCH REGEX
    // ======================================

    const regex = new RegExp(escapeRegex(searchTerm), "i");

    // ======================================
    // SEARCH RESTAURANTS
    // AND MENU ITEMS
    // ======================================

    const [restaurants, menuItems] = await Promise.all([
      // ======================================
      // RESTAURANTS
      // ======================================

      Restaurant.find({
        $or: [
          {
            name: regex,
          },

          {
            address: regex,
          },
        ],
      })
        .select("name address phone image_url")
        .limit(limit)
        .lean(),

      // ======================================
      // MENU ITEMS
      // ======================================

      MenuItem.find({
        $and: [
          {
            $or: [
              {
                name: regex,
              },

              {
                category: regex,
              },

              {
                description: regex,
              },
            ],
          },

          {
            available: {
              $ne: false,
            },
          },
        ],
      })
        .populate("restaurant_id", "name address image_url")
        .limit(limit)
        .lean(),
    ]);

    // ======================================
    // RESTAURANT SUGGESTIONS
    // ======================================

    const restaurantSuggestions = restaurants.map((restaurant) => ({
      type: "restaurant",

      id: restaurant._id,

      label: restaurant.name,

      subtitle: restaurant.address,

      image_url: restaurant.image_url,
    }));

    // ======================================
    // MENU ITEM SUGGESTIONS
    // ======================================

    const menuItemSuggestions = menuItems.map((item) => ({
      type: "menuItem",

      id: item._id,

      label: item.name,

      subtitle: item.restaurant_id
        ? `${item.category} • ${item.restaurant_id.name}`
        : item.category,

      restaurant_id: item.restaurant_id?._id || null,

      image_url: item.image_url,

      price: item.price,
    }));

    // ======================================
    // COMBINE SUGGESTIONS
    // ======================================

    const suggestions = [
      ...restaurantSuggestions,
      ...menuItemSuggestions,
    ].slice(0, limit);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      query: searchTerm,

      restaurants,

      menuItems,

      suggestions,
    });
  } catch (error) {
    console.error("GLOBAL SEARCH ERROR:", error);

    return res.status(500).json({
      message: "Server error while searching.",
    });
  }
};

// ======================================
// DEBUG BEFORE EXPORT
// ======================================

console.log("globalSearch BEFORE EXPORT:", typeof globalSearch);

// ======================================
// EXPORT
// ======================================

module.exports = {
  globalSearch,
};

// ======================================
// DEBUG EXPORT
// ======================================

console.log("SEARCH CONTROLLER EXPORT:", module.exports);
