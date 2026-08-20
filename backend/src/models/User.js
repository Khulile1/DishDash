// Import mongoose so we can create a schema and model for MongoDB
const mongoose = require("mongoose");

// Create the User schema
// A schema defines the structure/rules for documents in the users collection
const UserSchema = new mongoose.Schema(
  {
    name: {
      // The user's full name must be a string
      type: String,

      // This field is required when registering a user
      required: true,

      // Removes extra spaces before and after the name
      trim: true,
    },

    email: {
      // The user's email must be a string
      type: String,

      // Email is required for registration and login
      required: true,

      // Makes sure each email can only be used once
      unique: true,

      // Converts the email to lowercase before saving
      lowercase: true,

      // Removes extra spaces before and after the email
      trim: true,
    },

    password: {
      // The password is stored as a hashed string
      type: String,

      // Password is required when creating a user account
      required: true,
    },

    role: {
      // The role must be a string
      type: String,

      // Only these roles are allowed
      enum: ["customer", "restaurant", "admin"],

      // If no role is provided, the user becomes a customer by default
      default: "customer",
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the User model
// Mongoose will use this model to interact with the users collection in MongoDB
module.exports = mongoose.model("User", UserSchema);