// ======================================

// IMPORTS

// ======================================

import { useEffect } from "react";

import { matchPath, useLocation, useNavigate } from "react-router-dom";

import { jwtDecode } from "jwt-decode";

// ======================================

// SESSION SETTINGS

// ======================================

//

// 5 minutes:

//

// 5 × 60 × 1000

//

// ======================================

const INACTIVITY_LIMIT = 5 * 60 * 1000;

// ======================================

// STORAGE KEY

// ======================================

//

// Used so refreshing the browser does not

// restart the inactivity timer.

//

// It also helps keep multiple tabs in sync.

// ======================================

const LAST_ACTIVITY_KEY = "sessionLastActivity";

// Only routes requiring authentication should redirect to login.
// Public pages remain accessible even after a session expires.
const PROTECTED_ROUTE_PATTERNS = [
  "/home",
  "/menu",
  "/restaurants/:restaurantId",
  "/menu-items/:menuItemId",
  "/cart",
  "/checkout",
  "/payment-method",
  "/orders",
  "/order-confirmation/:orderId",
  "/orders/:orderId/payment",
  "/favourites",
  "/route-test",
  "/restaurant",
  "/restaurant/menu",
  "/restaurant/inventory",
  "/restaurant/analytics",
  "/restaurant/profile",
  "/addresses",
  "/profile",
];

const isProtectedRoute = (pathname) =>
  PROTECTED_ROUTE_PATTERNS.some((path) =>
    matchPath({ path, end: true }, pathname),
  );

// ======================================

// SESSION MANAGER

// ======================================

