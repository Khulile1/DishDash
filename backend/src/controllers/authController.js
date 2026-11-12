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

// HASH PASSWORD RESET VALUES

// ======================================

const hashResetValue = (value) => {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

// ======================================

// GENERATE SIX-DIGIT CODE

// ======================================

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ======================================

// FORMAT PUBLIC USER DATA

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

// NODEMAILER SMTP CONFIGURATION

// ======================================

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!isText(SMTP_HOST) || !isText(SMTP_USER) || !isText(SMTP_PASS)) {
    throw new Error(
      "Email service is not configured. Please check the SMTP environment variables.",
    );
  }

  const port = Number(SMTP_PORT) || 587;

  const secure = port === 465 || process.env.SMTP_SECURE === "true";

  transporter = nodemailer.createTransport({
    host: SMTP_HOST.trim(),

    port,

    secure,

    // Prefer IPv4 for SMTP connections.

    family: 4,

    connectionTimeout: 15000,

    greetingTimeout: 15000,

    socketTimeout: 20000,

    auth: {
      user: SMTP_USER.trim(),

      pass: SMTP_PASS.replace(/\s+/g, ""),
    },
  });

  return transporter;
};

// ======================================

// SEND EMAIL USING NODEMAILER

// ======================================

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

// Table-based layout and inline styles work well in common email clients.
const buildBrandedEmail = ({
  heading,
  description,
  code,
  actionUrl,
  actionLabel,
  securityNote,
}) => {
  const actionButton = actionUrl
    ? `
      <tr>
        <td align="center" style="padding:4px 28px 24px;">
          <a href="${escapeHtml(actionUrl)}"
             style="background-color:#f97316;border-radius:10px;color:#ffffff;display:inline-block;
                    font-family:Arial,sans-serif;font-size:15px;font-weight:700;
                    padding:14px 26px;text-align:center;text-decoration:none;">
            ${escapeHtml(actionLabel)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DishDash</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
         style="background-color:#f5f6fa;padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="max-width:560px;background-color:#ffffff;border:1px solid #ebeef2;border-radius:16px;">
          <tr>
            <td align="center" style="background-color:#17212f;border-radius:16px 16px 0 0;padding:30px 24px;">
              <span style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-1px;">Dish</span><span
                style="color:#fb923c;font-size:30px;font-weight:800;letter-spacing:-1px;">Dash</span>
              <p style="color:#cbd5e1;font-size:12px;letter-spacing:2px;margin:10px 0 0;text-transform:uppercase;">
                Good food. Delivered.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 12px;">
              <h1 style="color:#17212f;font-size:25px;line-height:1.3;margin:0 0 16px;">
                ${escapeHtml(heading)}
              </h1>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0;">
                ${escapeHtml(description)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:22px 12px;">
                    <p style="color:#9a3412;font-size:12px;font-weight:700;letter-spacing:1px;
                              margin:0 0 12px;text-transform:uppercase;">
                      Your verification code
                    </p>
                    <p style="color:#17212f;font-size:34px;font-weight:800;letter-spacing:8px;
                              line-height:1.2;margin:0;">
                      ${escapeHtml(code)}
                    </p>
                    <p style="color:#9a3412;font-size:13px;margin:14px 0 0;">
                      This code expires in 10 minutes.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${actionButton}
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
                ${escapeHtml(securityNote)}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#f8fafc;border-top:1px solid #e5e7eb;
                                       border-radius:0 0 16px 16px;padding:22px 24px;">
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">
                Sent by the DishDash team. Please do not share your verification code.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const mailTransporter = getTransporter();

  const from =
    process.env.FROM_EMAIL?.trim() ||
    `"Dish Dash" <${process.env.SMTP_USER.trim()}>`;

  await mailTransporter.sendMail({
    from,

    to,

    subject,

    text,

    html,
  });
};

// ======================================

// SEND EMAIL VERIFICATION CODE

// ======================================

const sendVerificationEmail = async (email, verificationCode) => {
  const message = `

Hello,

Welcome to Dish Dash!

Thank you for creating an account with us.

To complete your registration and activate your account, please verify your email address using the code below.

Your verification code:

${verificationCode}

This code is valid for 10 minutes.

For your security, please do not share this code with anyone.

If you did not create a Dish Dash account, you may safely ignore this email.

Thank you for choosing Dish Dash.

Kind regards,

The Dish Dash Team

`;

  await sendEmail({
    to: email,

    subject: "Dish Dash | Email Verification",

    text: message.trim(),

    html: buildBrandedEmail({
      heading: "Welcome to DishDash!",
      description:
        "You're almost ready to explore DishDash. Enter the six-digit code below to verify your email address and activate your account.",
      code: verificationCode,
      securityNote:
        "If you didn't create a DishDash account, you can safely ignore this email.",
    }),
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

To reset your password, please use the verification code and secure link below.

Your password reset code:

${resetCode}

Password reset link:

${resetLink}

Follow these steps to complete the process:

1. Open the password reset link.

2. Enter the six-digit verification code.

3. Create a new password.

4. Confirm your new password.

5. Submit your request to complete the password reset.

Your new password must be different from your current password.

For security purposes, the verification code and reset link will expire 10 minutes after the request was made.

If you did not request a password reset, please ignore this email. Your current password will remain unchanged.

Kind regards,

The Dish Dash Team

`;

  await sendEmail({
    to: email,

    subject: "Dish Dash | Password Reset Request",

    text: message.trim(),

    html: buildBrandedEmail({
      heading: "Reset your password",
      description:
        "We received a request to reset your DishDash password. Open the secure link below and enter this six-digit code to choose a new password.",
      code: resetCode,
      actionUrl: resetLink,
      actionLabel: "Reset my password",
      securityNote:
        "If you didn't request a password reset, ignore this email. Your current password will remain unchanged.",
    }),
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
      ? "Your password reset link has expired. Please request a new link."
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
          "Please provide your name, surname, email address, and password to complete registration.",
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

    // VALIDATE ROLE

    // ======================================

    const selectedRole = role === undefined ? "customer" : role;

    if (!ALLOWED_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        message: "Please select a valid account type.",
      });
    }

    // ======================================

    // NORMALIZE EMAIL

    // ======================================

    const normalizedEmail = normalizeEmail(email);

    // ======================================

    // CHECK EXISTING USER

    // ======================================

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
          "Your account has been created, but we could not send the verification email. Please request a new verification code to activate your account.",

        emailSent: false,

        user: publicUser(user),
      });
    }

    // ======================================

    // REGISTRATION SUCCESS

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

    // ======================================

    // VALIDATE REQUEST

    // ======================================

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

    // CHECK EXPIRY

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

    // VERIFY CODE

    // ======================================

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        message:
          "The verification code is incorrect. Please check the code and try again.",
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

    // ======================================

    // VALIDATE EMAIL

    // ======================================

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

    // ======================================

    // CHECK VERIFICATION STATUS

    // ======================================

    if (user.isVerified) {
      return res.status(400).json({
        message: "Your email address is already verified. You can now sign in.",
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
      console.error("Resend verification email error:", emailError);

      return res.status(503).json({
        message:
          "We could not send your verification code at this time. Please try again shortly.",
      });
    }

    // ======================================

    // SUCCESS

    // ======================================

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

    // ======================================

    // VALIDATE EMAIL

    // ======================================

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // ======================================

    // FIND USER

    // ======================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    const successMessage =
      "If an account exists with this email address, password reset instructions will be sent shortly.";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
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

      // Clear only this failed reset request.

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

    // ======================================

    // SUCCESS

    // ======================================

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

    // ======================================

    // FIND RESET REQUEST

    // ======================================

    const result = await findResetRequest(email, token);

    // ======================================

    // CHECK INVALID / EXPIRED TOKEN

    // ======================================

    if (result.error) {
      if (result.error === "RESET_LINK_EXPIRED" && result.user) {
        await User.updateOne(
          {
            _id: result.user._id,

            passwordResetToken: result.user.passwordResetToken,
          },

          {
            $set: {
              passwordResetCode: null,

              passwordResetToken: null,

              passwordResetExpires: null,
            },
          },
        );
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

    // VALIDATE RESET LINK

    // ======================================

    const result = await findResetRequest(email, token);

    if (result.error) {
      return sendResetLinkError(res, result.error);
    }

    const { user, expiresAt } = result;

    const resetCode = String(code ?? "").trim();

    // ======================================

    // VALIDATE RESET CODE FORMAT

    // ======================================

    if (!/^\d{6}$/.test(resetCode)) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message: "Please enter a valid six-digit password reset code.",
      });
    }

    // ======================================

    // VERIFY RESET CODE

    // ======================================

    if (hashResetValue(resetCode) !== user.passwordResetCode) {
      return res.status(400).json({
        code: "RESET_CODE_INVALID",

        message:
          "The password reset code is incorrect. Please check the code and try again.",
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

    // CHECK PASSWORD CONFIRMATION

    // ======================================

    if (password !== confirmPassword) {
      return res.status(400).json({
        message:
          "The passwords you entered do not match. Please ensure both fields contain the same password.",
      });
    }

    // ======================================

    // CHECK PASSWORD REQUIREMENTS

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

    // PREVENT TOKEN REUSE

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
    console.error("Reset password error:", error);

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

    // VALIDATE CREDENTIALS

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

    // LOGIN SUCCESS

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
