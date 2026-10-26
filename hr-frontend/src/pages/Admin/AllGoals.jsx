import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AllGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    leader: "",
    status: "" // "", "active", "closed"
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE_URL}/goals/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Hiba történt a célok betöltésekor.");
        } else {
          setGoals(data.goals);
        }
      })
      .catch(() => setError("Szerver hiba"))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredGoals = goals.filter(g => {
    const matchesName = g.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesLeader = g.leader_name.toLowerCase().includes(filters.leader.toLowerCase());
    const matchesStatus =
      filters.status === "" ||
      (filters.status === "closed" && g.closed_at) ||
      (filters.status === "active" && !g.closed_at);

    return matchesName && matchesLeader && matchesStatus;
  });

  if (loading) return <div style={{ padding: "20px" }}>Betöltés...</div>;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "#e03131" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "28px", fontWeight: "600" }}>
        Összes cél áttekintése
      </h2>

      {/* SZŰRŐK */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "20px",
          flexWrap: "wrap",
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #ddd"
        }}
      >
        <input
          type="text"
          placeholder="Cél neve..."
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          style={filterStyle}
        />

        <input
          type="text"
          placeholder="Kitűzte (leader neve)..."
          value={filters.leader}
          onChange={(e) => setFilters({ ...filters, leader: e.target.value })}
          style={filterStyle}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={filterStyle}
        >
          <option value="">Összes státusz</option>
          <option value="active">Aktív</option>
          <option value="closed">Lezárva</option>
        </select>
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
              <th style={thStyle}>Cél neve</th>
              <th style={thStyle}>Kitűzte</th>
              <th style={thStyle}>Hozzárendeltek</th>
              <th style={thStyle}>Létrehozva</th>
              <th style={thStyle}>Státusz</th>
              <th style={thStyle}>Művelet</th>
            </tr>
          </thead>

          <tbody>
            {filteredGoals.map((goal, index) => (
              <tr
                key={goal.id}
                style={{
                  background: index % 2 === 0 ? "#ffffff" : "#fafafa"
                }}
              >
                <td style={tdStyle}>{goal.name}</td>
                <td style={tdStyle}>{goal.leader_name}</td>
                <td style={tdStyle}>
                  {goal.assigned && goal.assigned.length > 0
                    ? goal.assigned.map(a => a.name).join(", ")
                    : "-"}
                </td>
                <td style={tdStyle}>{goal.created_at}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "white",
                      background: goal.closed_at ? "#40c057" : "#4C6EF5"
                    }}
                  >
                    {goal.closed_at ? "Lezárva" : "Aktív"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => navigate(`/leader/goal/${goal.id}`)}
                    style={{
                      padding: "6px 12px",
                      background: "#228be6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Megtekintés
                  </button>
                </td>
              </tr>
            ))}

            {filteredGoals.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={6}>Nincs a szűrésnek megfelelő cél.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const filterStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  minWidth: "180px"
};

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

export default AllGoals;