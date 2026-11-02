// ======================================
// IMPORTS
// ======================================

const mongoose = require("mongoose");

const MenuItem = require("../models/menuItem");

const Restaurant = require("../models/restaurant");

// ======================================
// HELPERS
// ======================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const isValidWholeNumber = (value) => {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
};

// ======================================
// FIND RESTAURANT OWNED BY LOGGED-IN USER
// ======================================

const getOwnedRestaurant = async (restaurantId, userId) => {
  if (!isValidObjectId(restaurantId)) {
    return null;
  }

  return Restaurant.findOne({
    _id: restaurantId,
    owner_id: userId,
  });
};

// ======================================
// FIND MENU ITEM AND CHECK OWNERSHIP
// ======================================

const getOwnedMenuItem = async (menuItemId, userId) => {
  if (!isValidObjectId(menuItemId)) {
    return {
      item: null,
      restaurant: null,
    };
  }

  const item = await MenuItem.findById(menuItemId);

  if (!item) {
    return {
      item: null,
      restaurant: null,
    };
  }

  const restaurant = await Restaurant.findOne({
    _id: item.restaurant_id,
    owner_id: userId,
  });

  if (!restaurant) {
    return {
      item: null,
      restaurant: null,
    };
  }

  return {
    item,
    restaurant,
  };
};

// ======================================
// CREATE MENU ITEM
// ======================================

const createMenuItem = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // Restaurant selected on frontend
    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    // ======================================
    // CHECK RESTAURANT BELONGS TO USER
    // ======================================

    const restaurant = await getOwnedRestaurant(restaurant_id, userId);

    if (!restaurant) {
      return res.status(403).json({
        message: "You do not have access to this restaurant.",
      });
    }

    // ======================================
    // COPY REQUEST DATA
    // ======================================

    const menuItemData = {
      ...req.body,
    };

    // Use verified restaurant ID
    menuItemData.restaurant_id = restaurant._id;

    // ======================================
    // VALIDATE STOCK
    // ======================================

    if (menuItemData.stock_quantity !== undefined) {
      if (!isValidWholeNumber(menuItemData.stock_quantity)) {
        return res.status(400).json({
          message:
            "Stock quantity must be a whole number greater than or equal to 0.",
        });
      }

      menuItemData.stock_quantity = Number(menuItemData.stock_quantity);
    }

    // ======================================
    // VALIDATE LOW STOCK THRESHOLD
    // ======================================

    if (menuItemData.low_stock_threshold !== undefined) {
      if (!isValidWholeNumber(menuItemData.low_stock_threshold)) {
        return res.status(400).json({
          message:
            "Low stock threshold must be a whole number greater than or equal to 0.",
        });
      }

      menuItemData.low_stock_threshold = Number(
        menuItemData.low_stock_threshold,
      );
    }

    // ======================================
    // AUTOMATIC AVAILABILITY
    // ======================================

    if (
      menuItemData.track_stock === true &&
      Number(menuItemData.stock_quantity || 0) === 0
    ) {
      menuItemData.available = false;
    }

    // ======================================
    // CREATE
    // ======================================

    const item = await MenuItem.create(menuItemData);

    await item.populate("restaurant_id");

    return res.status(201).json(item);
  } catch (error) {
    console.error("CREATE MENU ITEM ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid restaurant or menu item data.",
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to create menu item.",
    });
  }
};

// ======================================
// GET ALL MENU ITEMS
// CUSTOMER SIDE
// ======================================

const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().populate("restaurant_id").sort({
      createdAt: -1,
    });

    return res.status(200).json(items);
  } catch (error) {
    console.error("GET MENU ITEMS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to load menu items.",
    });
  }
};

// ======================================
// GET LOGGED-IN OWNER'S MENU ITEMS
// ======================================

