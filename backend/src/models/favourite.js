const mongoose = require("mongoose");

const FavouriteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

FavouriteSchema.index(
  {
    user_id: 1,
    restaurant_id: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Favourite", FavouriteSchema);
