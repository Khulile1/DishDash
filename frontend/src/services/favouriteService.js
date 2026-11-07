// ======================================
// FAVOURITE RESTAURANT SERVICE
// ======================================
//
// Favourites are stored per logged-in user.
//
// Example:
//
// favouriteRestaurants:USER_1
// favouriteRestaurants:USER_2
//
// This prevents users on the same browser
// from sharing the same favourites.
//
// NOTE:
// This is client-side separation only.
// For production and cross-device favourites,
// storing them in MongoDB is recommended.
// ======================================

// ======================================
// STORAGE SETTINGS
// ======================================

const FAVOURITES_PREFIX = "favouriteRestaurants";

// ======================================
// SAFE JSON PARSE
// ======================================

const safeJsonParse = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// ======================================
// DECODE JWT PAYLOAD
// ======================================
//
// Used only to identify the logged-in user
// for localStorage separation.
//
// This does NOT replace backend auth.
// ======================================

const decodeJwtPayload = (token) => {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Add missing Base64 padding.
    while (payload.length % 4) {
      payload += "=";
    }

    const decoded = decodeURIComponent(
      window
        .atob(payload)
        .split("")
        .map(
          (character) =>
            "%" + character.charCodeAt(0).toString(16).padStart(2, "0"),
        )
        .join(""),
    );

    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to decode authentication token:", error);

    return null;
  }
};

// ======================================
// GET USER ID FROM OBJECT
// ======================================

const extractUserId = (user) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const possibleId =
    user._id || user.id || user.userId || user.user_id || user.sub;

  if (!possibleId) {
    return null;
  }

  return String(possibleId);
};

// ======================================
// GET CURRENT LOGGED-IN USER ID
// ======================================
//
// Tries common localStorage user keys first,
// then common JWT token keys.
// ======================================

export const getCurrentFavouriteUserId = () => {
  try {
    // ======================================
    // TRY SAVED USER OBJECTS
    // ======================================

    const userStorageKeys = ["user", "currentUser", "authUser", "loggedInUser"];

    for (const key of userStorageKeys) {
      const savedUser = localStorage.getItem(key);

      const parsedUser = safeJsonParse(savedUser);

      const userId = extractUserId(parsedUser);

      if (userId) {
        return userId;
      }
    }

    // ======================================
    // TRY JWT TOKENS
    // ======================================

    const tokenStorageKeys = [
      "token",
      "accessToken",
      "access_token",
      "authToken",
    ];

    for (const key of tokenStorageKeys) {
      const token = localStorage.getItem(key);

      if (!token) {
        continue;
      }

      const payload = decodeJwtPayload(token);

      const userId = extractUserId(payload);

      if (userId) {
        return userId;
      }
    }

    // ======================================
    // NO LOGGED-IN USER FOUND
    // ======================================

    return null;
  } catch (error) {
    console.error("Failed to identify logged-in user:", error);

    return null;
  }
};

// ======================================
// GET USER-SPECIFIC FAVOURITES KEY
// ======================================

const getFavouritesStorageKey = () => {
  const userId = getCurrentFavouriteUserId();

  if (!userId) {
    return null;
  }

  return `${FAVOURITES_PREFIX}:${userId}`;
};

// ======================================
// DISPATCH FAVOURITES CHANGED EVENT
// ======================================

const dispatchFavouritesChanged = (favourites) => {
  window.dispatchEvent(
    new CustomEvent("favouritesChanged", {
      detail: {
        userId: getCurrentFavouriteUserId(),

        favourites,
      },
    }),
  );
};

// ======================================
// GET FAVOURITE IDS
// ======================================

export const getFavouriteRestaurantIds = () => {
  try {
    const storageKey = getFavouritesStorageKey();

    // ======================================
    // USER NOT LOGGED IN
    // ======================================

    if (!storageKey) {
      return [];
    }

    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      return [];
    }

    const favourites = safeJsonParse(saved);

    if (!Array.isArray(favourites)) {
      return [];
    }

    // ======================================
    // NORMALISE IDS
    // ======================================

    return favourites.filter(Boolean).map((id) => String(id));
  } catch (error) {
    console.error("Failed to read favourites:", error);

    return [];
  }
};

