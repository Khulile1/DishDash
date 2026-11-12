"use strict";

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
// CONFIGURATION
// ======================================

const TEN_MINUTES = 10 * 60 * 1000;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ROLES = ["customer", "restaurant", "driver"];

const PASSWORD_MESSAGE =
  "Your password must contain at least eight characters, including an uppercase letter, a lowercase letter, a number, and a special character.";

// ======================================
// VALIDATION HELPERS
// ======================================

const isText = (value) => typeof value === "string" && value.trim().length > 0;

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  isText(email) &&
  email.length <= 254 &&
  EMAIL_REGEX.test(normalizeEmail(email));

// ======================================
// PASSWORD RESET HELPERS
// ======================================

const hashResetValue = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const generateVerificationCode = () =>
  crypto.randomInt(100000, 1000000).toString();

// ======================================
// PUBLIC USER INFORMATION
// ======================================

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  surname: user.surname,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

// ======================================
// EMAIL CONFIGURATION
// ======================================

let smtpTransporter = null;

// ======================================
// GET EMAIL SENDER
// ======================================

const getFromAddress = () => {
  const raw = (process.env.FROM_EMAIL || process.env.SMTP_USER || "").trim();

  if (!raw) {
    throw new Error(
      "Email sender is not configured. Please set FROM_EMAIL or SMTP_USER.",
    );
  }

  const match = raw.match(/^(.*?)\s*<([^<>]+)>$/);

  if (match) {
    return {
      name: match[1].trim() || "Dish Dash",
      email: match[2].trim(),
    };
  }

  return {
    name: "Dish Dash",
    email: raw,
  };
};

// ======================================
// SMTP TRANSPORTER
// ======================================

const getSmtpTransporter = () => {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST?.trim() || !SMTP_USER?.trim() || !SMTP_PASS?.trim()) {
    throw new Error(
      "SMTP configuration is incomplete. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    );
  }

  const port = Number(process.env.SMTP_PORT) || 587;

  const secure =
    port === 465 ||
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1";

  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST.trim(),
    port,
    secure,

    family: 4,

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,

    auth: {
      user: SMTP_USER.trim(),
      pass: SMTP_PASS.trim(),
    },
  });

  return smtpTransporter;
};

// ======================================
// SEND EMAIL
// ======================================

const sendEmail = async ({ to, subject, text }) => {
  const sender = getFromAddress();

  const sendGridKey = process.env.SENDGRID_API_KEY?.trim();

  // ======================================
  // SENDGRID EMAIL DELIVERY
  // ======================================

  if (sendGridKey) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${sendGridKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],

        from: sender,

        subject,

        content: [
          {
            type: "text/plain",
            value: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `Email delivery failed (${response.status}): ${details.slice(0, 500)}`,
      );
    }

    return;
  }

  // ======================================
  // SMTP EMAIL DELIVERY
  // ======================================

  const transporter = getSmtpTransporter();

  await transporter.sendMail({
    from: {
      name: sender.name,
      address: sender.email,
    },
    to,
    subject,
    text,
  });
};

// ======================================
// SEND EMAIL VERIFICATION CODE
// ======================================

const sendVerificationEmail = async (email, verificationCode) => {
  const message = `
Hello,

Thank you for registering with Dish Dash.

To complete your registration and activate your account, please verify your email address using the code below.

Verification code: ${verificationCode}

For your security, this code will expire in 10 minutes.

If you did not create a Dish Dash account, please disregard this email.

Kind regards,
The Dish Dash Team
`;

  await sendEmail({
    to: email,
    subject: "Dish Dash | Verify Your Email Address",
    text: message.trim(),
  });
};

// ======================================
// SEND PASSWORD RESET EMAIL
// ======================================

const sendPasswordResetEmail = async (email, resetCode, resetToken) => {
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");

  const resetLink =
    `${frontendUrl}/verify-password` +
    `?token=${encodeURIComponent(resetToken)}` +
    `&email=${encodeURIComponent(email)}`;

  const message = `
Hello,

We received a request to reset the password associated with your Dish Dash account.

To proceed with resetting your password, please use the verification code and secure link provided below.

Password reset code: ${resetCode}

Password reset link:
${resetLink}

To complete the process:

1. Open the password reset link.
2. Enter the six-digit verification code.
3. Create a new password.
4. Confirm your new password.

Please ensure that your new password is different from your current password.

For security purposes, the verification code and reset link will expire 10 minutes after the request was made.

If you did not request a password reset, you may safely ignore this email. Your existing password will remain unchanged.

Kind regards,
The Dish Dash Team
`;

  await sendEmail({
    to: email,
    subject: "Dish Dash | Password Reset Request",
    text: message.trim(),
  });
};

// ======================================
// PASSWORD RESET ERROR RESPONSE
// ======================================

const sendResetLinkError = (res, code = "RESET_LINK_INVALID") => {
  const expired = code === "RESET_LINK_EXPIRED";

  res.set("Cache-Control", "no-store");

  return res.status(expired ? 410 : 403).json({
    code,

    message: expired
      ? "Your password reset link has expired. Please request a new password reset link."
      : "This password reset link is invalid, has already been used, or is no longer available. Please request a new link.",

    redirectTo: "/unauthorized",
  });
};

