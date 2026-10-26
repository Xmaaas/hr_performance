import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

// Statisztikák (átlag, min, max) kiszámítása az updates tömbből
function computeStats(updates) {
  if (!updates || updates.length === 0) return null;

  const scores = updates
    .map(u => Number(u.progress))
    .filter(p => !Number.isNaN(p));

  if (scores.length === 0) return null;

  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  return { avg, min, max, count: scores.length };
}

export default function GoalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [finalScore, setFinalScore] = useState(3);
  const [finalComment, setFinalComment] = useState("");
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const loadGoal = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/goals/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Hiba történt a cél betöltésekor.");
          setGoal(null);
        } else {
          setGoal(data.goal);
          setError("");
        }
      })
      .catch(() => setError("Szerver hiba"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleClose = async () => {
    if (!window.confirm("Biztosan lezárod ezt a célt? Lezárás után nem módosítható.")) return;

    setClosing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${id}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          final_score: finalScore,
          final_comment: finalComment
        })
      });

      const data = await res.json();

      if (data.success) {
        loadGoal();
      } else {
        alert(data.message || "Hiba történt a lezárás során.");
      }
    } catch {
      alert("Szerver hiba a lezárás során.");
    } finally {
      setClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!window.confirm("Biztosan újranyitod ezt a célt? A végső értékelés törlődik, a cél újra szerkeszthető/értékelhető lesz.")) return;

    setReopening(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${id}/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        loadGoal();
      } else {
        alert(data.message || "Hiba történt az újranyitás során.");
      }
    } catch {
      alert("Szerver hiba az újranyitás során.");
    } finally {
      setReopening(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Betöltés...</div>;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "#e03131" }}>{error}</p>
        <button onClick={() => navigate(-1)}>Vissza</button>
      </div>
    );
  }

  if (!goal) return null;

  const isOwner = user && (goal.leader_id === user.employee_number || user.role === "admin");
  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isClosed = !!goal.closed_at;

  // A grafikont/statisztikákat csak a célt kiadó leader, a HR és az admin látja
  const canSeeStats = isOwner || isHR || isAdmin;

  const stats = computeStats(goal.updates);
  const chartData = (goal.updates || []).map(u => ({
    date: u.created_at,
    progress: Number(u.progress)
  }));

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          padding: "6px 12px",
          background: "#f1f3f5",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        ← Vissza
      </button>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{ margin: 0 }}>{goal.name}</h2>
          <span style={badgeStyle(isClosed ? "#40c057" : "#4C6EF5")}>
            {isClosed ? "Lezárva" : "Aktív"}
          </span>
        </div>

        <p style={{ color: "#666", marginTop: "10px" }}>{goal.description}</p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
          <div style={infoTagStyle}>Kitűzte: <strong>{goal.leader_name}</strong></div>
          <div style={infoTagStyle}>Prioritás: <strong>{goal.priority}</strong></div>
          <div style={infoTagStyle}>Határidő: <strong>{goal.deadline || "Nincs megadva"}</strong></div>
          <div style={infoTagStyle}>Team cél: <strong>{goal.is_team_goal ? "Igen" : "Nem"}</strong></div>
        </div>

        <h4 style={{ marginTop: "20px" }}>Hozzárendelt dolgozók</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {goal.assigned?.map(a => (
            <div key={a.employee_number} style={infoTagStyle}>
              {a.name} ({a.employee_number})
            </div>
          ))}
        </div>

        {/* -----------------------------------------------
            ELŐREHALADÁS GRAFIKON + STATISZTIKÁK
            csak leader (owner) / HR / admin számára
        ----------------------------------------------- */}
        {canSeeStats && (
          <div style={{ marginTop: "25px" }}>
            <h4>Előrehaladás alakulása</h4>

            {!stats && (
              <p style={{ color: "#666" }}>Még nincs elég adat a grafikonhoz.</p>
            )}

            {stats && (
              <>
                {/* Statisztika kártyák */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "15px" }}>
                  <StatCard label="Átlag" value={stats.avg.toFixed(2)} color="#4C6EF5" />
                  <StatCard label="Minimum" value={stats.min} color="#e03131" />
                  <StatCard label="Maximum" value={stats.max} color="#40c057" />
                  <StatCard label="Bejegyzések száma" value={stats.count} color="#868e96" />
                </div>

                {/* Vonaldiagram */}
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} allowDecimals={false} />
                      <Tooltip />
                      <ReferenceLine
                        y={stats.avg}
                        stroke="#4C6EF5"
                        strokeDasharray="4 4"
                        label={{ value: "Átlag", position: "insideTopRight", fill: "#4C6EF5", fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="#228be6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        <h4 style={{ marginTop: "20px" }}>Időközi értékelések (időzítés)</h4>
        {goal.timeline?.map((item, idx) => {
          const hasUpdate = goal.updates?.some(u => u.created_at === item.date);
          let color = "#999";
          if (hasUpdate) color = "green";
          else if (item.status === "pending") color = "orange";
          else if (item.status === "overdue") color = "red";

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
              <span>{item.date}</span>
            </div>
          );
        })}

        <h4 style={{ marginTop: "20px" }}>Előrehaladás</h4>
        {(!goal.updates || goal.updates.length === 0) && <p>Még nincs előrehaladási bejegyzés.</p>}
        {goal.updates?.map(entry => (
          <div
            key={entry.id}
            style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "10px" }}
          >
            <p><strong>Értékelés:</strong> {entry.progress} / 5</p>
            <p><strong>Megjegyzés:</strong> {entry.comment}</p>
            <p style={{ fontSize: "13px", color: "#666" }}>
              <strong>Dátum:</strong> {entry.created_at}
            </p>
          </div>
        ))}

        {isClosed && (
          <div
            style={{
              marginTop: "20px",
              background: "#ebfbee",
              border: "1px solid #40c057",
              borderRadius: "8px",
              padding: "15px"
            }}
          >
            <h4 style={{ marginTop: 0 }}>Lezárás adatai</h4>
            <p><strong>Lezárás dátuma:</strong> {goal.closed_at}</p>
            <p><strong>Végső értékelés:</strong> {goal.final_score} / 5</p>
            <p><strong>Végső megjegyzés:</strong> {goal.final_comment || "-"}</p>

            {isAdmin && (
              <button
                onClick={handleReopen}
                disabled={reopening}
                style={{
                  marginTop: "10px",
                  padding: "8px 14px",
                  background: "#e8590c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: reopening ? "default" : "pointer",
                  opacity: reopening ? 0.7 : 1
                }}
              >
                {reopening ? "Újranyitás..." : "🔓 Cél újranyitása"}
              </button>
            )}
          </div>
        )}

        {!isClosed && isOwner && (
          <div
            style={{
              marginTop: "20px",
              background: "#fff4e6",
              border: "1px solid #ffa94d",
              borderRadius: "8px",
              padding: "15px"
            }}
          >
            <h4 style={{ marginTop: 0 }}>Cél lezárása</h4>

            <label><strong>Végső értékelés (1–5):</strong></label>
            <select
              value={finalScore}
              onChange={e => setFinalScore(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="1">1 - Gyenge</option>
              <option value="2">2 - Fejlődő</option>
              <option value="3">3 - Megfelelő</option>
              <option value="4">4 - Jó</option>
              <option value="5">5 - Kiemelkedő</option>
            </select>

            <div style={{ marginTop: "10px" }}>
              <label><strong>Záró megjegyzés:</strong></label>
              <textarea
                value={finalComment}
                onChange={e => setFinalComment(e.target.value)}
                style={{ width: "100%", height: "80px", marginTop: "5px", padding: "8px" }}
              />
            </div>

            <button
              onClick={handleClose}
              disabled={closing}
              style={{
                marginTop: "10px",
                padding: "8px 14px",
                background: "#40c057",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: closing ? "default" : "pointer",
                opacity: closing ? 0.7 : 1
              }}
            >
              {closing ? "Lezárás..." : "Cél lezárása"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        flex: "1 1 120px",
        background: "#f8f9fa",
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        padding: "12px",
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

const infoTagStyle = {
  padding: "6px 10px",
  background: "#f1f3f5",
  border: "1px solid #dee2e6",
  borderRadius: "6px",
  fontSize: "13px"
};

const badgeStyle = (color) => ({
  padding: "4px 10px",
  borderRadius: "6px",
  background: color,
  color: "white",
  fontSize: "13px",
  fontWeight: "600",
  whiteSpace: "nowrap"
});