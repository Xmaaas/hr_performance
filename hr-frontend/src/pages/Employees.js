import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function Employees() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    department: "",
    employee_number: "",
    status: ""
  });

  const navigate = useNavigate();

  // User kiolvasása
  const user = JSON.parse(localStorage.getItem("user"));

  // Ha nincs user → loginre dobjuk
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Employees lekérése
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");

    fetch("http://localhost:3001/api/employees", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          alert("A hozzáféréshez be kell jelentkezni");
          navigate("/login");
          return [];
        }
        return res.json();
      })
      .then(data => setEmployees(data));
  }, [user, navigate]);

  // Excel feltöltés
  const uploadExcel = async () => {
    if (!selectedFile) {
      alert("Kérlek válassz ki egy Excel fájlt!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3001/api/employees/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (res.status === 401) {
      alert("A hozzáféréshez be kell jelentkezni");
      navigate("/login");
      return;
    }

    const data = await res.json();
    alert(data.message);

    // Frissítés
    fetch("http://localhost:3001/api/employees", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setEmployees(data));
  };

  // 🔥 Státusz váltó függvény
  const toggleStatus = async (emp) => {
    const newStatus = emp.status === "Active" ? "Passive" : "Active";

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:3001/api/employees/status/${emp.employee_number}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (data.success) {
      setEmployees(prev =>
        prev.map(e =>
          e.employee_number === emp.employee_number
            ? { ...e, status: newStatus }
            : e
        )
      );
    } else {
      alert("Hiba történt a státusz frissítésekor");
    }
  };

  // 🔥 Jelszó reset függvény
  const sendResetLink = async (employeeNumber) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:3001/api/send-reset-link/${employeeNumber}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    alert(data.message);
  };



  // 🔥 Szűrés
  const filteredEmployees = employees.filter(emp =>
    (filters.department === "" || emp.department === filters.department) &&
    (filters.employee_number === "" || emp.employee_number.includes(filters.employee_number )) &&
    (filters.status === "" || emp.status === filters.status)
  );

  // 🔥 Ha nincs user → ne rendereljen semmit
  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isHR = user.role === "hr";
  const isLeader = user.role === "leader";

  return (
    <div style={{ padding: "20px" }}>
      
      {/* ADMIN, HR, LEADER → táblázat is */}
      {(isAdmin || isHR || isLeader) && (
        <>
          <h2 style={{ marginTop: "40px" }}>Dolgozók listája</h2>

          {/* Excel feltöltés */}
          {(isAdmin || isHR) && (
            <div style={{ marginBottom: "20px" }}>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <button onClick={uploadExcel}>Excel feltöltése</button>
            </div>
          )}

          {/* Szűrők */}
          <div className="filters" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">Összes osztály</option>
              <option value="Legal">Legal</option>
              <option value="Retail">Retail</option>
              <option value="Sales">Sales</option>
              <option value="Accounting">Accounting</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Business Development">Business Development</option>
              <option value="Support">Support</option>
            </select>

            <input
              type="text"
              placeholder="Törzsszám Keresése.."
              value={filters.employee_number}
              onChange={(e) => setFilters({ ...filters, employee_number: e.target.value })}
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Összes státusz</option>
              <option value="Active">Aktív</option>
              <option value="Passive">Inaktív</option>
            </select>
          </div>

          {/* Táblázat */}
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Törzsszám</th>
                <th>Név</th>
                <th>Email</th>
                <th>Osztály</th>
                <th>Fizetés</th>
                <th>Státusz</th>
                <th>Felvétel</th>
                <th>Szerepkör</th>
                {user.role !== "leader" && <th>Státusz váltás</th>}
                {user.role !== "leader" && <th>Jelszó reset</th>}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.employee_number}>
                  <td>{emp.employee_number}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.salary}</td>
                  <td>{emp.status}</td>
                  <td>{emp.hire}</td>
                  <td>{emp.role}</td>

                  {/* Státusz váltás – csak admin és HR */}
                  { (isAdmin || isHR) && (
                    <td>
                      <button
                        onClick={() => toggleStatus(emp)}
                        style={{
                          background: emp.status === "Active" ? "#ff4d4d" : "#4CAF50",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        {emp.status === "Active" ? "Inaktiválás" : "Aktiválás"}
                      </button>
                    </td>
                  )}

                  {/* Jelszó reset – csak admin és HR */}
                  { (isAdmin || isHR) && (
                    <td>
                      <button
                        onClick={() => sendResetLink(emp.employee_number)}
                        style={{
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        Reset
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>


          </table>
        </>
      )}
    </div>
  );
}

export default Employees;
