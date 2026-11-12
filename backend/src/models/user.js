// ======================================
// IMPORTS
// ======================================

// Import mongoose so we can create
// schemas and models for MongoDB
const mongoose = require("mongoose");

// ======================================
// USER SCHEMA
// ======================================

const UserSchema = new mongoose.Schema(
  {
    // ======================================
    // NAME
    // ======================================

    name: {
      type: String,

      required: [true, "Name is required"],

      trim: true,

      minlength: [2, "Name must be at least 2 characters"],

      maxlength: [50, "Name cannot exceed 50 characters"],

      // Allows letters, spaces,
      // hyphens and apostrophes
      match: [
        /^[\p{L}\s'-]+$/u,
        "Name can only contain letters, spaces, hyphens and apostrophes",
      ],
    },

    // ======================================
    // SURNAME
    // ======================================

    surname: {
      type: String,

      required: [true, "Surname is required"],

      trim: true,

      minlength: [2, "Surname must be at least 2 characters"],

      maxlength: [50, "Surname cannot exceed 50 characters"],

      match: [
        /^[\p{L}\s'-]+$/u,
        "Surname can only contain letters, spaces, hyphens and apostrophes",
      ],
    },

    // ======================================
    // EMAIL
    // ======================================

    email: {
      type: String,

      required: [true, "Email address is required"],

      unique: true,

      lowercase: true,

      trim: true,

      maxlength: [254, "Email address is too long"],

      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    // ======================================
    // PASSWORD
    // ======================================

    password: {
      type: String,

      required: [true, "Password is required"],

      minlength: [8, "Password must be at least 8 characters"],
    },

    // ======================================
    // ROLE
    // ======================================

    role: {
      type: String,

      enum: {
        values: ["customer", "restaurant", "driver", "admin"],

        message: "{VALUE} is not a valid user role",
      },

      default: "customer",

      required: true,
    },

    // ======================================
    // EMAIL VERIFICATION STATUS
    // ======================================

    isVerified: {
      type: Boolean,

      default: false,
    },

    // ======================================
    // VERIFICATION CODE
    // ======================================

    verificationCode: {
      type: String,

      default: null,

      validate: {
        validator: function (value) {
          // null is allowed when the user
          // has no active verification code
          if (value === null) {
            return true;
          }

          // Must contain exactly 6 numbers
          return /^\d{6}$/.test(value);
        },

        message: "Verification code must contain exactly 6 numbers",
      },
    },

    // ======================================
    // VERIFICATION CODE EXPIRY
    // ======================================

    verificationCodeExpires: {
      type: Date,

      default: null,
    },

    // ======================================
    // PASSWORD RESET CODE
    // ======================================

    /*
      We do not store the actual 6-digit
      password reset code.

      The controller hashes the code using
      SHA-256 before saving it.

      SHA-256 produces a 64-character
      hexadecimal string.
    */

    passwordResetCode: {
      type: String,

      default: null,

      maxlength: [64, "Password reset code hash is invalid"],
    },

    // ======================================
    // PASSWORD RESET TOKEN
    // ======================================

    /*
      The password reset token is also
      hashed before being stored.

      The real token is only sent to the
      user's email.

      The database stores only the
      SHA-256 hash.
    */

    passwordResetToken: {
      type: String,

      default: null,

      maxlength: [64, "Password reset token hash is invalid"],
    },

    // ======================================
    // PASSWORD RESET EXPIRY
    // ======================================

    /*
      Both the reset code and reset token
      expire at this time.

      Our controller currently gives them
      a 10-minute lifetime.
    */

    passwordResetExpires: {
      type: Date,

      default: null,
    },
  },

  // ======================================
  // OPTIONS
  // ======================================

  {
    timestamps: true,
  },
);

// ======================================
// EXPORT MODEL
// ======================================

module.exports = mongoose.model("User", UserSchema);