// ======================================
// FIND PASSWORD RESET REQUEST
// ======================================

const findResetRequest = async (email, token) => {
  if (
    !isValidEmail(email) ||
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return {
      error: "RESET_LINK_INVALID",
    };
  }

  const hashedToken = hashResetValue(token);

  const user = await User.findOne({
    email: normalizeEmail(email),
    passwordResetToken: hashedToken,
  }).select(
    "+password +passwordResetCode +passwordResetToken +passwordResetExpires",
  );

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

  const expiresAt = new Date(user.passwordResetExpires).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return {
      error: "RESET_LINK_EXPIRED",
      user,
    };
  }

  return {
    user,
    expiresAt,
  };
};

// ======================================
// REGISTER USER
// ======================================

const register = async (req, res) => {
  try {
    const { name, surname, email, password, role } = req.body || {};

    // ======================================
    // VALIDATE REQUIRED FIELDS
    // ======================================

    if (![name, surname, email, password].every(isText)) {
      return res.status(400).json({
        message:
          "Please provide your first name, surname, email address, and password to complete registration.",
      });
    }

    // ======================================
    // VALIDATE EMAIL
    // ======================================

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // ======================================
    // VALIDATE PASSWORD
    // ======================================

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: PASSWORD_MESSAGE,
      });
    }

    // ======================================
    // VALIDATE ACCOUNT ROLE
    // ======================================

    const selectedRole = role === undefined ? "customer" : role;

    if (!ALLOWED_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        message: "Please select a valid account type.",
      });
    }

    // ======================================
    // CHECK EXISTING ACCOUNT
    // ======================================

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email address already exists. Please sign in or reset your password.",
      });
    }

    // ======================================
    // HASH PASSWORD
    // ======================================

    const hashedPassword = await hashPassword(password);

    // ======================================
    // GENERATE VERIFICATION CODE
    // ======================================

    const verificationCode = generateVerificationCode();

    // ======================================
    // CREATE USER
    // ======================================

    const user = await User.create({
      name: name.trim(),
      surname: surname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,

      isVerified: false,

      verificationCode,

      verificationCodeExpires: new Date(Date.now() + TEN_MINUTES),
    });

    // ======================================
    // SEND VERIFICATION EMAIL
    // ======================================

    try {
      await sendVerificationEmail(user.email, verificationCode);
    } catch (emailError) {
      console.error("Registration email error:", emailError);

      return res.status(201).json({
        message:
          "Your account has been created successfully, but we could not send the verification email. Please request a new verification code to activate your account.",

        emailSent: false,

        user: publicUser(user),
      });
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(201).json({
      message:
        "Your account has been created successfully. Please check your email for the verification code to activate your account.",

      emailSent: true,

      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "An account with this email address already exists. Please sign in.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message:
        "We were unable to complete your registration. Please try again later.",
    });
  }
};

// ======================================
// VERIFY EMAIL
// ======================================

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body || {};

    const verificationCode = String(code ?? "").trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        message:
          "Please provide a valid email address and a six-digit verification code.",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select("+verificationCode +verificationCodeExpires");

    if (!user) {
      return res.status(404).json({
        message:
          "We could not find an account associated with this email address.",
      });
    }

    // ======================================
    // CHECK VERIFICATION STATUS
    // ======================================

    if (user.isVerified) {
      return res.status(200).json({
        message:
          "Your email address has already been verified. You can now sign in.",
      });
    }

    // ======================================
    // CHECK CODE EXPIRY
    // ======================================

    if (
      !user.verificationCodeExpires ||
      new Date(user.verificationCodeExpires).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        message:
          "Your verification code has expired. Please request a new code.",
      });
    }

    // ======================================
    // VALIDATE CODE
    // ======================================

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        message:
          "The verification code you entered is incorrect. Please check the code and try again.",
      });
    }

    // ======================================
    // VERIFY ACCOUNT
    // ======================================

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Your email address has been verified successfully. You can now sign in to your Dish Dash account.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      message:
        "We could not verify your email address at this time. Please try again later.",
    });
  }
};

// ======================================
// RESEND VERIFICATION CODE
// ======================================

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: normalizeEmail(email),
    });

    if (!user) {
      return res.status(404).json({
        message:
          "We could not find an account associated with this email address.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message:
          "Your email address has already been verified. You can now sign in.",
      });
    }

    // ======================================
    // GENERATE NEW CODE
    // ======================================

    const verificationCode = generateVerificationCode();

    user.verificationCode = verificationCode;

    user.verificationCodeExpires = new Date(Date.now() + TEN_MINUTES);

    await user.save();

    // ======================================
    // SEND EMAIL
    // ======================================

    try {
      await sendVerificationEmail(user.email, verificationCode);
    } catch (emailError) {
      console.error("Verification email error:", emailError);

      return res.status(503).json({
        message:
          "We could not send your verification code at this time. Please try again shortly.",
      });
    }

    return res.status(200).json({
      message:
        "A new verification code has been sent to your registered email address. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.status(500).json({
      message:
        "We were unable to process your request. Please try again later.",
    });
  }
};

