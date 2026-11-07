import { useNavigate, useSearchParams } from "react-router-dom";

function UnauthorizedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  const isResetError = reason === "reset-expired" || reason === "reset-invalid";

  let message = "You do not have permission to access this page.";

  if (reason === "reset-expired") {
    message =
      "Your password reset link has expired. Reset links are only valid for 10 minutes. Please request a new link.";
  } else if (reason === "reset-invalid") {
    message =
      "Your password reset link is invalid, has already been used, or has been replaced. Please request a new link.";
  }

  return (
    <div>
      <h1>Access Denied</h1>
      <p>{message}</p>

      {isResetError && (
        <button type="button" onClick={() => navigate("/forgot-password")}>
          Request a New Reset Link
        </button>
      )}

      <button type="button" onClick={() => navigate("/home")}>
        Go Home
      </button>

      <button type="button" onClick={() => navigate("/login")}>
        Login
      </button>
    </div>
  );
}

export default UnauthorizedPage;
