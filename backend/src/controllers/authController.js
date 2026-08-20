// Import the User model so this controller can read and write users in the database
const User = require("../models/User");

// Import helper functions from the auth service
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/authService");

// Register Controller
const register = async (req, res) => {
  // async is used because we are working with database operations and password hashing
  try {
    // Get the required user details from the request body
    const { name, email, password, role } = req.body;

    // Check if the required fields were provided
    if (!name || !email || !password) {
      return res.status(400).json({
        // 400 means Bad Request because some required data is missing
        message: "Name, email and password are required",
      });
    }

    // Check if a user with this email already exists in the database
    const existingUser = await User.findOne({ email });

    // If the email already exists, stop registration
    if (existingUser) {
      return res.status(409).json({
        // 409 means Conflict because the email is already registered
        message: "User already exists",
      });
    }

    const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message:
      "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.",
  });
}


    // Hash the plain password before saving it to the database
    const hashedPassword = await hashPassword(password);

    // Create a new user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Send a success response after the user is created
    return res.status(201).json({
      // 201 means Created
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle any unexpected server or database errors
    return res.status(500).json({
      // 500 means Internal Server Error
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Login Controller
const login = async (req, res) => {
  // async is used because we need to check the database and compare passwords
  try {
    // Get the login details from the request body
    const { email, password } = req.body;

    // Check if email and password were provided
    if (!email || !password) {
      return res.status(400).json({
        // 400 means Bad Request because some login details are missing
        message: "Email and password are required",
      });
    }

    // Find the user in the database using the email
    const user = await User.findOne({ email });

    // If no user is found, the login details are invalid
    if (!user) {
      return res.status(401).json({
        // 401 means Unauthorized because the user is not allowed to log in
        message: "Invalid email or password",
      });
    }

    // Compare the plain password from the request with the hashed password in the database
    const isPasswordCorrect = await comparePassword(password, user.password);

    // If the password is wrong, reject the login
    if (!isPasswordCorrect) {
      return res.status(401).json({
        // 401 means Unauthorized because the login details are incorrect
        message: "Invalid email or password",
      });
    }

    // Create a JWT token for the logged-in user
    const token = generateToken(user);

    // Send a success response with the token and user details
    return res.status(200).json({
      // 200 means OK
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle any unexpected server or database errors
    return res.status(500).json({
      // 500 means Internal Server Error
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Export the controller functions so they can be used in the routes file
module.exports = {
  register,
  login,
};