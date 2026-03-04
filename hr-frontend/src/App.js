import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Employees from "./pages/Employees";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import CreateUser from "./pages/CreateUser";
import AuditLog from "./pages/AuditLog";
import MyProfile from "./pages/MyProfile";

function RoleProtectedRoute({ allowedRoles, children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/me" />;
  }

  return children;
}


function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogin = () => {
    setToken(localStorage.getItem("token"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isLeader = user?.role === "leader";

  return (
    <Router>
      <div style={{ padding: "20px" }}>

        {/* NAVBAR */}
        <nav
          style={{
            marginBottom: "20px",
            padding: "12px 20px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Arial, sans-serif"
          }}
        >
          {/* Bal oldal – logó / app név */}
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4C6EF5" }}>
            HR Performance
          </div>

          {/* Jobb oldal – menüpontok */}
          {token && user && (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              
              {/* Saját adatok */}
              <NavItem to="/me" label="Saját adataim" />

              {/* Dolgozók – csak admin/hr/leader */}
              {(isAdmin || isHR || isLeader) && (
                <NavItem to="/employees" label="Dolgozók" />
              )}

              {/* Új felhasználó – admin/hr */}
              {(isAdmin || isHR) && (
                <NavItem to="/create-user" label="Új felhasználó" />
              )}

              {/* Audit log – csak admin */}
              {isAdmin && <NavItem to="/audit-log" label="Audit napló" />}

              {/* Logout gomb */}
              <button
                onClick={handleLogout}
                style={{
                  background: "#ff4d4d",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Kijelentkezés
              </button>
            </div>
          )}
        </nav>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Navigate to="/me" />} />

          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Saját adatok */}
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />

          {/* Új felhasználó */}
          <Route
            path="/create-user"
            element={
              <ProtectedRoute>
                <CreateUser />
              </ProtectedRoute>
            }
          />

          {/* Audit log */}
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute>
                <AuditLog />
              </ProtectedRoute>
            }
          />

          {/* Dolgozók */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "hr", "leader"]}>
                  <Employees />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
        </Routes>

      </div>
    </Router>
  );
}


function NavItem({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: active ? "white" : "#333",
        background: active ? "#4C6EF5" : "transparent",
        fontWeight: active ? "bold" : "normal",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.target.style.background = "#f1f3f5";
      }}
      onMouseLeave={(e) => {
        if (!active) e.target.style.background = "transparent";
      }}
    >
      {label}
    </Link>
  );
}


export default App;
