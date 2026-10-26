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
import GoalDetails from "./pages/Leader/GoalDetails";
import AllGoals from "./pages/Admin/AllGoals";
import SkillCriteriaAdmin from "./pages/Admin/SkillCriteriaAdmin";
import SkillGroupsAdmin from "./pages/Admin/SkillGroupsAdmin";
import SkillPeriodsAdmin from "./pages/Admin/SkillPeriodsAdmin";
import TeamSkillEvaluations from "./pages/Leader/TeamSkillEvaluations";
import SkillEvaluationForm from "./pages/Leader/SkillEvaluationForm";
import EmployeeSkillProfile from "./pages/SkillProfile/EmployeeSkillProfile";
import MyDashboard from "./pages/Dashboard/MyDashboard";
import TeamDashboard from "./pages/Dashboard/TeamDashboard";

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// (Imports a többi oldalhoz változatlanul...)

function RoleProtectedRoute({ allowedRoles, children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/me" replace />;
  }
  return children;
}

// --- ÚJ NAVBAR KOMPONENS ---
function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isLeader = user?.role === "leader";

  return (
    <nav
      style={{
        marginBottom: "24px",
        padding: "12px 24px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        border: "1px solid #f1f5f9",
      }}
    >
      {/* BRAND / LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #4C6EF5 0%, #3B5BD5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 10px rgba(76, 110, 245, 0.3)",
          }}
        >
          HR
        </div>
        <span style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em" }}>
          Performance
        </span>
      </div>

      {/* NAVIGÁCIÓS MENÜ */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Általános menüpontok */}
        <NavItem to="/dashboard" label="Áttekintés" />
        {(isAdmin || isHR || isLeader) && <NavItem to="/team-dashboard" label="Csapat áttekintés" />}
        <NavItem to="/my-goals" label="Céljaim" />
        
        {(isAdmin || isHR || isLeader) && <NavItem to="/employees" label="Dolgozók" />}

        {/* SKILL MENÜ GROUP */}
        {(isAdmin || isHR || isLeader) && (
          <NavDropdown
            label="Skill kezelés"
            activePaths={["/leader/skill-evaluations", "/admin/skill-criteria", "/admin/skill-groups", "/admin/skill-periods"]}
          >
            {(isLeader || isAdmin) && (
              <DropdownItem to="/leader/skill-evaluations" label="Csapat skill értékelés" />
            )}
            {(isAdmin || isHR) && (
              <>
                <DropdownItem to="/admin/skill-criteria" label="Skill szempontok" />
                <DropdownItem to="/admin/skill-groups" label="Skill csoportok" />
                <DropdownItem to="/admin/skill-periods" label="Skill időszakok" />
              </>
            )}
          </NavDropdown>
        )}

        {/* ADMIN MENÜ GROUP */}
        {(isAdmin || isHR) && (
          <NavDropdown
            label="Adminisztráció"
            activePaths={["/create-user", "/admin/goals", "/audit-log"]}
          >
            <DropdownItem to="/create-user" label="Új felhasználó" />
            {isAdmin && <DropdownItem to="/admin/goals" label="Összes cél" />}
            {isAdmin && <DropdownItem to="/audit-log" label="Audit napló" />}
          </NavDropdown>
        )}
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link
          to="/me"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: "10px",
            background: location.pathname === "/me" ? "#f8fafc" : "transparent",
            transition: "all 0.2s ease",
            border: "1px solid",
            borderColor: location.pathname === "/me" ? "#e2e8f0" : "transparent",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.2" }}>
              {user?.name || "Profilom"}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {user?.role || "User"}
            </span>
          </div>
        </Link>

        <button
          onClick={onLogout}
          title="Kijelentkezés"
          style={{
            background: "#fff1f2",
            color: "#e11d48",
            border: "1px solid #fecdd3",
            padding: "8px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ffe4e6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff1f2";
          }}
        >
          Kijelentkezés
        </button>
      </div>
    </nav>
  );
}

// --- SEGÉDKOMPONENSEK A NAVBARHOZ ---

function NavItem({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        textDecoration: "none",
        color: active ? "#4C6EF5" : "#475569",
        background: active ? "#edf2ff" : "transparent",
        fontWeight: active ? "600" : "500",
        fontSize: "14px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.background = "#f8fafc";
          e.target.style.color = "#0f172a";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.background = "transparent";
          e.target.style.color = "#475569";
        }
      }}
    >
      {label}
    </Link>
  );
}

function NavDropdown({ label, children, activePaths = [] }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const isChildActive = activePaths.some((path) => location.pathname.startsWith(path));

  // Bezárás külső kattintásra
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          background: isChildActive ? "#edf2ff" : "transparent",
          color: isChildActive ? "#4C6EF5" : "#475569",
          fontWeight: isChildActive ? "600" : "500",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isChildActive) e.currentTarget.style.background = "#f8fafc";
        }}
        onMouseLeave={(e) => {
          if (!isChildActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {label}
        <span style={{ fontSize: "10px", opacity: 0.7, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}>
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            border: "1px solid #f1f5f9",
            padding: "6px",
            minWidth: "180px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        textDecoration: "none",
        color: active ? "#4C6EF5" : "#334155",
        background: active ? "#edf2ff" : "transparent",
        fontWeight: active ? "600" : "400",
        fontSize: "13px",
        transition: "all 0.15s ease",
        display: "block",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.background = "#f1f5f9";
          e.target.style.color = "#0f172a";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.background = "transparent";
          e.target.style.color = "#334155";
        }
      }}
    >
      {label}
    </Link>
  );
}

// --- FŐ APP KOMPONENS ---
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

  return (
    <Router>
      <div style={{ padding: "20px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        
        {/* Csak bejelentkezve jelenítjük meg a modernizált Navbart */}
        {token && user && <Navbar user={user} onLogout={handleLogout} />}

        {/* ROUTES (a meglévő útvonalak változatlanul maradnak) */}
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          <Route path="/dashboard" element={<ProtectedRoute><MyDashboard /></ProtectedRoute>} />
          <Route path="/team-dashboard" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["leader", "admin", "hr"]}><TeamDashboard /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/leader/create-goal" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["leader", "admin"]}><CreateGoal /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/leader/goal/:id" element={<ProtectedRoute><GoalDetails /></ProtectedRoute>} />
          <Route path="/admin/goals" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["admin"]}><AllGoals /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/admin/skill-criteria" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["admin", "hr"]}><SkillCriteriaAdmin /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/admin/skill-groups" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["admin", "hr"]}><SkillGroupsAdmin /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/admin/skill-periods" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["admin", "hr"]}><SkillPeriodsAdmin /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/leader/skill-evaluations" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["leader", "admin"]}><TeamSkillEvaluations /></RoleProtectedRoute></ProtectedRoute>} />
          <Route path="/leader/skill-evaluations/:id" element={<ProtectedRoute><SkillEvaluationForm /></ProtectedRoute>} />
          <Route path="/skills/profile/:employee_number" element={<ProtectedRoute><EmployeeSkillProfile /></ProtectedRoute>} />
          <Route path="/my-goals" element={<ProtectedRoute><MyGoals /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["admin", "hr", "leader"]}><Employees /></RoleProtectedRoute></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/me" replace />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;