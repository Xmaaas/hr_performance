import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";

function SkillCriteriaAdmin() {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const token = localStorage.getItem("token");

  const loadCriteria = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/skills/criteria`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setCriteria(data.criteria);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCriteria = async () => {
    if (!newLabel.trim()) return alert("A szempont neve kötelező.");

    const res = await fetch(`${API_BASE_URL}/skills/criteria`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        label: newLabel,
        description: newDescription,
        sort_order: criteria.length
      })
    });

    const data = await res.json();
    if (data.success) {
      setNewLabel("");
      setNewDescription("");
      loadCriteria();
    } else {
      alert(data.message || "Hiba történt.");
    }
  };

  const toggleActive = async (item) => {
    const res = await fetch(`${API_BASE_URL}/skills/criteria/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        label: item.label,
        description: item.description,
        sort_order: item.sort_order,
        active: item.active ? 0 : 1
      })
    });

    const data = await res.json();
    if (data.success) loadCriteria();
  };

  if (loading) return <div style={{ padding: "20px" }}>Betöltés...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Általános skill-szempontok</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Ezek a szempontok mindenkire vonatkoznak, és a dolgozói radar chart tengelyeit adják.
      </p>

      {/* ÚJ SZEMPONT FELVÉTELE */}
      <div
        style={{
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "25px"
        }}
      >
        <h4 style={{ marginTop: 0 }}>Új szempont hozzáadása</h4>
        <input
          type="text"
          placeholder="Szempont neve (pl. Csapatmunka)"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <textarea
          placeholder="Leírás (opcionális)"
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc", height: "60px" }}
        />
        <button
          onClick={addCriteria}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Hozzáadás
        </button>
      </div>

      {/* LISTA */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th style={thStyle}>Név</th>
              <th style={thStyle}>Leírás</th>
              <th style={thStyle}>Státusz</th>
              <th style={thStyle}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((item, index) => (
              <tr key={item.id} style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={tdStyle}>{item.label}</td>
                <td style={tdStyle}>{item.description || "-"}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "white",
                      background: item.active ? "#40c057" : "#adb5bd"
                    }}
                  >
                    {item.active ? "Aktív" : "Inaktív"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      padding: "6px 12px",
                      background: item.active ? "#fa5252" : "#40c057",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    {item.active ? "Inaktiválás" : "Aktiválás"}
                  </button>
                </td>
              </tr>
            ))}
            {criteria.length === 0 && (
              <tr><td style={tdStyle} colSpan={4}>Még nincs felvéve szempont.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #ddd" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };

export default SkillCriteriaAdmin;