// ======================================
// SAVE FAVOURITE IDS
// ======================================

const saveFavouriteRestaurantIds = (ids) => {
  try {
    const storageKey = getFavouritesStorageKey();

    // ======================================
    // USER NOT LOGGED IN
    // ======================================

    if (!storageKey) {
      console.warn(
        "Cannot save favourites because no logged-in user was found.",
      );

      return [];
    }

    // ======================================
    // CLEAN IDS
    // ======================================

    const cleanIds = [...new Set(ids.filter(Boolean).map((id) => String(id)))];

    // ======================================
    // SAVE
    // ======================================

    localStorage.setItem(storageKey, JSON.stringify(cleanIds));

    // ======================================
    // NOTIFY OTHER COMPONENTS
    // ======================================

    dispatchFavouritesChanged(cleanIds);

    return cleanIds;
  } catch (error) {
    console.error("Failed to save favourites:", error);

    return [];
  }
};

// ======================================
// CHECK FAVOURITE
// ======================================

export const isRestaurantFavourite = (restaurantId) => {
  if (!restaurantId) {
    return false;
  }

  const favourites = getFavouriteRestaurantIds();

  return favourites.includes(String(restaurantId));
};

// ======================================
// ADD FAVOURITE
// ======================================

export const addFavouriteRestaurant = (restaurantId) => {
  // ======================================
  // USER MUST BE LOGGED IN
  // ======================================

  const userId = getCurrentFavouriteUserId();

  if (!userId) {
    console.warn("User must be logged in before saving favourites.");

    return [];
  }

  // ======================================
  // INVALID RESTAURANT ID
  // ======================================

  if (!restaurantId) {
    return getFavouriteRestaurantIds();
  }

  const id = String(restaurantId);

  const favourites = getFavouriteRestaurantIds();

  // ======================================
  // PREVENT DUPLICATES
  // ======================================

  if (!favourites.includes(id)) {
    favourites.push(id);
  }

  return saveFavouriteRestaurantIds(favourites);
};

// ======================================
// REMOVE FAVOURITE
// ======================================

export const removeFavouriteRestaurant = (restaurantId) => {
  const userId = getCurrentFavouriteUserId();

  // ======================================
  // USER NOT LOGGED IN
  // ======================================

  if (!userId) {
    return [];
  }

  // ======================================
  // INVALID RESTAURANT ID
  // ======================================

  if (!restaurantId) {
    return getFavouriteRestaurantIds();
  }

  const id = String(restaurantId);

  const favourites = getFavouriteRestaurantIds().filter(
    (favouriteId) => favouriteId !== id,
  );

  return saveFavouriteRestaurantIds(favourites);
};

// ======================================
// TOGGLE FAVOURITE
// ======================================

export const toggleFavouriteRestaurant = (restaurantId) => {
  const userId = getCurrentFavouriteUserId();

  // ======================================
  // USER MUST BE LOGGED IN
  // ======================================

  if (!userId) {
    console.warn("User must be logged in before changing favourites.");

    return [];
  }

  // ======================================
  // INVALID RESTAURANT ID
  // ======================================

  if (!restaurantId) {
    return getFavouriteRestaurantIds();
  }

  const id = String(restaurantId);

  // ======================================
  // REMOVE IF ALREADY FAVOURITE
  // ======================================

  if (isRestaurantFavourite(id)) {
    return removeFavouriteRestaurant(id);
  }

  // ======================================
  // OTHERWISE ADD
  // ======================================

  return addFavouriteRestaurant(id);
};

// ======================================
// CLEAR CURRENT USER FAVOURITES
// ======================================
//
// Clears ONLY the favourites belonging
// to the currently logged-in user.
// ======================================

export const clearFavouriteRestaurants = () => {
  try {
    const storageKey = getFavouritesStorageKey();

    if (!storageKey) {
      return [];
    }

    localStorage.removeItem(storageKey);

    dispatchFavouritesChanged([]);

    return [];
  } catch (error) {
    console.error("Failed to clear favourites:", error);

    return [];
  }
};
