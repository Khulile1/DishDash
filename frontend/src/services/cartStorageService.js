// ======================================
// IMPORTS
// ======================================

import { jwtDecode } from "jwt-decode";

// ======================================
// CART EVENT
// ======================================
//
// Components such as Navbar or cart badges
// can listen for this event if they need
// to update immediately when the cart
// changes.
// ======================================

const CART_CHANGED_EVENT = "dishdash-cart-changed";

// ======================================
// GET CURRENT USER ID
// ======================================

export const getCurrentCartUserId = () => {
  // ======================================
  // TRY SAVED USER FIRST
  // ======================================

  try {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      const userId = user?._id || user?.id || user?.userId;

      if (userId) {
        return String(userId);
      }
    }
  } catch (error) {
    console.error("Could not read user for cart:", error);
  }

  // ======================================
  // FALL BACK TO JWT
  // ======================================

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    const decoded = jwtDecode(token);

    const userId =
      decoded?._id || decoded?.id || decoded?.userId || decoded?.sub;

    if (!userId) {
      return null;
    }

    return String(userId);
  } catch (error) {
    console.error("Could not decode user for cart:", error);

    return null;
  }
};

// ======================================
// GET CART STORAGE KEY
// ======================================
//
// Example:
//
// cart:68da123456...
//
// Every customer therefore gets a
// different localStorage key.
// ======================================

export const getCartStorageKey = () => {
  const userId = getCurrentCartUserId();

  if (!userId) {
    return null;
  }

  return `cart:${userId}`;
};

// ======================================
// DISPATCH CART CHANGE EVENT
// ======================================

const dispatchCartChanged = (cart = []) => {
  window.dispatchEvent(
    new CustomEvent(CART_CHANGED_EVENT, {
      detail: {
        cart,
      },
    }),
  );
};

// ======================================
// GET STORED CART
// ======================================

export const getStoredCart = () => {
  try {
    const key = getCartStorageKey();

    // ======================================
    // NO LOGGED-IN USER
    // ======================================

    if (!key) {
      return [];
    }

    // ======================================
    // READ USER'S CART
    // ======================================

    const savedCart = localStorage.getItem(key);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart;
  } catch (error) {
    console.error("Could not load cart:", error);

    return [];
  }
};

// ======================================
// SAVE STORED CART
// ======================================

export const saveStoredCart = (cart) => {
  try {
    const key = getCartStorageKey();

    // ======================================
    // DO NOT CREATE SHARED/GUEST CART
    // ======================================

    if (!key) {
      console.warn("Cart was not saved because no logged-in user was found.");

      return;
    }

    // ======================================
    // NORMALISE CART
    // ======================================

    const safeCart = Array.isArray(cart) ? cart : [];

    // ======================================
    // SAVE USER CART
    // ======================================

    localStorage.setItem(
      key,

      JSON.stringify(safeCart),
    );

    // ======================================
    // UPDATE CART BADGES / OTHER PAGES
    // ======================================

    dispatchCartChanged(safeCart);
  } catch (error) {
    console.error("Could not save cart:", error);
  }
};

// ======================================
// CLEAR CURRENT USER'S CART
// ======================================

export const clearStoredCart = () => {
  try {
    const key = getCartStorageKey();

    if (!key) {
      return;
    }

    localStorage.removeItem(key);

    dispatchCartChanged([]);
  } catch (error) {
    console.error("Could not clear cart:", error);
  }
};

// ======================================
// CART QUANTITY
// ======================================
//
// Useful for Navbar/cart badges.
// ======================================

export const getStoredCartQuantity = () => {
  const cart = getStoredCart();

  return cart.reduce(
    (total, item) =>
      total +
      Math.max(
        1,

        Number(item.quantity || 1),
      ),

    0,
  );
};

// ======================================
// CART SUBTOTAL
// ======================================

export const getStoredCartSubtotal = () => {
  const cart = getStoredCart();

  return cart.reduce(
    (total, item) => {
      const price = Number(item.price || 0);

      const quantity = Math.max(
        1,

        Number(item.quantity || 1),
      );

      return total + price * quantity;
    },

    0,
  );
};

// ======================================
// ADD / INCREASE ITEM
// ======================================

export const addStoredCartItem = (item, quantity = 1) => {
  if (!item?._id) {
    return getStoredCart();
  }

  const cart = getStoredCart();

  const existingItem = cart.find(
    (cartItem) => String(cartItem._id) === String(item._id),
  );

  let updatedCart;

  // ======================================
  // ITEM ALREADY EXISTS
  // ======================================

  if (existingItem) {
    updatedCart = cart.map((cartItem) =>
      String(cartItem._id) === String(item._id)
        ? {
            ...cartItem,

            ...item,

            quantity:
              Math.max(
                1,

                Number(cartItem.quantity || 1),
              ) +
              Math.max(
                1,

                Number(quantity || 1),
              ),
          }
        : cartItem,
    );
  } else {
    // ======================================
    // NEW ITEM
    // ======================================

    updatedCart = [
      ...cart,

      {
        ...item,

        quantity: Math.max(
          1,

          Number(quantity || 1),
        ),
      },
    ];
  }

  saveStoredCart(updatedCart);

  return updatedCart;
};

// ======================================
// UPDATE ITEM QUANTITY
// ======================================

export const updateStoredCartItemQuantity = (itemId, quantity) => {
  const safeQuantity = Number(quantity);

  if (!itemId || !Number.isInteger(safeQuantity) || safeQuantity < 1) {
    return getStoredCart();
  }

  const cart = getStoredCart();

  const updatedCart = cart.map((item) =>
    String(item._id) === String(itemId)
      ? {
          ...item,

          quantity: safeQuantity,
        }
      : item,
  );

  saveStoredCart(updatedCart);

  return updatedCart;
};

// ======================================
// REMOVE ONE QUANTITY
// ======================================

export const removeOneStoredCartItem = (itemId) => {
  const cart = getStoredCart();

  const updatedCart = cart
    .map((item) => {
      if (String(item._id) !== String(itemId)) {
        return item;
      }

      const quantity = Math.max(
        1,

        Number(item.quantity || 1),
      );

      return {
        ...item,

        quantity: quantity - 1,
      };
    })
    .filter((item) => Number(item.quantity || 0) > 0);

  saveStoredCart(updatedCart);

  return updatedCart;
};

// ======================================
// REMOVE ITEM COMPLETELY
// ======================================

export const removeStoredCartItem = (itemId) => {
  const cart = getStoredCart();

  const updatedCart = cart.filter(
    (item) => String(item._id) !== String(itemId),
  );

  saveStoredCart(updatedCart);

  return updatedCart;
};

// ======================================
// REMOVE OLD SHARED CART
// ======================================
//
// Your old code used:
//
// localStorage["cart"]
//
// That key must not be used anymore,
// because every account on the browser
// could see the same cart.
// ======================================

export const removeLegacyCart = () => {
  try {
    localStorage.removeItem("cart");
  } catch (error) {
    console.error("Could not remove legacy cart:", error);
  }
};

// ======================================
// CART CHANGED EVENT NAME
// ======================================

export const CART_CHANGED_EVENT_NAME = CART_CHANGED_EVENT;