function SessionManager() {
  // ======================================

  // ROUTER

  // ======================================

  const location = useLocation();

  const navigate = useNavigate();

  // ======================================

  // SESSION EFFECT

  // ======================================

  useEffect(() => {
    // ======================================

    // TIMERS

    // ======================================

    let inactivityTimer = null;

    let jwtExpiryTimer = null;

    // ======================================

    // ACTIVITY THROTTLE

    // ======================================

    //

    // mousemove can fire many times every

    // second.

    //

    // We only need to save activity roughly

    // once per second.

    // ======================================

    let lastActivityWrite = 0;

    // ======================================

    // PREVENT MULTIPLE LOGOUTS

    // ======================================

    let loggingOut = false;

    // ======================================

    // CLEAR TIMERS

    // ======================================

    const clearTimers = () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);

        inactivityTimer = null;
      }

      if (jwtExpiryTimer) {
        window.clearTimeout(jwtExpiryTimer);

        jwtExpiryTimer = null;
      }
    };

    // ======================================

    // LOGOUT USER

    // ======================================

    const logoutUser = (reason = "session") => {
      if (loggingOut) {
        return;
      }

      loggingOut = true;

      // ======================================

      // STOP TIMERS

      // ======================================

      clearTimers();

      // ======================================

      // CLEAR AUTH DATA

      // ======================================

      localStorage.removeItem("token");

      localStorage.removeItem("user");

      localStorage.removeItem(LAST_ACTIVITY_KEY);

      // ======================================

      // LOG

      // ======================================

      if (reason === "inactive") {
        console.log("User inactive for 5 minutes. Logging out.");
      } else if (reason === "jwt-expired") {
        console.log("JWT expired. Logging user out.");
      } else {
        console.log("Session ended.");
      }

      // ======================================

      // REDIRECT

      // ======================================

      if (isProtectedRoute(window.location.pathname)) {
        navigate(
          "/login",

          {
            replace: true,

            state: {
              sessionExpired: true,

              reason,
            },
          },
        );
      }
    };

    // ======================================

    // LOGIN PAGE

    // ======================================

    //

    // If the customer deliberately reaches

    // /login, clear the old session.

    // ======================================

    if (location.pathname === "/login") {
      clearTimers();

      localStorage.removeItem("token");

      localStorage.removeItem("user");

      localStorage.removeItem(LAST_ACTIVITY_KEY);

      console.log("Login page opened. Session cleared.");

      return undefined;
    }

    // ======================================

    // GET TOKEN

    // ======================================

    const token = localStorage.getItem("token");

    // ======================================

    // NO TOKEN

    // ======================================

    if (!token) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);

      return undefined;
    }

    // ======================================

    // SCHEDULE INACTIVITY LOGOUT

    // ======================================

    const scheduleInactivityLogout = () => {
      // ======================================

      // CLEAR OLD TIMER

      // ======================================

      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }

      // ======================================

      // LAST ACTIVITY

      // ======================================

      const storedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

      const lastActivity =
        Number.isFinite(storedActivity) && storedActivity > 0
          ? storedActivity
          : Date.now();

      // ======================================

      // IDLE TIME

      // ======================================

      const idleTime = Date.now() - lastActivity;

      // ======================================

      // ALREADY INACTIVE TOO LONG

      // ======================================

      if (idleTime >= INACTIVITY_LIMIT) {
        logoutUser("inactive");

        return;
      }

      // ======================================

      // TIME REMAINING

      // ======================================

      const remainingTime = INACTIVITY_LIMIT - idleTime;

      // ======================================

      // START TIMER

      // ======================================

      inactivityTimer = window.setTimeout(
        () => {
          // ======================================

          // CHECK AGAIN

          // ======================================

          //

          // Another tab may have recorded

          // activity since this timer started.

          // ======================================

          const latestActivity = Number(
            localStorage.getItem(LAST_ACTIVITY_KEY),
          );

          const latestIdleTime = Date.now() - latestActivity;

          if (latestIdleTime >= INACTIVITY_LIMIT) {
            logoutUser("inactive");
          } else {
            scheduleInactivityLogout();
          }
        },

        remainingTime,
      );
    };

    // ======================================

    // RECORD USER ACTIVITY

    // ======================================

    const recordActivity = () => {
      const currentToken = localStorage.getItem("token");

      // ======================================

      // USER ALREADY LOGGED OUT

      // ======================================

      if (!currentToken) {
        return;
      }

      const now = Date.now();

      // ======================================

      // THROTTLE WRITES

      // ======================================

      if (now - lastActivityWrite < 1000) {
        return;
      }

      lastActivityWrite = now;

      // ======================================

      // SAVE ACTIVITY

      // ======================================

      localStorage.setItem(
        LAST_ACTIVITY_KEY,

        String(now),
      );

      // ======================================

      // RESET TIMER

      // ======================================

      scheduleInactivityLogout();
    };

    // ======================================

    // INITIAL ACTIVITY VALUE

    // ======================================

    const existingActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

    if (!Number.isFinite(existingActivity) || existingActivity <= 0) {
      localStorage.setItem(
        LAST_ACTIVITY_KEY,

        String(Date.now()),
      );
    }

    // ======================================

    // JWT VALIDATION

    // ======================================

    try {
      const decoded = jwtDecode(token);

      console.log("Session user:", decoded);

      // ======================================

      // JWT EXPIRY

      // ======================================

      if (decoded.exp) {
        const expiryTime = decoded.exp * 1000;

        const timeRemaining = expiryTime - Date.now();

        console.log("JWT time remaining:", timeRemaining);

        // ======================================

        // ALREADY EXPIRED

        // ======================================

        if (timeRemaining <= 0) {
          logoutUser("jwt-expired");

          return undefined;
        }

        // ======================================

        // HARD JWT EXPIRY TIMER

        // ======================================

        jwtExpiryTimer = window.setTimeout(
          () => {
            logoutUser("jwt-expired");
          },

          timeRemaining,
        );
      } else {
        console.log(
          "Token has no expiry value. Inactivity timeout will still be used.",
        );
      }
    } catch (error) {
      console.error("Invalid JWT:", error);

      logoutUser("invalid-token");

      return undefined;
    }

    // ======================================

    // ACTIVITY EVENTS

    // ======================================

    const activityEvents = [
      "mousedown",

      "mousemove",

      "keydown",

      "scroll",

      "touchstart",

      "click",
    ];

    // ======================================

    // ADD ACTIVITY LISTENERS

    // ======================================

    activityEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,

        recordActivity,

        {
          passive: true,
        },
      );
    });

    // ======================================

    // TAB VISIBILITY

    // ======================================

    //

    // Example:

    //

    // User leaves browser tab for 10 mins.

    //

    // Browser may throttle setTimeout.

    //

    // When they return we immediately check

    // the stored activity timestamp.

    // ======================================

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleInactivityLogout();
      }
    };

    document.addEventListener(
      "visibilitychange",

      handleVisibilityChange,
    );

    // ======================================

    // MULTIPLE TABS

    // ======================================

    //

    // Activity in another Dish Dash tab

    // resets the timer here too.

    //

    // Logout from another tab also applies

    // to this tab.

    // ======================================

    const handleStorageChange = (event) => {
      // ======================================

      // TOKEN REMOVED IN ANOTHER TAB

      // ======================================

      if (event.key === "token" && !event.newValue) {
        logoutUser("session");

        return;
      }

      // ======================================

      // ACTIVITY IN ANOTHER TAB

      // ======================================

      if (event.key === LAST_ACTIVITY_KEY) {
        scheduleInactivityLogout();
      }
    };

    window.addEventListener(
      "storage",

      handleStorageChange,
    );

    // ======================================

    // START INACTIVITY TIMER

    // ======================================

    scheduleInactivityLogout();

    // ======================================

    // CLEANUP

    // ======================================

    return () => {
      // ======================================

      // REMOVE EVENTS

      // ======================================

      activityEvents.forEach((eventName) => {
        window.removeEventListener(
          eventName,

          recordActivity,
        );
      });

      document.removeEventListener(
        "visibilitychange",

        handleVisibilityChange,
      );

      window.removeEventListener(
        "storage",

        handleStorageChange,
      );

      // ======================================

      // CLEAR TIMERS

      // ======================================

      clearTimers();
    };
  }, [location.pathname, navigate]);

  // ======================================

  // NO UI

  // ======================================

  return null;
}

// ======================================

// EXPORT

// ======================================

export default SessionManager;
