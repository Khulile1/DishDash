// ======================================
// RESPONSE HELPERS
// ======================================

/**
 * Determines whether a value looks like a complete
 * Axios response rather than an API response body.
 */
function isAxiosResponse(response) {
  return Boolean(
    response &&
    typeof response === "object" &&
    "data" in response &&
    (typeof response.status === "number" ||
      "config" in response ||
      "headers" in response ||
      "request" in response),
  );
}

/**
 * Supports both:
 *
 * 1. A complete Axios response:
 *    {
 *      data: {...},
 *      status: 200,
 *      headers: {...}
 *    }
 *
 * 2. A service that already returns response.data:
 *    {
 *      success: true,
 *      user: {...}
 *    }
 */
export function getResponseData(response) {
  if (isAxiosResponse(response)) {
    return response.data;
  }

  return response;
}

/**
 * Checks that an API request genuinely succeeded.
 *
 * It catches:
 * - Empty responses
 * - success: false
 * - ok: false
 * - Nested data responses
 */
export function requireSuccessfulResult(
  response,
  fallbackMessage = "The request could not be completed.",
) {
  const responseData = getResponseData(response);

  if (responseData === null || responseData === undefined) {
    throw new Error("The server returned an empty response.");
  }

  if (typeof responseData !== "object") {
    return responseData;
  }

  if (responseData.success === false || responseData.ok === false) {
    throw new Error(
      responseData.message || responseData.error || fallbackMessage,
    );
  }

  /*
    Some APIs return:

    {
      success: true,
      data: {...}
    }

    Return the nested data when it exists.
  */
  if (responseData.data !== null && responseData.data !== undefined) {
    return responseData.data;
  }

  /*
    Some APIs use result instead of data.
  */
  if (responseData.result !== null && responseData.result !== undefined) {
    return responseData.result;
  }

  return responseData;
}

// ======================================
// VALIDATION ERROR HELPERS
// ======================================

/**
 * Recursively extracts readable validation messages.
 *
 * Handles:
 * - Arrays of strings
 * - Arrays of objects
 * - Express Validator errors
 * - Mongoose validation errors
 * - Object-based validation errors
 */
function collectValidationMessages(value, messages = []) {
  if (!value) {
    return messages;
  }

  if (typeof value === "string") {
    const message = value.trim();

    if (message) {
      messages.push(message);
    }

    return messages;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectValidationMessages(item, messages);
    });

    return messages;
  }

  if (typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) {
      messages.push(value.message.trim());
      return messages;
    }

    if (typeof value.msg === "string" && value.msg.trim()) {
      messages.push(value.msg.trim());
      return messages;
    }

    Object.values(value).forEach((item) => {
      collectValidationMessages(item, messages);
    });
  }

  return messages;
}

/**
 * Converts validation errors into one readable sentence.
 */
function getValidationMessage(errors) {
  const messages = collectValidationMessages(errors);

  return [...new Set(messages)].join(" ");
}

// ======================================
// ERROR MESSAGE HELPERS
// ======================================

/**
 * Prevents technical Axios or browser errors from
 * being shown directly to the user.
 */
function isTechnicalMessage(message) {
  if (typeof message !== "string") {
    return false;
  }

  const lowerMessage = message.toLowerCase();

  const technicalMessages = [
    "request failed with status code",
    "network error",
    "failed to fetch",
    "load failed",
    "unexpected token",
    "cannot read properties",
    "is not defined",
  ];

  return technicalMessages.some((technicalMessage) =>
    lowerMessage.includes(technicalMessage),
  );
}

/**
 * Converts Axios, Fetch API and normal JavaScript
 * errors into a safe message for the popup.
 */
