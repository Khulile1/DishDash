import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";

function HomePage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Local Bite</h1>
      <h2>Login Successful</h2>
      <p>Your frontend and backend login are working.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;