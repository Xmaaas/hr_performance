import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import Employees from "./pages/Employees";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import CreateUser from "./pages/CreateUser";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogin = () => {
    setToken(localStorage.getItem("token")); // navbar frissül
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isLeader = user?.role === "leader";
  const isUser = user?.role === "user";

  return (
    <Router>
      <div style={{ padding: "20px" }}>

        {/* NAVBAR */}
        <nav style={{ marginBottom: "20px" }}>
          {token && user && (
            <>
              {/* 🔥 Minden szerepkör látja a Dolgozók menüt */}
              <Link to="/employees" style={{ marginRight: "10px" }}>
                Dolgozók
              </Link>

              {/* 🔥 Admin és HR később kaphat extra menüt */}
              {(isAdmin || isHR) && (
                <Link to="/create-user" style={{ marginRight: "10px" }}>
                  Új felhasználó
                </Link>
              )}

              <button onClick={handleLogout}>
                Kijelentkezés
              </button>
            </>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/create-user" element={<CreateUser />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />
        </Routes>

      </div>
    </Router>
  );
}

export default App;
