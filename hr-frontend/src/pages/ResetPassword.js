import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:3001/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    const data = await res.json();

    if (data.success) {
      setMessage("A jelszó sikeresen beállítva!");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage(data.message || "Hiba történt");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Új jelszó beállítása</h2>

      <input
        type="password"
        placeholder="Új jelszó"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      <button onClick={handleSubmit}>Jelszó mentése</button>

      <p>{message}</p>
    </div>
  );
}

export default ResetPassword;
