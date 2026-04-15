import { useState } from "react";

function CreateUser() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    const res = await fetch("http://localhost:3001/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        employeeNumber
      })
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "500px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #ddd",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      <h2
        style={{
          marginBottom: "20px",
          fontSize: "26px",
          fontWeight: "600",
          textAlign: "center"
        }}
      >
        Új felhasználó létrehozása
      </h2>

      {/* Törzsszám */}
      <label style={{ fontWeight: "600" }}>Törzsszám</label>
      <input
        type="text"
        placeholder="pl. 12345"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        style={inputStyle}
      />

      {/* Név */}
      <label style={{ fontWeight: "600" }}>Név</label>
      <input
        type="text"
        placeholder="pl. Kovács Péter"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      {/* Email */}
      <label style={{ fontWeight: "600" }}>Email cím</label>
      <input
        type="email"
        placeholder="pl. peter.kovacs@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      {/* Gomb */}
      <button
        onClick={handleCreate}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "600",
          transition: "0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#005fcc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
      >
        Felhasználó létrehozása
      </button>

      {/* Üzenet */}
      {message && (
        <p
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#f0f8ff",
            border: "1px solid #bcdfff",
            borderRadius: "6px",
            textAlign: "center",
            fontWeight: "500"
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px"
};

export default CreateUser;
