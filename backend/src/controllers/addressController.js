// ======================================
// IMPORTS
// ======================================

const Address = require("../models/address");

// ======================================
// ALLOWED ADDRESS FIELDS
// ======================================

const buildAddressPayload = (body = {}) => {
  const payload = {};

  // ======================================
  // LABEL
  // ======================================

  if (body.label !== undefined) {
    payload.label = body.label;
  }

  // ======================================
  // STREET ADDRESS
  // ======================================

  if (body.street_address !== undefined) {
    payload.street_address = body.street_address;
  }

  // ======================================
  // SUBURB
  // ======================================

  if (body.suburb !== undefined) {
    payload.suburb = body.suburb;
  }

  // ======================================
  // CITY
  // ======================================

  if (body.city !== undefined) {
    payload.city = body.city;
  }

  // ======================================
  // PROVINCE
  // ======================================

  if (body.province !== undefined) {
    payload.province = body.province;
  }

  // ======================================
  // POSTAL CODE
  // ======================================

  if (body.postal_code !== undefined) {
    payload.postal_code = body.postal_code;
  }

  // ======================================
  // COUNTRY
  // ======================================

  if (body.country !== undefined) {
    payload.country = body.country;
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
    payload.geoapify_place_id = body.geoapify_place_id;
  }

  // ======================================
  // FORMATTED ADDRESS
  // ======================================

  if (body.formatted_address !== undefined) {
    payload.formatted_address = body.formatted_address;
  }

  // ======================================
  // DEFAULT ADDRESS
  // ======================================

  if (body.is_default !== undefined) {
    payload.is_default = body.is_default === true;
  }

  return payload;
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
// CREATE ADDRESS
// ======================================

const createAddress = async (req, res) => {
  try {
    // ======================================
    // CHECK AUTHENTICATED USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to create an address.",
      });
    }

    // ======================================
    // GET ALLOWED ADDRESS DATA
    // ======================================

    const addressData = buildAddressPayload(req.body);

    // ======================================
    // CHECK REQUIRED ADDRESS FIELDS
    // ======================================

    if (
      !addressData.street_address ||
      !addressData.suburb ||
      !addressData.city ||
      !addressData.province
    ) {
      return res.status(400).json({
        message: "Street address, suburb, city and province are required.",
      });
    }

    // ======================================
    // CHECK GEOAPIFY COORDINATES
    // ======================================

    const coordinateCheck = validateCoordinates(
      addressData.latitude,
      addressData.longitude,
    );

    if (!coordinateCheck.valid) {
      return res.status(400).json({
        message: coordinateCheck.message,
      });
    }

    addressData.latitude = coordinateCheck.latitude;

    addressData.longitude = coordinateCheck.longitude;

    // ======================================
    // CHECK NUMBER OF EXISTING ADDRESSES
    // ======================================

    const addressCount = await Address.countDocuments({
      user_id: userId,
    });

    // ======================================
    // DETERMINE DEFAULT ADDRESS
    // ======================================

    const shouldBeDefault =
      addressCount === 0 || addressData.is_default === true;

    // ======================================
    // REMOVE OLD DEFAULT
    // ======================================

    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user_id: userId,
        },
        {
          $set: {
            is_default: false,
          },
        },
      );
    }

    // ======================================
    // CREATE ADDRESS
    // ======================================

    const address = await Address.create({
      ...addressData,

      user_id: userId,

      is_default: shouldBeDefault,
    });

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(201).json(address);
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);

    // ======================================
    // VALIDATION ERROR
    // ======================================

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    // ======================================
    // SERVER ERROR
    // ======================================

    return res.status(500).json({
      message: "Server error while creating address.",
    });
  }
};

// ======================================
// GET ALL USER ADDRESSES
// ======================================

const getAddresses = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to view addresses.",
      });
    }

    // ======================================
    // FIND ADDRESSES
    // ======================================

    const addresses = await Address.find({
      user_id: userId,
    })
      .populate("user_id", "name email role")
      .sort({
        is_default: -1,
        createdAt: -1,
      });

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(addresses);
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);

    return res.status(500).json({
      message: "Server error while loading addresses.",
    });
  }
};

