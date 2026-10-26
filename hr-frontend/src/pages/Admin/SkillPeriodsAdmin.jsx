import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";

function SkillPeriodsAdmin() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("token");

  const loadPeriods = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/skills/periods`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setPeriods(data.periods);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPeriod = async () => {
    if (!label.trim() || !startDate || !endDate) {
      return alert("Minden mező kitöltése kötelező.");
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/skills/periods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label, start_date: startDate, end_date: endDate })
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setLabel("");
        setStartDate("");
        setEndDate("");
        loadPeriods();
      } else {
        alert(data.message || "Hiba történt.");
      }
    } catch {
      alert("Szerver hiba.");
    } finally {
      setCreating(false);
    }
  };

  const closePeriod = async (id) => {
    if (!window.confirm("Biztosan lezárod ezt az időszakot? Utána a leaderek nem tudják tovább szerkeszteni az értékeléseket.")) return;

    const res = await fetch(`${API_BASE_URL}/skills/periods/${id}/close`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.success) {
      loadPeriods();
    } else {
      alert(data.message || "Hiba történt.");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Betöltés...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "10px" }}>Skill-értékelési időszakok</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Egy időszak megnyitásakor a rendszer automatikusan előkészíti az értékeléseket
        minden aktív, vezetővel rendelkező dolgozóra.
      </p>

      {/* ÚJ IDŐSZAK */}
      <div
        style={{
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "25px"
        }}
      >
        <h4 style={{ marginTop: 0 }}>Új időszak nyitása</h4>

        <input
          type="text"
          placeholder="Elnevezés (pl. 2026 H1)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "13px", color: "#666" }}>Kezdő dátum</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "13px", color: "#666" }}>Záró dátum</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        <button
          onClick={createPeriod}
          disabled={creating}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: creating ? "default" : "pointer",
            opacity: creating ? 0.7 : 1
          }}
        >
          {creating ? "Nyitás..." : "Időszak nyitása"}
        </button>
      </div>

      {/* LISTA */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th style={thStyle}>Elnevezés</th>
              <th style={thStyle}>Időszak</th>
              <th style={thStyle}>Kitöltöttség</th>
              <th style={thStyle}>Státusz</th>
              <th style={thStyle}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, index) => (
              <tr key={p.id} style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={tdStyle}>{p.label}</td>
                <td style={tdStyle}>{p.start_date} – {p.end_date}</td>
                <td style={tdStyle}>
                  {p.submitted_count} / {p.evaluation_count}
                  {p.evaluation_count > 0 && (
                    <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>
                      ({Math.round((p.submitted_count / p.evaluation_count) * 100)}%)
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "white",
                      background: p.status === "open" ? "#4C6EF5" : "#868e96"
                    }}
                  >
                    {p.status === "open" ? "Nyitva" : "Lezárva"}
                  </span>
                </td>
                <td style={tdStyle}>
                  {p.status === "open" && (
                    <button
                      onClick={() => closePeriod(p.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#fa5252",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Lezárás
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td style={tdStyle} colSpan={5}>Még nincs létrehozott időszak.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #ddd" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };

export default SkillPeriodsAdmin;