export function getApiErrorMessage(
  error,
  fallbackMessage = "Something went wrong. Please try again.",
) {
  // ======================================
  // OFFLINE CHECK
  // ======================================

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return (
      "You appear to be offline. " +
      "Check your internet connection and try again."
    );
  }

  // ======================================
  // RESPONSE INFORMATION
  // ======================================

  const status = error?.response?.status ?? error?.status;

  const responseData = error?.response?.data ?? error?.data;

  // ======================================
  // VALIDATION ERRORS
  // ======================================

  const validationMessage = getValidationMessage(
    responseData?.errors ||
      responseData?.validationErrors ||
      responseData?.validation,
  );

  if (validationMessage) {
    return validationMessage;
  }

  // ======================================
  // BACKEND MESSAGE
  // ======================================

  const backendMessage =
    typeof responseData === "string"
      ? responseData
      : responseData?.message || responseData?.error || responseData?.detail;

  if (
    typeof backendMessage === "string" &&
    backendMessage.trim() &&
    !isTechnicalMessage(backendMessage)
  ) {
    return backendMessage.trim();
  }

  // ======================================
  // REQUEST TIMEOUT
  // ======================================

  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return (
      "The request took too long to complete. " +
      "Check your connection and try again."
    );
  }

  // ======================================
  // NETWORK ERROR
  // ======================================

  if (
    error?.code === "ERR_NETWORK" ||
    error?.name === "NetworkError" ||
    error?.message === "Failed to fetch" ||
    (error?.request && !error?.response)
  ) {
    return (
      "Local Bite could not connect to the server. " +
      "Check your connection and try again."
    );
  }

  // ======================================
  // HTTP STATUS ERRORS
  // ======================================

  const statusMessages = {
    400:
      "Some of the information provided is invalid. " +
      "Check your details and try again.",

    401: "Your login details are incorrect, or your session has expired.",

    403: "You do not have permission to complete this action, or your account still requires verification.",

    404: "The requested information could not be found.",

    408: "The request took too long to complete. Please try again.",

    409: "That information already exists. Check your details and try again.",

    413: "One of the uploaded files is too large.",

    422: "Some of the information could not be accepted. Check the form and try again.",

    429: "Too many attempts were made. Please wait before trying again.",
  };

  if (statusMessages[status]) {
    return statusMessages[status];
  }

  // ======================================
  // SERVER ERRORS
  // ======================================

  if (typeof status === "number" && status >= 500) {
    return (
      "The Local Bite server is currently having a problem. " +
      "Your action was not completed. Please try again."
    );
  }

  // ======================================
  // NORMAL JAVASCRIPT ERRORS
  // ======================================

  const normalMessage =
    typeof error?.message === "string" ? error.message.trim() : "";

  if (normalMessage && !isTechnicalMessage(normalMessage)) {
    return normalMessage;
  }

  // ======================================
  // FALLBACK
  // ======================================

  return fallbackMessage;
}

// ======================================
// LOGIN ERROR MESSAGE
// ======================================

/**
 * Provides login-specific feedback while still
 * using the backend message when available.
 */
export function getLoginErrorMessage(error) {
  const status = error?.response?.status ?? error?.status;

  if (status === 401) {
    return "The email address or password you entered is incorrect.";
  }

  if (status === 403) {
    return (
      "Your account has not been verified, or you do not " +
      "have permission to access this account."
    );
  }

  if (status === 429) {
    return (
      "Too many login attempts were made. " + "Please wait before trying again."
    );
  }

  return getApiErrorMessage(
    error,
    "Your login could not be completed. Check your details and try again.",
  );
}

// ======================================
// DISPLAY NAME
// ======================================

/**
 * Finds the user's name across common backend
 * response formats.
 */
export function getDisplayName(user, fallback = "there") {
  if (!user || typeof user !== "object") {
    return fallback;
  }

  const combinedName = [
    user.firstName || user.first_name,
    user.lastName || user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName =
    user.name ||
    user.fullName ||
    user.full_name ||
    user.displayName ||
    combinedName ||
    user.username;

  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return fallback;
}

// ======================================
// EMAIL VALIDATION
// ======================================

/**
 * Performs basic client-side email validation.
 *
 * The backend must still validate the email because
 * frontend validation can be bypassed.
 */
export function isValidEmail(email) {
  if (typeof email !== "string") {
    return false;
  }

  const cleanEmail = email.trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail);
}

// ======================================
// UNCERTAIN ORDER NETWORK ERROR
// ======================================

/**
 * A failed network request during order placement
 * can be uncertain.
 *
 * The server may have saved the order even though
 * the browser did not receive the response.
 *
 * In this situation, direct the customer to My Orders
 * before allowing another order attempt.
 */
export function isUncertainNetworkError(error) {
  return Boolean(
    error?.code === "ERR_NETWORK" ||
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    error?.name === "AbortError" ||
    error?.name === "NetworkError" ||
    (error?.request && !error?.response),
  );
}
