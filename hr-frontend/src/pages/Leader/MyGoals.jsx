import React, { useEffect, useState } from "react";

function MyGoals() {
  const [assigned, setAssigned] = useState([]);
  const [created, setCreated] = useState([]);
  const [openGoal, setOpenGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch("/api/goals/my", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssigned(data.assignedGoals);
          setCreated(data.createdGoals);
        }
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
      fetch(`/api/goals/${goal.id}/update`, {
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

  // Múltbeli dátumok (completed / overdue)
  const past = goal.timeline.filter(t => t.date < today);

  // Mai nap (ha létezik a timeline-ban)
  const todayItem = goal.timeline.find(t => t.date === today);

  // Legközelebbi jövőbeli dátum
  const next = goal.timeline.find(t => t.date > today);

  // Összeállított lista
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

        if (item.status === "completed") color = "green";
        if (item.status === "pending") color = "orange";
        if (item.status === "overdue") color = "red";

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

            {item.status === "completed" && (
              <span style={{ color: "green" }}>✔</span>
            )}
            {item.status === "pending" && (
              <span style={{ color: "orange" }}>⏳</span>
            )}
            {item.status === "overdue" && (
              <span style={{ color: "red" }}>⚠</span>
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

                      const res = await fetch(`/api/goals/${goal.id}`, {
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
  const EditModal = () => {
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
            width: "400px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Cél szerkesztése</h3>

          <label>Név:</label>
          <input
            type="text"
            defaultValue={editGoal.name}
            id="editName"
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>Leírás:</label>
          <textarea
            defaultValue={editGoal.description}
            id="editDesc"
            style={{ width: "100%", height: "80px", marginBottom: "10px" }}
          ></textarea>

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

          <label>Határidő:</label>
          <input
            type="date"
            defaultValue={editGoal.deadline?.split("T")[0]}
            id="editDeadline"
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <button
            onClick={async () => {
              const updated = {
                name: document.getElementById("editName").value,
                description: document.getElementById("editDesc").value,
                priority: document.getElementById("editPrio").value,
                deadline: document.getElementById("editDeadline").value
              };

              const res = await fetch(`/api/goals/${editGoal.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify(updated)
              });

              const data = await res.json();

              if (data.success) {
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
      <EditModal />

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
