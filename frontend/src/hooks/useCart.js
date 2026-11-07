// ======================================
// IMPORTS
// ======================================

import { useCallback, useEffect, useState } from "react";

import {
  CART_CHANGED_EVENT_NAME,
  getCartStorageKey,
  getStoredCart,
  saveStoredCart,
  clearStoredCart,
} from "../services/cartStorageService";

// ======================================
// USE CART
// ======================================

function useCart() {
  // ======================================
  // CART STATE
  // ======================================

  const [cart, setCartState] = useState(() => getStoredCart());

  // ======================================
  // RELOAD CART FROM STORAGE
  // ======================================

  const reloadCart = useCallback(() => {
    const latestCart = getStoredCart();

    setCartState(latestCart);

    return latestCart;
  }, []);

  // ======================================
  // SET CART
  // ======================================
  //
  // Supports:
  //
  // setCart(newCart)
  //
  // OR
  //
  // setCart((currentCart) => {
  //   return updatedCart;
  // });
  //
  // This means your existing React cart
  // code can continue using setCart(...)
  // almost exactly as before.
  // ======================================

  const setCart = useCallback((valueOrFunction) => {
    // ======================================
    // ALWAYS GET CURRENT SAVED CART
    // ======================================
    //
    // This prevents CartCard and CartPage
    // from changing different stale copies.
    // ======================================

    const currentCart = getStoredCart();

    // ======================================
    // CALCULATE NEXT CART
    // ======================================

    const nextCart =
      typeof valueOrFunction === "function"
        ? valueOrFunction(currentCart)
        : valueOrFunction;

    const safeCart = Array.isArray(nextCart) ? nextCart : [];

    // ======================================
    // SAVE USER-SPECIFIC CART
    // ======================================

    saveStoredCart(safeCart);

    // ======================================
    // UPDATE THIS COMPONENT IMMEDIATELY
    // ======================================

    setCartState(safeCart);

    return safeCart;
  }, []);

  // ======================================
  // ADD ITEM
  // ======================================
  //
  // Existing item:
  //
  // Burger x1
  //      ↓
  // Burger x2
  //
  // New item:
  //
  // added as quantity 1
  // ======================================

  const addItem = useCallback(
    (item) => {
      if (!item?._id) {
        return;
      }

      setCart((currentCart) => {
        const existingItem = currentCart.find(
          (cartItem) => String(cartItem._id) === String(item._id),
        );

        // ======================================
        // ITEM ALREADY IN CART
        // ======================================

        if (existingItem) {
          return currentCart.map((cartItem) => {
            if (String(cartItem._id) !== String(item._id)) {
              return cartItem;
            }

            return {
              ...cartItem,

              // Keep latest item information.
              ...item,

              quantity:
                Math.max(
                  1,

                  Number(cartItem.quantity || 1),
                ) + 1,
            };
          });
        }

        // ======================================
        // NEW ITEM
        // ======================================

        return [
          ...currentCart,

          {
            ...item,

            quantity: 1,
          },
        ];
      });
    },
    [setCart],
  );

  // ======================================
  // REMOVE ONE
  // ======================================
  //
  // Burger x3
  //      ↓
  // Burger x2
  //
  // If quantity reaches 0, remove the item.
  // ======================================

  const removeOne = useCallback(
    (itemOrId) => {
      const itemId = typeof itemOrId === "object" ? itemOrId?._id : itemOrId;

      if (!itemId) {
        return;
      }

      setCart((currentCart) =>
        currentCart
          .map((cartItem) => {
            if (String(cartItem._id) !== String(itemId)) {
              return cartItem;
            }

            const quantity = Math.max(
              1,

              Number(cartItem.quantity || 1),
            );

            return {
              ...cartItem,

              quantity: quantity - 1,
            };
          })
          .filter((cartItem) => Number(cartItem.quantity || 0) > 0),
      );
    },
    [setCart],
  );

  // ======================================
  // REMOVE ITEM COMPLETELY
  // ======================================

  const removeItem = useCallback(
    (itemOrId) => {
      const itemId = typeof itemOrId === "object" ? itemOrId?._id : itemOrId;

      if (!itemId) {
        return;
      }

      setCart((currentCart) =>
        currentCart.filter(
          (cartItem) => String(cartItem._id) !== String(itemId),
        ),
      );
    },
    [setCart],
  );

  // ======================================
  // SET ITEM QUANTITY
  // ======================================

  const setItemQuantity = useCallback(
    (itemOrId, quantity) => {
      const itemId = typeof itemOrId === "object" ? itemOrId?._id : itemOrId;

      const safeQuantity = Number(quantity);

      if (!itemId || !Number.isInteger(safeQuantity)) {
        return;
      }

      // ======================================
      // ZERO = REMOVE
      // ======================================

      if (safeQuantity <= 0) {
        removeItem(itemId);

        return;
      }

      // ======================================
      // UPDATE
      // ======================================

      setCart((currentCart) =>
        currentCart.map((cartItem) =>
          String(cartItem._id) === String(itemId)
            ? {
                ...cartItem,

                quantity: safeQuantity,
              }
            : cartItem,
        ),
      );
    },
    [removeItem, setCart],
  );

  // ======================================
  // GET ITEM QUANTITY
  // ======================================

  const getItemQuantity = useCallback(
    (itemOrId) => {
      const itemId = typeof itemOrId === "object" ? itemOrId?._id : itemOrId;

      const cartItem = cart.find((item) => String(item._id) === String(itemId));

      return Number(cartItem?.quantity || 0);
    },
    [cart],
  );

  // ======================================
  // CHECK IF ITEM IS IN CART
  // ======================================

  const isItemInCart = useCallback(
    (itemOrId) => {
      return getItemQuantity(itemOrId) > 0;
    },
    [getItemQuantity],
  );

  // ======================================
  // CLEAR CART
  // ======================================

  const clearCart = useCallback(() => {
    clearStoredCart();

    setCartState([]);
  }, []);

  // ======================================
  // TOTAL CART QUANTITY
  // ======================================
  //
  // Burger x2
  // Coke   x3
  //
  // Badge = 5
  // ======================================

  const cartQuantity = cart.reduce(
    (total, item) =>
      total +
      Math.max(
        1,

        Number(item.quantity || 1),
      ),

    0,
  );

  // ======================================
  // UNIQUE CART ITEMS
  // ======================================
  //
  // Burger x2
  // Coke x3
  //
  // uniqueItems = 2
  // ======================================

  const uniqueItems = cart.length;

  // ======================================
  // CART SUBTOTAL
  // ======================================

  const subtotal = cart.reduce(
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

  // ======================================
  // LISTEN FOR CART CHANGES
  // ======================================
  //
  // Example:
  //
  // RestaurantsPage
  //      ↓
  // add Burger
  //      ↓
  // CartCard updates
  //      ↓
  // Navbar updates
  //      ↓
  // CartPage updates
  //
  // without requiring a refresh.
  // ======================================

  useEffect(() => {
    // ======================================
    // SAME TAB
    // ======================================

    const handleCartChanged = () => {
      reloadCart();
    };

    window.addEventListener(
      CART_CHANGED_EVENT_NAME,

      handleCartChanged,
    );

    // ======================================
    // OTHER BROWSER TAB
    // ======================================

    const handleStorageChange = (event) => {
      const cartKey = getCartStorageKey();

      if (cartKey && event.key === cartKey) {
        reloadCart();
      }
    };

    window.addEventListener(
      "storage",

      handleStorageChange,
    );

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      window.removeEventListener(
        CART_CHANGED_EVENT_NAME,

        handleCartChanged,
      );

      window.removeEventListener(
        "storage",

        handleStorageChange,
      );
    };
  }, [reloadCart]);

  // ======================================
  // RETURN
  // ======================================

  return {
    // CART
    cart,

    setCart,

    // ACTIONS
    addItem,

    removeOne,

    removeItem,

    setItemQuantity,

    clearCart,

    reloadCart,

    // LOOKUPS
    getItemQuantity,

    isItemInCart,

    // TOTALS
    cartQuantity,

    uniqueItems,

    subtotal,
  };
}

// ======================================
// EXPORT
// ======================================

export default useCart;
