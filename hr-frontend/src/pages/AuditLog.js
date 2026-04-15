import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    target: "",
    performedBy: ""
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetch("http://localhost:3001/api/audit-log", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setLogs(data));
  }, [user, navigate, token]);

  const filteredLogs = logs.filter(log =>
    (filters.target === "" ||
      (log.target_employee_number || "").toString().includes(filters.target)) &&
    (filters.performedBy === "" ||
      (log.performed_by || "").toString().includes(filters.performedBy))
  );

  return (
    <div style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "28px", fontWeight: "600" }}>
        Audit napló
      </h2>

      {/* SZŰRŐK */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "25px",
          flexWrap: "wrap",
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #ddd"
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontWeight: "600" }}>Érintett dolgozó (törzsszám):</label>
          <input
            type="text"
            placeholder="pl. 12345"
            value={filters.target}
            onChange={(e) => setFilters({ ...filters, target: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontWeight: "600" }}>Végrehajtó (név vagy törzsszám):</label>
          <input
            type="text"
            placeholder="pl. Kovács"
            value={filters.performedBy}
            onChange={(e) => setFilters({ ...filters, performedBy: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />
        </div>
      </div>

      {/* TÁBLÁZAT */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          background: "white"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Művelet</th>
              <th style={thStyle}>Érintett dolgozó</th>
              <th style={thStyle}>Végrehajtotta</th>
              <th style={thStyle}>Időpont</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log, index) => (
              <tr
                key={log.id}
                style={{
                  background: index % 2 === 0 ? "#ffffff" : "#fafafa",
                  transition: "0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eef6ff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    index % 2 === 0 ? "#ffffff" : "#fafafa")
                }
              >
                <td style={tdStyle}>{log.id}</td>
                <td style={tdStyle}>{log.action}</td>
                <td style={tdStyle}>{log.target_employee_number || "-"}</td>
                <td style={tdStyle}>{log.performed_by}</td>
                <td style={tdStyle}>
                  {new Date(log.timestamp).toLocaleString("hu-HU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "600",
  borderBottom: "1px solid #ddd"
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee"
};

export default AuditLog;