const getMyMenuItems = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // Optional:
    // /api/menuItems/my-menu?restaurant_id=xxxx

    const { restaurant_id } = req.query;

    // ======================================
    // ONE SELECTED RESTAURANT
    // ======================================

    if (restaurant_id) {
      const restaurant = await getOwnedRestaurant(restaurant_id, userId);

      if (!restaurant) {
        return res.status(403).json({
          message: "You do not have access to this restaurant.",
        });
      }

      const menuItems = await MenuItem.find({
        restaurant_id: restaurant._id,
      })
        .populate("restaurant_id")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        restaurant,
        menuItems,
      });
    }

    // ======================================
    // ALL RESTAURANTS OWNED BY USER
    // ======================================

    const restaurants = await Restaurant.find({
      owner_id: userId,
    });

    const restaurantIds = restaurants.map((restaurant) => restaurant._id);

    const menuItems = await MenuItem.find({
      restaurant_id: {
        $in: restaurantIds,
      },
    })
      .populate("restaurant_id")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      restaurants,
      menuItems,
    });
  } catch (error) {
    console.error("GET MY MENU ITEMS ERROR:", error);

    return res.status(500).json({
      message: "Failed to load restaurant menu.",
    });
  }
};

// ======================================
// GET ONE MENU ITEM
// CUSTOMER SIDE
// ======================================

const getMenuItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const item = await MenuItem.findById(req.params.id).populate(
      "restaurant_id",
    );

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("GET MENU ITEM ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to load menu item.",
    });
  }
};

// ======================================
// UPDATE MENU ITEM
// ======================================

const updateMenuItem = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    // ======================================
    // CHECK OWNERSHIP
    // ======================================

    const { item: existingItem, restaurant } = await getOwnedMenuItem(
      req.params.id,
      userId,
    );

    if (!existingItem || !restaurant) {
      return res.status(404).json({
        message: "Menu item not found for your restaurants.",
      });
    }

    const updateData = {
      ...req.body,
    };

    // Don't allow item to be moved to another
    // restaurant through this update endpoint.
    delete updateData.restaurant_id;

    // ======================================
    // VALIDATE STOCK
    // ======================================

    if (updateData.stock_quantity !== undefined) {
      if (!isValidWholeNumber(updateData.stock_quantity)) {
        return res.status(400).json({
          message:
            "Stock quantity must be a whole number greater than or equal to 0.",
        });
      }

      updateData.stock_quantity = Number(updateData.stock_quantity);
    }

    // ======================================
    // VALIDATE LOW STOCK
    // ======================================

    if (updateData.low_stock_threshold !== undefined) {
      if (!isValidWholeNumber(updateData.low_stock_threshold)) {
        return res.status(400).json({
          message:
            "Low stock threshold must be a whole number greater than or equal to 0.",
        });
      }

      updateData.low_stock_threshold = Number(updateData.low_stock_threshold);
    }

    const trackStock =
      updateData.track_stock !== undefined
        ? updateData.track_stock
        : existingItem.track_stock;

    const stockQuantity =
      updateData.stock_quantity !== undefined
        ? updateData.stock_quantity
        : existingItem.stock_quantity;

    if (trackStock === true && Number(stockQuantity) === 0) {
      updateData.available = false;
    }

    // ======================================
    // UPDATE
    // ======================================

    const item = await MenuItem.findOneAndUpdate(
      {
        _id: existingItem._id,
        restaurant_id: restaurant._id,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("restaurant_id");

    return res.status(200).json(item);
  } catch (error) {
    console.error("UPDATE MENU ITEM ERROR:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to update menu item.",
    });
  }
};

// ======================================
// UPDATE STOCK
// ======================================

const updateStock = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const { item, restaurant } = await getOwnedMenuItem(req.params.id, userId);

    if (!item || !restaurant) {
      return res.status(404).json({
        message: "Menu item not found for your restaurants.",
      });
    }

    const { stock_quantity, low_stock_threshold, track_stock } = req.body;

    if (track_stock !== undefined) {
      if (typeof track_stock !== "boolean") {
        return res.status(400).json({
          message: "track_stock must be true or false.",
        });
      }

      item.track_stock = track_stock;
    }

    if (stock_quantity !== undefined) {
      if (!isValidWholeNumber(stock_quantity)) {
        return res.status(400).json({
          message:
            "Stock quantity must be a whole number greater than or equal to 0.",
        });
      }

      item.stock_quantity = Number(stock_quantity);
    }

    if (low_stock_threshold !== undefined) {
      if (!isValidWholeNumber(low_stock_threshold)) {
        return res.status(400).json({
          message:
            "Low stock threshold must be a whole number greater than or equal to 0.",
        });
      }

      item.low_stock_threshold = Number(low_stock_threshold);
    }

    if (item.track_stock && item.stock_quantity === 0) {
      item.available = false;
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      menuItem: item,
    });
  } catch (error) {
    console.error("UPDATE STOCK ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to update inventory.",
    });
  }
};