// ======================================
// GET ONE ADDRESS
// ======================================

const getAddress = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to view this address.",
      });
    }

    // ======================================
    // FIND ADDRESS
    // ======================================

    const address = await Address.findOne({
      _id: req.params.id,
      user_id: userId,
    }).populate("user_id", "name email role");

    // ======================================
    // NOT FOUND
    // ======================================

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(address);
  } catch (error) {
    console.error("GET ADDRESS ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid address ID",
      });
    }

    return res.status(500).json({
      message: "Server error while loading address.",
    });
  }
};

// ======================================
// UPDATE ADDRESS
// ======================================

const updateAddress = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to update an address.",
      });
    }

    // ======================================
    // FIND EXISTING ADDRESS
    // ======================================

    const existingAddress = await Address.findOne({
      _id: req.params.id,

      user_id: userId,
    });

    if (!existingAddress) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // ======================================
    // BUILD SAFE UPDATE DATA
    // ======================================

    const updateData = buildAddressPayload(req.body);

    // ======================================
    // CHECK WHETHER LOCATION CHANGED
    // ======================================

    const locationChanged =
      updateData.street_address !== undefined ||
      updateData.suburb !== undefined ||
      updateData.city !== undefined ||
      updateData.province !== undefined ||
      updateData.postal_code !== undefined;

    // ======================================
    // IF LOCATION CHANGES,
    // REQUIRE NEW GEOAPIFY COORDINATES
    // ======================================

    if (locationChanged) {
      if (
        updateData.latitude === undefined ||
        updateData.longitude === undefined
      ) {
        return res.status(400).json({
          message:
            "Latitude and longitude are required when changing the address location.",
        });
      }
    }

    // ======================================
    // VALIDATE COORDINATES IF PROVIDED
    // ======================================

    if (
      updateData.latitude !== undefined ||
      updateData.longitude !== undefined
    ) {
      const latitude = updateData.latitude ?? existingAddress.latitude;

      const longitude = updateData.longitude ?? existingAddress.longitude;

      const coordinateCheck = validateCoordinates(latitude, longitude);

      if (!coordinateCheck.valid) {
        return res.status(400).json({
          message: coordinateCheck.message,
        });
      }

      updateData.latitude = coordinateCheck.latitude;

      updateData.longitude = coordinateCheck.longitude;
    }

    // ======================================
    // NEW DEFAULT ADDRESS
    // ======================================

    if (updateData.is_default === true) {
      await Address.updateMany(
        {
          user_id: userId,

          _id: {
            $ne: existingAddress._id,
          },
        },
        {
          $set: {
            is_default: false,
          },
        },
      );
    }

    // ======================================
    // UPDATE ADDRESS
    // ======================================

    const address = await Address.findOneAndUpdate(
      {
        _id: existingAddress._id,

        user_id: userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,

        runValidators: true,
      },
    );

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json(address);
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error while updating address.",
    });
  }
};

// ======================================
// DELETE ADDRESS
// ======================================

const deleteAddress = async (req, res) => {
  try {
    // ======================================
    // CHECK USER
    // ======================================

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to delete an address.",
      });
    }

    // ======================================
    // DELETE ADDRESS
    // ======================================

    const address = await Address.findOneAndDelete({
      _id: req.params.id,

      user_id: userId,
    });

    // ======================================
    // ADDRESS NOT FOUND
    // ======================================

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // ======================================
    // IF DEFAULT WAS DELETED,
    // SELECT ANOTHER DEFAULT
    // ======================================

    if (address.is_default) {
      const nextAddress = await Address.findOne({
        user_id: userId,
      }).sort({
        createdAt: -1,
      });

      if (nextAddress) {
        nextAddress.is_default = true;

        await nextAddress.save();
      }
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid address ID",
      });
    }

    return res.status(500).json({
      message: "Server error while deleting address.",
    });
  }
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  createAddress,

  getAddresses,

  getAddress,

  updateAddress,

  deleteAddress,
};
