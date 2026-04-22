import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Employees from "./pages/Employees";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import CreateUser from "./pages/CreateUser";
import AuditLog from "./pages/AuditLog";
import MyProfile from "./pages/MyProfile";
import CreateGoal from "./pages/Leader/CreateGoal";
import MyGoals from "./pages/Leader/MyGoals";
import ForgotPassword from "./pages/ForgotPassword";
import GoalDetails from "./pages/Leader/GoalDetails";   // ⬅️ EZT ADD HOZZÁ

function RoleProtectedRoute({ allowedRoles, children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/me" replace />;
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
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4C6EF5" }}>
            HR Performance
          </div>

          {token && user && (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

              <NavItem to="/my-goals" label="Céljaim" />
              <NavItem to="/me" label="Saját adataim" />

              {(isAdmin || isHR || isLeader) && (
                <NavItem to="/employees" label="Dolgozók" />
              )}

              {(isAdmin || isHR) && (
                <NavItem to="/create-user" label="Új felhasználó" />
              )}

              {isAdmin && <NavItem to="/audit-log" label="Audit napló" />}

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
          {/* Jelszó reset – EZT KELL ELŐRE TENNI */}
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {/* LEADER: Új cél létrehozása */}
          <Route
            path="/leader/create-goal"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["leader", "admin"]}>
                  <CreateGoal />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* ⬇️⬇️⬇️ HIÁNYZÓ ROUTE – MOSTANTÓL MŰKÖDIK ⬇️⬇️⬇️ */}
          <Route
            path="/leader/goal/:id"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["leader", "admin"]}>
                  <GoalDetails />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          {/* ⬆️⬆️⬆️ EZ OLDJA MEG A HIBÁT ⬆️⬆️⬆️ */}

          <Route
            path="/my-goals"
            element={
              <ProtectedRoute>
                <MyGoals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/create-user" element={<CreateUser />} />

          <Route
            path="/audit-log"
            element={
              <ProtectedRoute>
                <AuditLog />
              </ProtectedRoute>
            }
          />

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

          {/* EZ LEGYEN A LEGALJÁN! */}
          <Route path="/" element={<Navigate to="/me" replace />} />
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
