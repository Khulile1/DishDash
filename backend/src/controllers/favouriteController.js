const Favourite = require("../models/favourite");

// ======================================
// GET MY FAVOURITES
// ======================================

exports.getMyFavourites = async (req, res) => {
  try {
    const favourites = await Favourite.find({
      user_id: req.user.id,
    }).populate("restaurant_id");

    res.status(200).json({
      favourites,
    });
  } catch (error) {
    console.error("Get favourites error:", error);

    res.status(500).json({
      message: "Could not load favourites.",
    });
  }
};

// ======================================
// ADD FAVOURITE
// ======================================

exports.addFavourite = async (req, res) => {
  try {
    const { restaurantId } = req.body;

    const favourite = await Favourite.findOneAndUpdate(
      {
        user_id: req.user.id,
        restaurant_id: restaurantId,
      },
      {
        user_id: req.user.id,
        restaurant_id: restaurantId,
      },
      {
        upsert: true,
        new: true,
      },
    );

    res.status(200).json({
      favourite,
    });
  } catch (error) {
    console.error("Add favourite error:", error);

    res.status(500).json({
      message: "Could not save favourite.",
    });
  }
};

// ======================================
// REMOVE FAVOURITE
// ======================================

exports.removeFavourite = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    await Favourite.findOneAndDelete({
      user_id: req.user.id,
      restaurant_id: restaurantId,
    });

    res.status(200).json({
      message: "Favourite removed.",
    });
  } catch (error) {
    console.error("Remove favourite error:", error);

    res.status(500).json({
      message: "Could not remove favourite.",
    });
  }
};
