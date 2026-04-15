import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (onLogin) onLogin();
      navigate("/employees");
    } else {
      alert("Hibás email vagy jelszó");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "28px",
            fontWeight: "600",
            color: "#003366"
          }}
        >
          Bejelentkezés
        </h2>

        <label style={{ fontWeight: "600" }}>Email</label>
        <input
          type="email"
          placeholder="Email cím"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontWeight: "600" }}>Jelszó</label>
        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={handleLogin}
          style={primaryButton}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0056cc")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
        >
          Belépés
        </button>

        <button
          onClick={() => navigate("/create-user")}
          style={secondaryButton}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f0ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
        >
          Regisztráció
        </button>
          <p
            style={{
              textAlign: "center",
              marginTop: "10px",
              color: "#007bff",
              cursor: "pointer"
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Elfelejtett jelszó?
          </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px"
};

const primaryButton = {
  width: "100%",
  padding: "12px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "600",
  marginTop: "10px",
  transition: "0.2s"
};

const secondaryButton = {
  width: "100%",
  padding: "12px",
  background: "white",
  color: "#007bff",
  border: "2px solid #007bff",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "600",
  marginTop: "10px",
  transition: "0.2s"
};

export default Login;
