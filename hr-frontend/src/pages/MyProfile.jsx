import { useEffect, useState } from "react";

function MyProfile() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:3001/api/employees/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setData(data));
  }, [token]);

  if (!data) return <p>Betöltés...</p>;

  return (
    <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "420px",
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          textAlign: "center",
          fontFamily: "Arial, sans-serif"
        }}
      >
        {/* Fejléc */}
        <div
          style={{
            background: "linear-gradient(135deg, #4C6EF5, #15AABF)",
            height: "120px",
            borderRadius: "12px",
            marginBottom: "20px"
          }}
        ></div>

        {/* Profilkép hely (opcionális) */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "#eee",
            margin: "-70px auto 10px auto",
            border: "5px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            color: "#666"
          }}
        >
          {data.name.charAt(0)}
        </div>

        <h2 style={{ margin: "10px 0 5px 0" }}>{data.name}</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          {data.role === "leader"
            ? "Csoportvezető"
            : data.role === "hr"
            ? "HR"
            : data.role === "admin"
            ? "Adminisztrátor"
            : "Dolgozó"}
        </p>

        {/* Adatok */}
        <div style={{ textAlign: "left", marginTop: "20px" }}>
          <InfoRow label="Törzsszám" value={data.employee_number} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Osztály" value={data.department} />
          <InfoRow label="Státusz" value={data.status} />
          <InfoRow label="Belépés dátuma" value={data.hire} />
          <InfoRow label="Fizetés" value={data.salary + " EUR"} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "10px 14px",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e9ecef"
      }}
    >
      <strong>{label}:</strong> <span style={{ float: "right" }}>{value}</span>
    </div>
  );
}

export default MyProfile;
