import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from "recharts";

export default function EmployeeSkillProfile() {
  const { employee_number } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:3001/api/skills/employee/${employee_number}/periods`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Hiba történt az időszakok betöltésekor.");
          return;
        }
        setPeriods(data.periods);
        if (data.periods.length > 0) {
          setSelectedPeriod(data.periods[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setError("Szerver hiba"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee_number]);

  useEffect(() => {
    if (!selectedPeriod) return;

    setLoading(true);
    fetch(`http://localhost:3001/api/skills/employee/${employee_number}/evaluation?period_id=${selectedPeriod}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Hiba történt az értékelés betöltésekor.");
          setEvaluation(null);
        } else {
          setEvaluation(data.evaluation);
          setError("");
        }
      })
      .catch(() => setError("Szerver hiba"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, employee_number]);

  if (error && periods.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "#e03131" }}>{error}</p>
        <button onClick={() => navigate(-1)}>Vissza</button>
      </div>
    );
  }

  if (loading && periods.length === 0) {
    return <div style={{ padding: "20px" }}>Betöltés...</div>;
  }

  if (periods.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>← Vissza</button>
        <p style={{ color: "#999", marginTop: "20px" }}>
          Ehhez a dolgozóhoz még nincs beküldött skill-értékelés.
        </p>
      </div>
    );
  }

  const radarData = evaluation
    ? evaluation.general_scores.map(s => ({ subject: s.label, score: s.score }))
    : [];

  const groupedByGroup = {};
  if (evaluation) {
    evaluation.group_scores.forEach(s => {
      if (!groupedByGroup[s.group_name]) groupedByGroup[s.group_name] = [];
      groupedByGroup[s.group_name].push(s);
    });
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backButtonStyle}>← Vissza</button>

      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Skill-profil</h2>

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

        {loading && <p>Betöltés...</p>}

        {!loading && evaluation && (
          <>
            <p style={{ color: "#666" }}>
              Értékelte: <strong>{evaluation.leader_name}</strong> ·
              Beküldve: {new Date(evaluation.submitted_at).toLocaleString("hu-HU")}
            </p>

            {/* RADAR CHART – általános szempontok */}
            <h4 style={{ marginTop: "20px" }}>Általános szempontok</h4>
            {radarData.length === 0 ? (
              <p style={{ color: "#999" }}>Nincs adat.</p>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
                    <Radar
                      name="Pontszám"
                      dataKey="score"
                      stroke="#4C6EF5"
                      fill="#4C6EF5"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Részletes lista az általános szempontokhoz (megjegyzésekkel) */}
            <div style={{ marginTop: "15px" }}>
              {evaluation.general_scores.map((s, idx) => (
                <div key={idx} style={rowStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{s.label}</strong>
                    <span style={scoreBadgeStyle(s.score)}>{s.score} / 5</span>
                  </div>
                  {s.comment && <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>{s.comment}</p>}
                </div>
              ))}
            </div>

            {/* CSOPORT-PONTOK – sima lista, nem radar chart */}
            {Object.keys(groupedByGroup).length > 0 && (
              <>
                <h4 style={{ marginTop: "25px" }}>Extra szempontok</h4>
                {Object.entries(groupedByGroup).map(([groupName, items]) => (
                  <div key={groupName} style={{ marginBottom: "15px" }}>
                    <div style={{ fontWeight: "600", color: "#4C6EF5", marginBottom: "6px" }}>{groupName}</div>
                    {items.map((s, idx) => (
                      <div key={idx} style={rowStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{s.label}</strong>
                          <span style={scoreBadgeStyle(s.score)}>{s.score} / 5</span>
                        </div>
                        {s.comment && <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>{s.comment}</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const backButtonStyle = {
  marginBottom: "20px",
  padding: "6px 12px",
  background: "#f1f3f5",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const rowStyle = {
  padding: "10px 12px",
  background: "#f8f9fa",
  borderRadius: "8px",
  marginBottom: "8px",
  border: "1px solid #eee"
};

function scoreBadgeStyle(score) {
  let color = "#868e96";
  if (score >= 4) color = "#40c057";
  else if (score === 3) color = "#fab005";
  else color = "#e03131";

  return {
    padding: "2px 10px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "white",
    background: color
  };
}