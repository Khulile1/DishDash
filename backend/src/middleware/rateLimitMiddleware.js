// Import express-rate-limit to limit how many requests a user can make
const rateLimit = require("express-rate-limit");

// Create rate limit middleware
const rateLimitMiddleware = rateLimit({
  // Time window for counting requests
  // 60 * 1000 = 60 seconds = 1 minute
  windowMs: 60 * 1000,

  // Maximum number of requests allowed in the time window
  // In this case, each user/IP can make 10 requests per minute
  max: 80,

  // Response message sent when the request limit is reached
  message: {
    message: "Too many requests. Please try again later.",
  },
});

// Export the middleware so it can be used in app.js or server.js
module.exports = rateLimitMiddleware;
