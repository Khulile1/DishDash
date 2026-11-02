// ======================================
// IMPORTS
// ======================================

const User = require("../models/user");

const nodemailer = require("nodemailer");

const crypto = require("crypto");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/authService");

// ======================================
// SETTINGS AND HELPERS
// ======================================

const TEN_MINUTES = 10 * 60 * 1000;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const PASSWORD_MESSAGE =
  "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.";

const isText = (value) => typeof value === "string" && value.trim().length > 0;

// ======================================
// HASH RESET VALUE
// ======================================

const hashResetValue = (value) => {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

// ======================================
// GENERATE 6 DIGIT CODE
// ======================================

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ======================================
// EMAIL TRANSPORTER
// ======================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================
// SEND VERIFICATION EMAIL
// ======================================

const sendVerificationEmail = async (email, verificationCode) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,

    to: email,

    subject: "Dish Dash - Verify Your Email",

    text: `
Welcome to Dish Dash.

Your verification code is:

${verificationCode}

This code will expire in 10 minutes.
    `,
  });
};

// ======================================
// SEND PASSWORD RESET EMAIL
// ======================================

const sendPasswordResetEmail = async (email, resetCode, resetToken) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  const resetLink =
    `${frontendUrl}/verify-password` +
    `?token=${encodeURIComponent(resetToken)}` +
    `&email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,

    to: email,

    subject: "Dish Dash - Reset Your Password",

    text: `
Dish Dash Password Reset

We received a request to reset the password for your Dish Dash account.

Your 6-digit password reset code is:

${resetCode}

Click the link below to create your new password:

${resetLink}

You will need to enter:

1. Your 6-digit reset code
2. Your new password
3. Your new password again

Your new password must be different from your current password.

The code and reset link expire in 10 minutes from when the reset was requested.

