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

      // 🔥 Token mentése
      localStorage.setItem("token", data.token);

      // 🔥 USER MENTÉSE – EZ HIÁNYZOTT!
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🔥 Navbar frissítése
      if (onLogin) {
        onLogin();
      }

      // 🔥 Átirányítás
      navigate("/employees");
    } else {
      alert("Hibás email vagy jelszó");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Bejelentkezés</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Jelszó"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      <button onClick={handleLogin}>Belépés</button>
      <button onClick={() => navigate("/create-user")}>Új felhasználó létrehozása</button>
    </div>
  );
}

export default Login;
