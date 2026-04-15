import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CreateGoal() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subordinates, setSubordinates] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isTeamGoal, setIsTeamGoal] = useState(false);

  // ÚJ MEZŐK
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [progressFrequency, setProgressFrequency] = useState("");
  const [progressDays, setProgressDays] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Ha egy beosztottól jöttünk → automatikusan kiválasztjuk
  useEffect(() => {
    if (location.state?.selectedEmployee) {
      setSelectedEmployees([location.state.selectedEmployee.employee_number]);
    }
  }, [location.state]);

  // Beosztottak betöltése
  useEffect(() => {
    fetch("/api/leader/subordinates", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubordinates(data.subordinates);
        }
      });
  }, []);

  const toggleEmployee = (empNum) => {
    if (selectedEmployees.includes(empNum)) {
      setSelectedEmployees(selectedEmployees.filter(e => e !== empNum));
    } else {
      setSelectedEmployees([...selectedEmployees, empNum]);
    }
  };

  const toggleDay = (day) => {
    if (progressDays.includes(day)) {
      setProgressDays(progressDays.filter(d => d !== day));
    } else {
      setProgressDays([...progressDays, day]);
    }
  };

  const createGoal = () => {
    fetch("/api/goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        name,
        description,
        is_team_goal: isTeamGoal,
        assigned_to: selectedEmployees,
        priority,
        deadline,
        progress_frequency: progressFrequency,
        progress_days: progressDays.join(",")
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          navigate(`/leader/goal/${data.goal_id}`);
        } else {
          alert("Hiba történt a cél létrehozásakor.");
        }
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Új cél létrehozása</h2>

      <label>Cél neve:</label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <label>Leírás:</label>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ width: "100%", height: "120px", marginBottom: "10px" }}
      />

      <label>
        <input
          type="checkbox"
          checked={isTeamGoal}
          onChange={() => setIsTeamGoal(!isTeamGoal)}
        />
        Team cél
      </label>

      <h3>Prioritás</h3>
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="low">Alacsony</option>
        <option value="medium">Közepes</option>
        <option value="high">Magas</option>
      </select>

      <h3>Határidő</h3>
      <input
        type="date"
        value={deadline}
        onChange={e => setDeadline(e.target.value)}
      />

      <h3>Egyeztetés gyakorisága</h3>
      <select
        value={progressFrequency}
        onChange={e => setProgressFrequency(e.target.value)}
      >
        <option value="">Nincs megadva</option>
        <option value="weekly">Hetente</option>
        <option value="biweekly">Kéthetente</option>
        <option value="monthly">Havonta</option>
      </select>

      <h3>Egyeztetés napjai</h3>
      <div>
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
          <label key={day} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={progressDays.includes(day)}
              onChange={() => toggleDay(day)}
            />
            {day}
          </label>
        ))}
      </div>

      <h3>Érintett dolgozók</h3>
      {subordinates.map(emp => (
        <div key={emp.employee_number}>
          <label>
            <input
              type="checkbox"
              checked={selectedEmployees.includes(emp.employee_number)}
              onChange={() => toggleEmployee(emp.employee_number)}
            />
            {emp.name} ({emp.employee_number})
          </label>
        </div>
      ))}

      <button
        style={{ marginTop: "20px" }}
        onClick={createGoal}
        disabled={selectedEmployees.length === 0}
      >
        Cél létrehozása
      </button>
    </div>
  );
}

export default CreateGoal;