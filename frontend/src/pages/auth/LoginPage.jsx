import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    setLoading(true);

    try {
      // Send email and password to backend
      const data = await loginUser(email, password);

      console.log("Login response:", data);

      // Make sure backend returned a token
      if (!data?.token) {
        setError(
          "Login succeeded, but the server did not return a token."
        );
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user details if backend returned them
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // Successful login
      setSuccess("Login successful!");

      console.log("Login successful");
      console.log("Token saved:", data.token);

      // Redirect after showing success message
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);

      /*
        NO RESPONSE FROM BACKEND

        This usually means:
        - backend is not running
        - wrong backend port
        - wrong API URL
        - CORS/network problem
      */
      if (!error.response) {
        setError(
          "Server connection failed. The API may not be running."
        );
        return;
      }

      const status = error.response.status;
      const backendMessage =
        error.response.data?.message || "";

      /*
        EMAIL NOT FOUND

        Backend should return:
        404
      */
      if (status === 404) {
        setError(
          "Email is incorrect. No account was found with this email."
        );
      }

      /*
        WRONG PASSWORD

        Backend should return:
        401
      */
      else if (status === 401) {
        setError(
          "Password is incorrect."
        );
      }

      /*
        BAD REQUEST
      */
      else if (status === 400) {
        setError(
          backendMessage ||
            "Please enter a valid email and password."
        );
      }

      /*
        TOO MANY REQUESTS
      */

      /*
      else if (status === 429) {
        setError(
          "Too many login attempts. Please try again shortly."
        );
      }


      */
      /*
        SERVER ERROR
      */
      else if (status >= 500) {
        setError(
          "Server error. The backend is having a problem."
        );
      }

      /*
        ANY OTHER API ERROR
      */
      else {
        setError(
          backendMessage ||
            "Login failed because of an API error."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>Local Bite</h1>
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <p className="success-message">
              {success}
            </p>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;