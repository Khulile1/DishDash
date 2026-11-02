const rateLimit = require("express-rate-limit");

const loginRateLimitMiddleware = rateLimit({
  // Time window: 15 minutes
  windowMs: 15 * 60 * 1000,

  // Allow only 3 login attempts in 15 minutes
  max: 60,
  max: 65,

  // Only count failed login attempts
  skipSuccessfulRequests: true,

  // Status code for too many requests
  statusCode: 429,

  // Message returned when blocked
  message: {
    message:
      "Too many failed login attempts. Please try again after 15 minutes.",
  },
});

module.exports = loginRateLimitMiddleware;