// ======================================
// FORGOT PASSWORD
// ======================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // ======================================
    // PREVENT ACCOUNT ENUMERATION
    // ======================================

    const successMessage =
      "If an account exists with this email address, password reset instructions will be sent shortly.";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
      });
    }

    // ======================================
    // GENERATE RESET CODE AND TOKEN
    // ======================================

    const resetCode = generateVerificationCode();

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedResetToken = hashResetValue(resetToken);

    // ======================================
    // SAVE RESET INFORMATION
    // ======================================

    user.passwordResetCode = hashResetValue(resetCode);

    user.passwordResetToken = hashedResetToken;

    user.passwordResetExpires = new Date(Date.now() + TEN_MINUTES);

    await user.save();

    // ======================================
    // SEND PASSWORD RESET EMAIL
    // ======================================

    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode, resetToken);
    } catch (emailError) {
      console.error("Password reset email error:", emailError);

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

      return res.status(503).json({
        message:
          "We could not send the password reset email. Please try again shortly.",
      });
    }

    return res.status(200).json({
      message: successMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message:
        "We could not process your password reset request. Please try again later.",
    });
  }
};

// ======================================
// VERIFY PASSWORD RESET TOKEN
// ======================================

const verifyResetToken = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { email, token } = req.body || {};

    const result = await findResetRequest(email, token);

    // ======================================
    // INVALID OR EXPIRED TOKEN
    // ======================================

    if (result.error) {
      if (result.error === "RESET_LINK_EXPIRED" && result.user) {
        result.user.passwordResetCode = null;

        result.user.passwordResetToken = null;

        result.user.passwordResetExpires = null;

        await result.user.save();
      }

      return sendResetLinkError(res, result.error);
    }

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      valid: true,

      expiresAt: new Date(result.expiresAt).toISOString(),

      message:
        "Your password reset link has been verified successfully. You may now continue with resetting your password.",
    });
  } catch (error) {
    console.error("Reset token verification error:", error);

    return res.status(500).json({
      message:
        "We could not verify your password reset link. Please try again.",
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
    // VALIDATE RESET REQUEST
    // ======================================

    const result = await findResetRequest(email, token);

    if (result.error) {
      return sendResetLinkError(res, result.error);
    }

    const { user, expiresAt } = result;

    const resetCode = String(code ?? "").trim();

    // ======================================
    // VALIDATE RESET CODE
    // ======================================

    if (!/^\d{6}$/.test(resetCode)) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message: "Please enter the six-digit password reset code.",
      });
    }

    if (hashResetValue(resetCode) !== user.passwordResetCode) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message:
          "The password reset code you entered is incorrect. Please try again.",
      });
    }

    // ======================================
    // VALIDATE PASSWORD FIELDS
    // ======================================

    if (!isText(password) || !isText(confirmPassword)) {
      return res.status(400).json({
        message:
          "Please enter your new password and confirm it before continuing.",
      });
    }

    // ======================================
    // PASSWORD CONFIRMATION
    // ======================================

    if (password !== confirmPassword) {
      return res.status(400).json({
        message:
          "The passwords you entered do not match. Please ensure both fields contain the same password.",
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
    // PREVENT PASSWORD REUSE
    // ======================================

    const isSamePassword = await comparePassword(password, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        code: "SAME_PASSWORD",

        message:
          "Your new password must be different from your current password. Please choose another password.",
      });
    }

    // ======================================
    // HASH NEW PASSWORD
    // ======================================

    const hashedPassword = await hashPassword(password);

    // ======================================
    // UPDATE USER PASSWORD
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
    // PREVENT RESET TOKEN REUSE
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
        "Your password has been reset successfully. You can now sign in to your Dish Dash account using your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);

    return res.status(500).json({
      message:
        "We could not reset your password at this time. Please try again later.",
    });
  }
};

// ======================================
// LOGIN
// ======================================

const login = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { email, password } = req.body || {};

    // ======================================
    // VALIDATE REQUIRED FIELDS
    // ======================================

    if (!isText(email) || !isText(password)) {
      return res.status(400).json({
        message: "Please enter your email address and password to sign in.",
      });
    }

    // ======================================
    // VALIDATE EMAIL FORMAT
    // ======================================

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select("+password");

    // ======================================
    // VALIDATE LOGIN CREDENTIALS
    // ======================================

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({
        message:
          "The email address or password you entered is incorrect. Please check your credentials and try again.",
      });
    }

    // ======================================
    // CHECK EMAIL VERIFICATION
    // ======================================

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Your email address has not been verified. Please complete email verification before signing in.",
      });
    }

    // ======================================
    // GENERATE JWT TOKEN
    // ======================================

    const token = generateToken(user);

    // ======================================
    // SUCCESS
    // ======================================

    return res.status(200).json({
      message: "You have signed in successfully. Welcome to Dish Dash.",

      token,

      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "We could not sign you in at this time. Please try again later.",
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
