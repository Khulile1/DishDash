// Import bcrypt to hash passwords and compare passwords safely
const bcrypt = require("bcrypt");

// Import jsonwebtoken to create JWT tokens
const jwt = require("jsonwebtoken");

// Number of salt rounds used when hashing passwords
const SALT_ROUNDS = 10;


// ==============================
// HASH PASSWORD
// ==============================

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(
    plainPassword,
    SALT_ROUNDS
  );
};


// ==============================
// COMPARE PASSWORD
// ==============================

const comparePassword = async (
  plainPassword,
  hashedPassword
) => {
  return bcrypt.compare(
    plainPassword,
    hashedPassword
  );
};


// ==============================
// GENERATE JWT TOKEN
// ==============================

const generateToken = (user) => {

  // TEST:
  // Show the JWT expiry value being read from .env
  console.log(
    "JWT_EXPIRES_IN:",
    process.env.JWT_EXPIRES_IN
  );

  // Show which user the token is being created for
  console.log(
    "Creating JWT for:",
    user.email
  );

  const token = jwt.sign(
    {
      // Information stored inside JWT
      id: user.id,
      email: user.email,
      role: user.role,
    },

    // Secret used to sign the JWT
    process.env.JWT_SECRET,

    {
      // Read expiry from .env
      // If missing, default to 2 hours
      expiresIn:
        process.env.JWT_EXPIRES_IN ||
        "2h",
    }
  );

  // Decode token ONLY for testing
  const decoded = jwt.decode(token);

  console.log(
    "JWT issued at:",
    new Date(
      decoded.iat * 1000
    ).toLocaleTimeString()
  );

  console.log(
    "JWT expires at:",
    new Date(
      decoded.exp * 1000
    ).toLocaleTimeString()
  );

  console.log(
    "JWT lifetime:",
    decoded.exp - decoded.iat,
    "seconds"
  );

  return token;
};


// ==============================
// EXPORT FUNCTIONS
// ==============================

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};