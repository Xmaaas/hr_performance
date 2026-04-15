import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Subordinates() {
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/leader/subordinates", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubordinates(data.subordinates);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Betöltés...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Beosztottak</h2>

      {subordinates.length === 0 && <p>Nincsenek beosztottak.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {subordinates.map(emp => (
          <li
            key={emp.employee_number}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              marginBottom: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>{emp.name}</strong> ({emp.employee_number})  
            <br />
            <button
              style={{ marginTop: "10px" }}
              onClick={() =>
                navigate("/leader/create-goal", {
                  state: { selectedEmployee: emp }
                })
              }
            >
              Új cél létrehozása
            </button>
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: "20px" }}
        onClick={() => navigate("/leader/create-goal")}
      >
        Team cél létrehozása
      </button>
    </div>
  );
}

export default Subordinates;
