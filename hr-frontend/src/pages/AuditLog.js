import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/"); // nincs jogosultság
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Audit napló</h2>

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
          {logs.map(log => (
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