// ======================================
// INCREASE STOCK
// ======================================

const increaseStock = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const amount = Number(req.body.amount ?? 1);

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Stock increase amount must be a whole number greater than 0.",
      });
    }

    const { item: existingItem, restaurant } = await getOwnedMenuItem(
      req.params.id,
      userId,
    );

    if (!existingItem || !restaurant) {
      return res.status(404).json({
        message: "Menu item not found for your restaurants.",
      });
    }

    if (!existingItem.track_stock) {
      existingItem.track_stock = true;

      await existingItem.save();
    }

    const item = await MenuItem.findOneAndUpdate(
      {
        _id: existingItem._id,
        restaurant_id: restaurant._id,
      },
      {
        $inc: {
          stock_quantity: amount,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: `Stock increased by ${amount}.`,
      menuItem: item,
    });
  } catch (error) {
    console.error("INCREASE STOCK ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to increase stock.",
    });
  }
};

// ======================================
// DECREASE STOCK
// ======================================

const decreaseStock = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const amount = Number(req.body.amount ?? 1);

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Stock decrease amount must be a whole number greater than 0.",
      });
    }

    const { item: existingItem, restaurant } = await getOwnedMenuItem(
      req.params.id,
      userId,
    );

    if (!existingItem || !restaurant) {
      return res.status(404).json({
        message: "Menu item not found for your restaurants.",
      });
    }

    if (!existingItem.track_stock) {
      return res.status(400).json({
        message: "Stock tracking is not enabled for this menu item.",
      });
    }

    if (existingItem.stock_quantity < amount) {
      return res.status(400).json({
        message: `Only ${existingItem.stock_quantity} item(s) are currently available.`,
      });
    }

    const item = await MenuItem.findOneAndUpdate(
      {
        _id: existingItem._id,
        restaurant_id: restaurant._id,

        stock_quantity: {
          $gte: amount,
        },
      },
      {
        $inc: {
          stock_quantity: -amount,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!item) {
      return res.status(400).json({
        message:
          "There is not enough stock available to complete this operation.",
      });
    }

    if (item.stock_quantity === 0) {
      item.available = false;

      await item.save();
    }

    return res.status(200).json({
      success: true,
      message: `Stock decreased by ${amount}.`,
      menuItem: item,
    });
  } catch (error) {
    console.error("DECREASE STOCK ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to decrease stock.",
    });
  }
};

// ======================================
// DELETE MENU ITEM
// ======================================

const deleteMenuItem = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const { item: existingItem, restaurant } = await getOwnedMenuItem(
      req.params.id,
      userId,
    );

    if (!existingItem || !restaurant) {
      return res.status(404).json({
        message: "Menu item not found for your restaurants.",
      });
    }

    await MenuItem.deleteOne({
      _id: existingItem._id,
      restaurant_id: restaurant._id,
    });

    return res.status(200).json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE MENU ITEM ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to delete menu item.",
    });
  }
};

// ======================================
// SEARCH MENU ITEMS
// CUSTOMER SIDE
// ======================================

const searchMenuItems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        message: "Search term is required",
      });
    }

    const items = await MenuItem.find({
      name: {
        $regex: q.trim(),
        $options: "i",
      },
    }).populate("restaurant_id");

    return res.status(200).json(items);
  } catch (error) {
    console.error("SEARCH MENU ITEMS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to search menu items.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  createMenuItem,

  getMenuItems,

  getMyMenuItems,

  getMenuItem,

  updateMenuItem,

  deleteMenuItem,

  searchMenuItems,

  updateStock,

  increaseStock,

  decreaseStock,
};
