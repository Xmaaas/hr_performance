import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from "recharts";

const STATUS_COLORS = {
  active: "#4C6EF5",
  closed: "#40c057",
  overdue: "#e03131"
};

const LINE_COLORS = ["#4C6EF5", "#40c057", "#fab005", "#e03131", "#7950f2", "#15aabf", "#e64980", "#495057"];

function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export default function MyDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  const [skillsData, setSkillsData] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard/my-goals-timeline`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setGoals(data.goals);
      })
      .finally(() => setLoadingGoals(false));

    fetch(`${API_BASE_URL}/dashboard/my-skills-trend`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSkillsData(data);
      })
      .finally(() => setLoadingSkills(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gantt-szerű vízszintes sávdiagram adatai: egy "offset" (láthatatlan) + egy "duration" (látható) sáv célonként
  const earliestDate = goals.length > 0
    ? goals.reduce((min, g) => (g.created_at < min ? g.created_at : min), goals[0].created_at)
    : null;

  const ganttData = goals.map(g => ({
    name: g.name,
    description: g.description,
    participants: g.participants.map(p => p.name).join(", "),
    deadline: g.deadline,
    status: g.status,
    offset: earliestDate ? daysBetween(earliestDate, g.created_at) - 1 : 0,
    duration: daysBetween(g.created_at, g.deadline || g.created_at),
    goalId: g.id
  }));

  return (
    <div style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "28px", fontWeight: "600" }}>Áttekintés</h2>

      {/* CÉLOK IDŐVONALA */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
        <h3 style={{ marginTop: 0 }}>Céljaim idővonalon</h3>

        {loadingGoals && <p>Betöltés...</p>}

        {!loadingGoals && goals.length === 0 && (
          <p style={{ color: "#999" }}>Jelenleg nincs hozzád rendelt vagy általad létrehozott cél.</p>
        )}

        {!loadingGoals && goals.length > 0 && (
          <div style={{ width: "100%", height: Math.max(200, ganttData.length * 50) }}>
            <ResponsiveContainer>
              <BarChart data={ganttData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} label={{ value: "Napok", position: "insideBottom", offset: -5 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip content={<GanttTooltip />} />
                <Bar dataKey="offset" stackId="a" fill="transparent" />
                <Bar
                  dataKey="duration"
                  stackId="a"
                  radius={[4, 4, 4, 4]}
                  onClick={(data) => navigate(`/leader/goal/${data.goalId}`)}
                  style={{ cursor: "pointer" }}
                >
                  {ganttData.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "13px" }}>
          <LegendDot color={STATUS_COLORS.active} label="Aktív" />
          <LegendDot color={STATUS_COLORS.closed} label="Lezárva" />
          <LegendDot color={STATUS_COLORS.overdue} label="Határidőn túl" />
        </div>
      </div>

      {/* SKILL-TREND */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0 }}>Skill-értékeléseim alakulása</h3>

        {loadingSkills && <p>Betöltés...</p>}

        {!loadingSkills && (!skillsData || skillsData.series.length === 0) && (
          <p style={{ color: "#999" }}>Még nincs beküldött skill-értékelésed.</p>
        )}

        {!loadingSkills && skillsData && skillsData.series.length > 0 && (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={skillsData.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {skillsData.criteriaLabels.map((label, idx) => (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function GanttTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div style={{
      background: "white",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "10px 14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      maxWidth: "280px"
    }}>
      <strong>{data.name}</strong>
      {data.description && (
        <p style={{ margin: "6px 0", fontSize: "13px", color: "#666" }}>{data.description}</p>
      )}
      <p style={{ margin: "4px 0", fontSize: "12px" }}>
        <strong>Határidő:</strong> {data.deadline || "Nincs megadva"}
      </p>
      <p style={{ margin: "4px 0", fontSize: "12px" }}>
        <strong>Résztvevők:</strong> {data.participants || "-"}
      </p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
      <span>{label}</span>
    </div>
  );
}