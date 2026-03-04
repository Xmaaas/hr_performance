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

  // 🔥 Egyszerű szűrés
  const filteredLogs = logs.filter(log =>
    (filters.target === "" ||
      (log.target_employee_number || "").toString().includes(filters.target)) &&
    (filters.performedBy === "" ||
      (log.performed_by || "").toString().includes(filters.performedBy))
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Audit napló</h2>

      {/* 🔥 SZŰRŐK */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <label>Érintett dolgozó (törzsszám):</label><br />
          <input
            type="text"
            placeholder="pl. 12345"
            value={filters.target}
            onChange={(e) => setFilters({ ...filters, target: e.target.value })}
          />
        </div>

        <div>
          <label>Végrehajtó (név vagy törzsszám):</label><br />
          <input
            type="text"
            placeholder="pl. Kovács"
            value={filters.performedBy}
            onChange={(e) => setFilters({ ...filters, performedBy: e.target.value })}
          />
        </div>
      </div>

      {/* 🔥 TÁBLÁZAT */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Művelet</th>
            <th>Érintett dolgozó</th>
            <th>Végrehajtotta</th>
            <th>Időpont</th>
          </tr>
        </thead>

        <tbody>
          {filteredLogs.map(log => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.action}</td>
              <td>{log.target_employee_number || "-"}</td>
              <td>{log.performed_by}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLog;
