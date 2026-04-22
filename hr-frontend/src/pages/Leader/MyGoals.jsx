import React, { useEffect, useState } from "react";

function MyGoals() {
  const [assigned, setAssigned] = useState([]);
  const [created, setCreated] = useState([]);
  const [openGoal, setOpenGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [employees, setEmployees] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
    const loadEmployees = async () => {
      const res = await fetch("http://localhost:3001/api/employees", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      const data = await res.json();
      console.log("EMPLOYEES LOADED:", data);
      if (data.success) {
        setEmployees(data.employees);
        console.log("EMPLOYEES STATE SET:", data.employees);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/goals/my", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
      .then(async res => {
        if (!res.ok) {
          console.error("Hiba a backendtől:", res.status);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          setAssigned(data.assignedGoals);
          setCreated(data.createdGoals);
        }
      })
      .catch(err => {
        console.error("Fetch hiba:", err);
      });
  }, []);

  const toggleGoal = (id) => {
    setOpenGoal(openGoal === id ? null : id);
  };

  // -----------------------------
  // TimelineItem – created_at STRING
  // -----------------------------
  function TimelineItem({ entry }) {
    return (
      <div style={{ display: "flex", marginBottom: "20px" }}>
        
        {/* Timeline dátum (időszak) */}
        <div style={{ width: "120px", fontWeight: "bold" }}>
          {entry.created_at}
        </div>

        <div style={{ width: "40px", display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "12px",
            height: "12px",
            background: "#4C6EF5",
            borderRadius: "50%",
            marginTop: "5px"
          }}></div>
        </div>

        <div style={{
          background: "#f8f9fa",
          padding: "12px",
          borderRadius: "8px",
          flex: 1,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
        }}>
          <p><strong>Értékelés:</strong> {entry.progress} / 5</p>
          <p><strong>Megjegyzés:</strong> {entry.comment}</p>

          <p style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>
            <strong>Írta:</strong> {entry.author_name || entry.employee_number}
          </p>

          <p style={{ fontSize: "13px", color: "#666" }}>
            <strong>Bejegyzés dátuma:</strong> {entry.created_real}
          </p>
        </div>

      </div>
    );
  }

  // -----------------------------
  // LeaderUpdateForm – csak létrehozó leader
  // -----------------------------
  function LeaderUpdateForm({ goal, onSaved }) {
    const [progress, setProgress] = useState(3);
    const [comment, setComment] = useState("");

    if (
      (user.role !== "leader" && user.role !== "admin") ||
      goal.leader_id !== user.employee_number
    ) {
      return null;
    }

    const submitUpdate = () => {
      fetch(`http://localhost:3001/api/goals/${goal.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          progress,
          comment
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            onSaved(data.update);
            setComment("");
            setProgress(3);
          }
        });
    };

    return (
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#eef2ff",
          borderRadius: "8px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4>Új értékelés hozzáadása</h4>

        <label><strong>Értékelés (1–5):</strong></label>
        <select
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="1">1 - Gyenge</option>
          <option value="2">2 - Fejlődő</option>
          <option value="3">3 - Megfelelő</option>
          <option value="4">4 - Jó</option>
          <option value="5">5 - Kiemelkedő</option>
        </select>

        <div style={{ marginTop: "10px" }}>
          <label><strong>Megjegyzés:</strong></label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              height: "80px",
              marginTop: "5px",
              padding: "8px"
            }}
          ></textarea>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            submitUpdate();
          }}
          style={{
            marginTop: "10px",
            padding: "8px 14px",
            background: "#4C6EF5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Mentés
        </button>
      </div>
    );
  }

  // -----------------------------
  // PlannedTimeline – string dátumokkal
  // -----------------------------
  function PlannedTimeline({ goal }) {
    if (!goal.timeline) return null;

    const today = new Date().toISOString().split("T")[0];

    const past = goal.timeline.filter(t => t.date < today);
    const todayItem = goal.timeline.find(t => t.date === today);
    const next = goal.timeline.find(t => t.date > today);

    const display = [
      ...past,
      ...(todayItem ? [todayItem] : []),
      ...(next ? [next] : [])
    ];

    return (
      <div style={{ marginTop: "20px" }}>
        <h4>Időközi értékelések</h4>

        {display.map((item, index) => {
          let color = "#999";

          const hasUpdate = goal.updates?.some(u => u.created_at === item.date);

          if (hasUpdate) {
            color = "green";
          } else {
            if (item.status === "pending") color = "orange";
            if (item.status === "overdue") color = "red";
          }

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: color
                }}
              ></div>

              <span>{item.date}</span>

              {hasUpdate && (
                <span style={{ color: "green" }}>✔</span>
              )}
              {item.status === "pending" && !hasUpdate && (
                <span className="pending-icon">⏳</span>
              )}
              {item.status === "overdue" && !hasUpdate && (
                <span className="overdue-icon">⚠</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

// -----------------------------
// Goal card
// -----------------------------
const renderGoal = (goal, setGoalState) => (
  <div
    key={goal.id}
    style={{
      border: "1px solid #ccc",
      padding: "12px",
      marginBottom: "12px",
      borderRadius: "8px",
      cursor: "pointer",
      background: "white",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      width: "100%",
      boxSizing: "border-box"
    }}
    onClick={() => toggleGoal(goal.id)}
  >
    <strong>{goal.name}</strong>

    <div
      style={{
        marginTop: "10px",
        paddingLeft: "10px",
        overflow: "hidden",
        transition: "max-height 0.3s ease",
        maxHeight: openGoal === goal.id ? "2000px" : "0px"
      }}
    >
      {openGoal === goal.id && (
        <>
          {(user.role === "leader" || user.role === "admin") &&
            goal.leader_id === user.employee_number && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEditGoal(goal)}
                  style={{
                    padding: "6px 12px",
                    background: "#228be6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ✏️ Szerkesztés
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm("Biztosan törlöd ezt a célt?")) return;

                    const res = await fetch(`http://localhost:3001/api/goals/${goal.id}`, {
                      method: "DELETE",
                      headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                      }
                    });

                    const data = await res.json();

                    if (data.success) {
                      setAssigned(prev => prev.filter(g => g.id !== goal.id));
                      setCreated(prev => prev.filter(g => g.id !== goal.id));
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#fa5252",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  🗑️ Törlés
                </button>
              </div>
            )}
          
          {/* Leader + Assigned kártyák */}
          <div style={{
            marginTop: "10px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}>
            
            {/* Leader kártya */}
            <div style={{
              padding: "6px 10px",
              background: "#e7f5ff",
              border: "1px solid #74c0fc",
              borderRadius: "6px",
              fontSize: "13px"
            }}>
              Kitűzte: <strong>{goal.leader_name}</strong>
            </div>

            {/* Assigned dolgozók */}
            {goal.assigned?.map(a => (
              <div key={a.employee_number} style={{
                padding: "6px 10px",
                background: "#f1f3f5",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "13px"
              }}>
                {a.name} ({a.employee_number})
              </div>
            ))}

          </div>

          <p><strong>Leírás:</strong> {goal.description}</p>
          <p><strong>Prioritás:</strong> {goal.priority}</p>
          <p><strong>Határidő:</strong> {goal.deadline || "Nincs megadva"}</p>

          <LeaderUpdateForm
            goal={goal}
            onSaved={(newUpdate) => {
              goal.updates.push(newUpdate);
              setGoalState((prev) => [...prev]);
            }}
          />

          <PlannedTimeline goal={goal} />

          <div style={{ marginTop: "20px" }}>
            <h4>Előrehaladás</h4>

            {(!goal.updates || goal.updates.length === 0) && (
              <p>Még nincs előrehaladási bejegyzés.</p>
            )}

            {goal.updates?.map(entry => (
              <TimelineItem key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);

// -----------------------------
// Edit modal
// -----------------------------
const EditModal = ({ editGoal, setEditGoal, employees, setAssigned, setCreated }) => {
  if (!editGoal) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
      onClick={() => setEditGoal(null)}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "450px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Cél szerkesztése</h3>

        {/* Név */}
        <label>Név:</label>
        <input
          type="text"
          defaultValue={editGoal.name}
          id="editName"
          style={{ width: "100%", marginBottom: "10px" }}
        />

        {/* Leírás */}
        <label>Leírás:</label>
        <textarea
          defaultValue={editGoal.description}
          id="editDesc"
          style={{ width: "100%", height: "80px", marginBottom: "10px" }}
        ></textarea>

        {/* Prioritás */}
        <label>Prioritás:</label>
        <select
          defaultValue={editGoal.priority}
          id="editPrio"
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="low">Alacsony</option>
          <option value="medium">Közepes</option>
          <option value="high">Magas</option>
        </select>

        {/* Határidő */}
        <label>Határidő:</label>
        <input
          type="date"
          defaultValue={editGoal.deadline}
          id="editDeadline"
          style={{ width: "100%", marginBottom: "10px" }}
        />

        {/* Gyakoriság */}
        <label>Gyakoriság:</label>
        <select
          defaultValue={editGoal.progress_frequency}
          id="editFreq"
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="weekly">Heti</option>
          <option value="biweekly">Kétheti</option>
          <option value="monthly">Havi</option>
        </select>

        {/* Napok száma */}
        <label>Napok száma (ha kell):</label>
        <input
          type="number"
          defaultValue={editGoal.progress_days || ""}
          id="editDays"
          style={{ width: "100%", marginBottom: "10px" }}
        />

        {/* Team goal */}
        <label>
          <input
            type="checkbox"
            defaultChecked={editGoal.is_team_goal === 1}
            id="editTeam"
            style={{ marginRight: "6px" }}
          />
          Team goal?
        </label>

        <br /><br />

        {/* Hozzárendelt dolgozók */}
        <label>Hozzárendelt dolgozók:</label>
        <select
          multiple
          id="editAssigned"
          defaultValue={editGoal.assigned.map(a => a.employee_number)}
          style={{ width: "100%", height: "100px", marginBottom: "10px" }}
        >
          {employees.map(emp => (
            <option key={emp.employee_number} value={emp.employee_number}>
              {emp.name} ({emp.employee_number})
            </option>
          ))}
        </select>

        {/* MENTÉS */}
        <button
          onClick={async () => {
            const assignedOptions = document.getElementById("editAssigned").selectedOptions;
            const assigned_to = Array.from(assignedOptions).map(o => o.value);

            const updated = {
              name: document.getElementById("editName").value,
              description: document.getElementById("editDesc").value,
              priority: document.getElementById("editPrio").value,
              deadline: document.getElementById("editDeadline").value,
              progress_frequency: document.getElementById("editFreq").value,
              progress_days: document.getElementById("editDays").value,
              is_team_goal: document.getElementById("editTeam").checked,
              assigned_to
            };

            const res = await fetch(`http://localhost:3001/api/goals/${editGoal.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token")
              },
              body: JSON.stringify(updated)
            });

            const data = await res.json();

            if (data.success) {
              // Frissítjük a listákat
              setAssigned(prev => prev.map(g => g.id === editGoal.id ? { ...g, ...updated } : g));
              setCreated(prev => prev.map(g => g.id === editGoal.id ? { ...g, ...updated } : g));
              setEditGoal(null);
            }
          }}
          style={{
            padding: "8px 14px",
            background: "#228be6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%"
          }}
        >
          Mentés
        </button>
      </div>
    </div>
  );
};

  return (
    <div style={{ padding: "20px" }}>
      <EditModal
        editGoal={editGoal}
        setEditGoal={setEditGoal}
        employees={employees}   // <-- EZ KELL
        setAssigned={setAssigned}
        setCreated={setCreated}
      />

      <h2 style={{ marginBottom: "20px" }}>Céljaim</h2>

      <div style={{
        display: "flex",
        gap: "30px",
        alignItems: "flex-start"
      }}>
        <div style={{ flex: 1 }}>
          <h3>Hozzám rendelt célok</h3>
          {assigned.length === 0 && <p>Nincs hozzád rendelt cél.</p>}
          {assigned.map(goal => renderGoal(goal, setAssigned))}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Általam létrehozott célok</h3>
          {created.length === 0 && <p>Még nem hoztál létre célt.</p>}
          {created.map(goal => renderGoal(goal, setCreated))}
        </div>
      </div>
    </div>
  );
}

export default MyGoals;
