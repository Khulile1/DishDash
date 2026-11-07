// ======================================
// IMPORTS
// ======================================

// Import the configured Axios instance
import api from "./api";

// ======================================
// REGISTER USER
// ======================================

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

// ======================================
// LOGIN USER
// ======================================

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

// ======================================
// LOGOUT USER
// ======================================

export const logoutUser = () => {
  localStorage.removeItem("token");

  localStorage.removeItem("user");
};

// ======================================
// VERIFY EMAIL
// ======================================

export const verifyEmail = async (email, code) => {
  const response = await api.post("/auth/verify-email", {
    email,
    code,
  });

  return response.data;
};

// ======================================
// RESEND VERIFICATION CODE
// ======================================

export const resendVerificationCode = async (email) => {
  const response = await api.post("/auth/resend-verification", {
    email,
  });

  return response.data;
};

// ======================================
// FORGOT PASSWORD
// ======================================

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};

// ======================================
// VERIFY PASSWORD RESET LINK
// ======================================

// This is called when the user clicks the link
// from the password-reset email.
//
// It ONLY checks:
// - email
// - token
// - whether the token exists
// - whether the token has expired
//
// It does NOT change the password.
export const verifyResetToken = async ({ email, token }) => {
  const response = await api.post("/auth/verify-reset-token", {
    email,
    token,
  });

  return response.data;
};

// ======================================
// RESET PASSWORD
// ======================================

// This is ONLY called after the user has:
// - entered the 6-digit code
// - entered a new password
// - confirmed the new password
export const resetPassword = async ({
  email,
  token,
  code,
  password,
  confirmPassword,
}) => {
  const response = await api.post("/auth/reset-password", {
    email,
    token,
    code,
    password,
    confirmPassword,
  });

  return response.data;
};
