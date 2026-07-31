import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function SkillEvaluationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // { [criteria_id]: { score, comment } }
  const [generalAnswers, setGeneralAnswers] = useState({});
  const [groupAnswers, setGroupAnswers] = useState({});

  const loadEvaluation = () => {
    setLoading(true);
    fetch(`http://localhost:3001/api/skills/evaluations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Hiba történt az értékelés betöltésekor.");
          return;
        }

        setEvaluation(data.evaluation);

        const gAnswers = {};
        data.evaluation.general_criteria.forEach(c => {
          gAnswers[c.id] = { score: c.score || 3, comment: c.comment || "" };
        });
        setGeneralAnswers(gAnswers);

        const grAnswers = {};
        data.evaluation.group_criteria.forEach(c => {
          grAnswers[c.id] = { score: c.score || 3, comment: c.comment || "" };
        });
        setGroupAnswers(grAnswers);
      })
      .catch(() => setError("Szerver hiba"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const buildPayload = () => ({
    general_scores: Object.entries(generalAnswers).map(([criteria_id, v]) => ({
      criteria_id: Number(criteria_id),
      score: Number(v.score),
      comment: v.comment
    })),
    group_scores: Object.entries(groupAnswers).map(([criteria_id, v]) => ({
      criteria_id: Number(criteria_id),
      score: Number(v.score),
      comment: v.comment
    }))
  });

  const save = async (submit) => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/skills/evaluations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...buildPayload(), submit })
      });

      const data = await res.json();

      if (data.success) {
        if (submit) {
          alert("Értékelés sikeresen beküldve.");
          navigate(-1);
        } else {
          alert("Piszkozat elmentve.");
          loadEvaluation();
        }
      } else {
        alert(data.message || "Hiba történt.");
      }
    } catch {
      alert("Szerver hiba.");
    } finally {
      setSaving(false);
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

  if (!evaluation) return null;

  const isSubmitted = evaluation.status === "submitted";
  const isPeriodClosed = evaluation.period_status === "closed";
  const readOnly = isSubmitted || isPeriodClosed;

  // Csoport-szempontok csoportosítása group_name szerint a szebb megjelenítéshez
  const groupedByGroup = {};
  evaluation.group_criteria.forEach(c => {
    if (!groupedByGroup[c.group_name]) groupedByGroup[c.group_name] = [];
    groupedByGroup[c.group_name].push(c);
  });

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", padding: "6px 12px", background: "#f1f3f5", border: "none", borderRadius: "6px", cursor: "pointer" }}
      >
        ← Vissza
      </button>

      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>{evaluation.employee_name}</h2>
        <p style={{ color: "#666" }}>
          Időszak: <strong>{evaluation.period_label}</strong>
          {readOnly && (
            <span style={{ marginLeft: "10px", color: isSubmitted ? "#40c057" : "#e03131" }}>
              ({isSubmitted ? "Beküldve" : "Időszak lezárva"})
            </span>
          )}
        </p>

        {/* ÁLTALÁNOS SZEMPONTOK */}
        <h4 style={{ marginTop: "25px" }}>Általános szempontok</h4>
        {evaluation.general_criteria.length === 0 && <p style={{ color: "#999" }}>Nincs felvéve általános szempont.</p>}

        {evaluation.general_criteria.map(c => (
          <CriteriaRow
            key={`g-${c.id}`}
            criteria={c}
            value={generalAnswers[c.id]}
            readOnly={readOnly}
            onChange={(v) => setGeneralAnswers({ ...generalAnswers, [c.id]: v })}
          />
        ))}

        {/* CSOPORT-SZEMPONTOK */}
        {Object.keys(groupedByGroup).length > 0 && (
          <>
            <h4 style={{ marginTop: "25px" }}>Extra szempontok</h4>
            {Object.entries(groupedByGroup).map(([groupName, items]) => (
              <div key={groupName} style={{ marginBottom: "15px" }}>
                <div style={{ fontWeight: "600", color: "#4C6EF5", marginBottom: "6px" }}>{groupName}</div>
                {items.map(c => (
                  <CriteriaRow
                    key={`gr-${c.id}`}
                    criteria={c}
                    value={groupAnswers[c.id]}
                    readOnly={readOnly}
                    onChange={(v) => setGroupAnswers({ ...groupAnswers, [c.id]: v })}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        {!readOnly && (
          <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
            <button
              onClick={() => save(false)}
              disabled={saving}
              style={{
                padding: "10px 18px",
                background: "#868e96",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1
              }}
            >
              Piszkozat mentése
            </button>

            <button
              onClick={() => {
                if (window.confirm("Biztosan beküldöd az értékelést? Beküldés után nem módosítható.")) {
                  save(true);
                }
              }}
              disabled={saving}
              style={{
                padding: "10px 18px",
                background: "#40c057",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? "Beküldés..." : "Beküldés"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaRow({ criteria, value, readOnly, onChange }) {
  return (
    <div
      style={{
        padding: "12px",
        background: "#f8f9fa",
        borderRadius: "8px",
        marginBottom: "10px",
        border: "1px solid #eee"
      }}
    >
      <div style={{ fontWeight: "600" }}>{criteria.label}</div>
      {criteria.description && <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{criteria.description}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
        <label style={{ fontSize: "13px" }}>Pontszám:</label>
        <select
          value={value?.score || 3}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, score: e.target.value })}
          style={{ padding: "5px", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="1">1 - Gyenge</option>
          <option value="2">2 - Fejlődő</option>
          <option value="3">3 - Megfelelő</option>
          <option value="4">4 - Jó</option>
          <option value="5">5 - Kiemelkedő</option>
        </select>
      </div>

      <textarea
        placeholder="Megjegyzés (opcionális)"
        value={value?.comment || ""}
        disabled={readOnly}
        onChange={(e) => onChange({ ...value, comment: e.target.value })}
        style={{ width: "100%", marginTop: "8px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", height: "50px" }}
      />
    </div>
  );
}