If you did not request this password reset, you can ignore this email.
    `,
  });
};

// ======================================
// RESET LINK ERROR
// ======================================

const sendResetLinkError = (res, code = "RESET_LINK_INVALID") => {
  const expired = code === "RESET_LINK_EXPIRED";

  res.set("Cache-Control", "no-store");

  return res.status(expired ? 410 : 403).json({
    code,

    message: expired
      ? "Your password reset link has expired. Please request a new link."
      : "Your password reset link is invalid, has already been used, or has been replaced. Please request a new link.",

    redirectTo: "/unauthorized",
  });
};

// ======================================
// FIND RESET REQUEST
// ======================================

const findResetRequest = async (email, token) => {
  // ======================================
  // CHECK EMAIL AND TOKEN
  // ======================================

  if (
    !isText(email) ||
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return {
      error: "RESET_LINK_INVALID",
    };
  }

  // ======================================
  // HASH TOKEN
  // ======================================

  const hashedToken = hashResetValue(token);

  // ======================================
  // FIND USER
  // ======================================

  const user = await User.findOne({
    email: email.toLowerCase().trim(),

    passwordResetToken: hashedToken,
  }).select(
    "+password +passwordResetCode +passwordResetToken +passwordResetExpires",
  );

  // ======================================
  // RESET REQUEST NOT FOUND
  // ======================================

  if (
    !user ||
    !user.passwordResetCode ||
    !user.passwordResetToken ||
    !user.passwordResetExpires
  ) {
    return {
      error: "RESET_LINK_INVALID",
    };
  }

  // ======================================
  // CHECK EXPIRY
  // ======================================

  const expiresAt = new Date(user.passwordResetExpires).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return {
      error: "RESET_LINK_EXPIRED",
      user,
    };
  }

  // ======================================
  // VALID RESET REQUEST
  // ======================================

  return {
    user,
    expiresAt,
  };
};

// ======================================
// REGISTER
// ======================================

const register = async (req, res) => {
  try {
    const { name, surname, email, password, role } = req.body || {};

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (![name, surname, email, password].every(isText)) {
      return res.status(400).json({
        message: "Name, surname, email and password are required",
      });
    }

    // ======================================
    // NORMALIZE EMAIL
    // ======================================

    const normalizedEmail = email.toLowerCase().trim();

    // ======================================
    // CHECK EXISTING USER
    // ======================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // ======================================
    // PASSWORD REQUIREMENTS
    // ======================================

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: PASSWORD_MESSAGE,
      });
    }

    // ======================================
    // HASH PASSWORD
    // ======================================

    const hashedPassword = await hashPassword(password);

    // ======================================
    // VERIFICATION CODE
    // ======================================

    const verificationCode = generateVerificationCode();

    // ======================================
    // CREATE USER
    // ======================================

    const user = await User.create({
      name,

      surname,

      email: normalizedEmail,

      password: hashedPassword,

      role,

      isVerified: false,

      verificationCode,

      verificationCodeExpires: new Date(Date.now() + TEN_MINUTES),
    });

    // ======================================
    // SEND EMAIL
    // ======================================

    await sendVerificationEmail(normalizedEmail, verificationCode);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(201).json({
      message: "User registered successfully. Verification code sent to email.",

      user: {
        id: user._id,

        name: user.name,

        surname: user.surname,

        email: user.email,

        role: user.role,

        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// ======================================
// VERIFY EMAIL
// ======================================

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body || {};

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (!isText(email) || !code) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+verificationCode +verificationCodeExpires");

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    // ======================================
    // ALREADY VERIFIED
    // ======================================

    if (user.isVerified) {
      return res.status(200).json({
        message: "Email is already verified",
      });
    }

    // ======================================
    // CHECK CODE
    // ======================================

    if (user.verificationCode !== String(code)) {
      return res.status(400).json({
        message: "Verification code is incorrect",
      });
    }

    // ======================================
    // CHECK EXPIRY
    // ======================================

    if (
      !user.verificationCodeExpires ||
      new Date(user.verificationCodeExpires).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        message: "Verification code has expired",
      });
    }

    // ======================================
    // VERIFY USER
    // ======================================

    user.isVerified = true;

    user.verificationCode = null;

    user.verificationCodeExpires = null;

    await user.save();

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);

    return res.status(500).json({
      message: "Server error during email verification",
    });
  }
};

// ======================================
// RESEND VERIFICATION CODE
// ======================================

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body || {};

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!isText(email)) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    // ======================================
    // ALREADY VERIFIED
    // ======================================

    if (user.isVerified) {
      return res.status(400).json({
        message: "This email is already verified",
      });
    }

    // ======================================
    // NEW CODE
    // ======================================

    const verificationCode = generateVerificationCode();

    user.verificationCode = verificationCode;

    user.verificationCodeExpires = new Date(Date.now() + TEN_MINUTES);

    await user.save();

    // ======================================
    // SEND EMAIL
    // ======================================

    await sendVerificationEmail(user.email, verificationCode);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: "A new verification code has been sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.status(500).json({
      message: "Server error while resending verification code",
    });
  }
};

// ======================================
// FORGOT PASSWORD
// ======================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    // ======================================
    // EMAIL REQUIRED
    // ======================================

    if (!isText(email)) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    // ======================================
    // NORMALIZE EMAIL
    // ======================================

    const normalizedEmail = email.toLowerCase().trim();

    // ======================================
    // GMAIL CHECK
    // ======================================

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!gmailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Enter a valid Gmail address ending in @gmail.com",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "No Dish Dash account was found with this Gmail address",
      });
    }

    // ======================================
    // GENERATE RESET CODE
    // ======================================

    const resetCode = generateVerificationCode();

    // ======================================
    // GENERATE RESET TOKEN
    // ======================================

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedResetToken = hashResetValue(resetToken);

    // ======================================
    // SAVE RESET DATA
    // ======================================

    user.passwordResetCode = hashResetValue(resetCode);

    user.passwordResetToken = hashedResetToken;

    user.passwordResetExpires = new Date(Date.now() + TEN_MINUTES);

    await user.save();

    // ======================================
    // SEND RESET EMAIL
    // ======================================

    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode, resetToken);
    } catch (emailError) {
      console.error("Password reset email error:", emailError);

      // Clear only this reset request.
      await User.updateOne(
        {
          _id: user._id,

          passwordResetToken: hashedResetToken,
        },
        {
          $set: {
            passwordResetCode: null,

            passwordResetToken: null,

            passwordResetExpires: null,
          },
        },
      );

      return res.status(500).json({
        message:
          "The password reset email could not be sent. Please try again.",
      });
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: "Password reset code and link sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Server error while processing password reset",
    });
  }
};

// ======================================
// VERIFY PASSWORD RESET LINK
// ======================================

const verifyResetToken = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { email, token } = req.body || {};

    // ======================================
    // CHECK RESET REQUEST
    // ======================================

    const result = await findResetRequest(email, token);

    // ======================================
    // INVALID OR EXPIRED
    // ======================================

    if (result.error) {
      // ======================================
      // CLEAR EXPIRED DATA
      // ======================================

      if (result.error === "RESET_LINK_EXPIRED" && result.user) {
        result.user.passwordResetCode = null;

        result.user.passwordResetToken = null;

        result.user.passwordResetExpires = null;

        await result.user.save();
      }

      return sendResetLinkError(res, result.error);
    }

    // ======================================
    // VALID LINK
    // ======================================

    return res.status(200).json({
      valid: true,

      expiresAt: new Date(result.expiresAt).toISOString(),

      message: "Password reset link is valid.",
    });
  } catch (error) {
    console.error("Reset link verification error:", error);

    return res.status(500).json({
      message: "Unable to verify this reset link. Please try again.",
    });
  }
};

// ======================================
// RESET PASSWORD
// ======================================

const resetPassword = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { email, token, code, password, confirmPassword } = req.body || {};

    // ======================================
    // CHECK RESET LINK AGAIN
    // ======================================

    const result = await findResetRequest(email, token);

    // ======================================
    // INVALID OR EXPIRED
    // ======================================

    if (result.error) {
      return sendResetLinkError(res, result.error);
    }

    const { user, expiresAt } = result;

    const resetCode = String(code ?? "").trim();

    // ======================================
    // CHECK CODE FORMAT
    // ======================================

    if (!/^\d{6}$/.test(resetCode)) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message: "Reset code must contain exactly 6 numbers",
      });
    }

    // ======================================
    // CHECK CODE
    // ======================================

    if (hashResetValue(resetCode) !== user.passwordResetCode) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message: "The password reset code is incorrect",
      });
    }

    // ======================================
    // PASSWORD FIELDS REQUIRED
    // ======================================

    if (!isText(password) || !isText(confirmPassword)) {
      return res.status(400).json({
        message: "New password and confirmation password are required",
      });
    }

    // ======================================
    // PASSWORDS MUST MATCH
    // ======================================

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "The new passwords do not match",
      });
    }

    // ======================================
    // PASSWORD REQUIREMENTS
    // ======================================

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: PASSWORD_MESSAGE,
      });
    }

    // ======================================
    // NEW PASSWORD CANNOT MATCH OLD PASSWORD
    // ======================================

    const isSamePassword = await comparePassword(password, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        code: "SAME_PASSWORD",

        message:
          "Your new password cannot be the same as your current password.",
      });
    }

    // ======================================
    // HASH NEW PASSWORD
    // ======================================

    const hashedPassword = await hashPassword(password);

    // ======================================
    // UPDATE PASSWORD
    // ======================================

    const update = await User.updateOne(
      {
        _id: user._id,

        password: user.password,

        passwordResetToken: user.passwordResetToken,

        passwordResetCode: user.passwordResetCode,

        passwordResetExpires: {
          $gt: new Date(),
        },
      },
      {
        $set: {
          password: hashedPassword,

          passwordResetCode: null,

          passwordResetToken: null,

          passwordResetExpires: null,
        },
      },
      {
        runValidators: true,
      },
    );

    // ======================================
    // TOKEN USED / EXPIRED DURING REQUEST
    // ======================================

    if (update.modifiedCount !== 1) {
      return sendResetLinkError(
        res,

        expiresAt <= Date.now() ? "RESET_LINK_EXPIRED" : "RESET_LINK_INVALID",
      );
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message:
        "Your password has been changed successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Server error while changing your password",
    });
  }
};

// ======================================
// LOGIN
// ======================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (!isText(email) || !isText(password)) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    // ======================================
    // CHECK PASSWORD
    // ======================================

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Password is incorrect",
      });
    }

    // ======================================
    // CHECK VERIFICATION
    // ======================================

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // ======================================
    // GENERATE TOKEN
    // ======================================

    const token = generateToken(user);

    // ======================================
    // SUCCESS
    // ======================================

    console.log("TOKEN:", token);

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        surname: user.surname,

        email: user.email,

        role: user.role,

        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ======================================
// EXPORT CONTROLLERS
// ======================================

module.exports = {
  register,

  login,

  verifyEmail,

  resendVerificationCode,

  forgotPassword,

  verifyResetToken,

  resetPassword,
};
