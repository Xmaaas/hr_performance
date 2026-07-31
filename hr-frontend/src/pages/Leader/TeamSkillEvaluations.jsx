import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TeamSkillEvaluations() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:3001/api/skills/periods/open", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPeriods(data.periods);
          if (data.periods.length > 0) {
            setSelectedPeriod(data.periods[0].id);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return;

    setLoading(true);
    fetch(`http://localhost:3001/api/skills/evaluations/my-team?period_id=${selectedPeriod}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvaluations(data.evaluations);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "10px" }}>Csapat skill-értékelése</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Válassz időszakot, majd értékeld a beosztottjaidat az általános és az esetleges
        csoport-specifikus szempontok szerint.
      </p>

      {periods.length === 0 && (
        <p style={{ color: "#999" }}>Jelenleg nincs nyitott skill-értékelési időszak.</p>
      )}

      {periods.length > 0 && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "600", marginRight: "10px" }}>Időszak:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.start_date} – {p.end_date})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Betöltés...</p>
          ) : (
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", background: "white" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f0f0f0" }}>
                  <tr>
                    <th style={thStyle}>Dolgozó</th>
                    <th style={thStyle}>Státusz</th>
                    <th style={thStyle}>Beküldve</th>
                    <th style={thStyle}>Művelet</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, index) => (
                    <tr key={ev.id} style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={tdStyle}>{ev.employee_name}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "white",
                            background: ev.status === "submitted" ? "#40c057" : "#fab005"
                          }}
                        >
                          {ev.status === "submitted" ? "Beküldve" : "Kitöltésre vár"}
                        </span>
                      </td>
                      <td style={tdStyle}>{ev.submitted_at ? new Date(ev.submitted_at).toLocaleString("hu-HU") : "-"}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => navigate(`/leader/skill-evaluations/${ev.id}`)}
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
                          {ev.status === "submitted" ? "Megtekintés" : "Kitöltés"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {evaluations.length === 0 && (
                    <tr><td style={tdStyle} colSpan={4}>Nincs értékelendő beosztottad ebben az időszakban.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const thStyle = { padding: "12px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #ddd" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };

export default TeamSkillEvaluations;