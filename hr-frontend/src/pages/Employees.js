import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Employees() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [openMenu, setOpenMenu] = useState(null); // 🔥 lenyitható menü
  const [filters, setFilters] = useState({
    department: "",
    employee_number: "",
    status: ""
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    fetch("http://localhost:3001/api/employees", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, [user, navigate, token]);

  const uploadExcel = async () => {
    if (!selectedFile) return alert("Válassz ki egy Excel fájlt!");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("http://localhost:3001/api/employees/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    fetch("http://localhost:3001/api/employees", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmployees(data));
  };

  const toggleStatus = async (emp) => {
    const newStatus = emp.status === "Active" ? "Passive" : "Active";

    const res = await fetch(
      `http://localhost:3001/api/employees/status/${emp.employee_number}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const data = await res.json();
    if (data.success) {
      setEmployees(prev =>
        prev.map(e =>
          e.employee_number === emp.employee_number
            ? { ...e, status: newStatus }
            : e
        )
      );
    }
  };

  const sendResetLink = async (employeeNumber) => {
    const res = await fetch(
      `http://localhost:3001/api/send-reset-link/${employeeNumber}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    alert(data.message);
  };

  const filteredEmployees = employees.filter(emp =>
    (filters.department === "" || emp.department === filters.department) &&
    (filters.employee_number === "" ||
      emp.employee_number.includes(filters.employee_number)) &&
    (filters.status === "" || emp.status === filters.status)
  );

  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isLeader = user?.role === "leader";

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "28px", fontWeight: "600" }}>
        Dolgozók listája
      </h2>

      {(isAdmin || isHR) && (
        <div
          style={{
            background: "#f7f7f7",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "20px"
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>Excel feltöltés</h3>
          <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <button
            onClick={uploadExcel}
            style={{
              marginLeft: "10px",
              padding: "8px 14px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Feltöltés
          </button>
        </div>
      )}

      {/* SZŰRŐK + CÉL LÉTREHOZÁSA GOMB */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
      {/* SZŰRŐK BAL OLDALT */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <select
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          style={filterStyle}
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
          placeholder="Törzsszám..."
          value={filters.employee_number}
          onChange={(e) =>
            setFilters({ ...filters, employee_number: e.target.value })
          }
          style={filterStyle}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={filterStyle}
        >
          <option value="">Összes státusz</option>
          <option value="Active">Aktív</option>
          <option value="Passive">Inaktív</option>
        </select>
      </div>

      {/* JOBB OLDALT A KIEMELT GOMB */}
      {isLeader && (
        <button
          onClick={() => navigate("/leader/create-goal")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            whiteSpace: "nowrap"
          }}
        >
          + Cél létrehozása
        </button>
      )}
    </div>

      {/* TÁBLÁZAT */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          background: "white"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th style={thStyle}>Törzsszám</th>
              <th style={thStyle}>Név</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Osztály</th>
              <th style={thStyle}>Fizetés</th>
              <th style={thStyle}>Státusz</th>
              <th style={thStyle}>Felvétel</th>
              <th style={thStyle}>Szerepkör</th>
              {(isAdmin || isHR) && <th style={thStyle}>Műveletek</th>}
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr
                key={emp.employee_number}
                style={{
                  background: index % 2 === 0 ? "#ffffff" : "#fafafa",
                  transition: "0.2s"
                }}
              >
                <td style={tdStyle}>{emp.employee_number}</td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}>{emp.email}</td>
                <td style={tdStyle}>{emp.department}</td>
                <td style={tdStyle}>{emp.salary}</td>
                <td style={tdStyle}>{emp.status}</td>
                <td style={tdStyle}>{emp.hire}</td>
                <td style={tdStyle}>{emp.role}</td>

                {(isAdmin || isHR) && (
                  <td style={{ ...tdStyle, position: "relative" }}>
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === emp.employee_number ? null : emp.employee_number)
                      }
                      style={menuButton}
                    >
                      ⋮
                    </button>

                    {openMenu === emp.employee_number && (
                      <div style={dropdownMenu}>
                        <div
                          style={dropdownItem}
                          onClick={() => toggleStatus(emp)}
                        >
                          {emp.status === "Active"
                            ? "Inaktiválás"
                            : "Aktiválás"}
                        </div>

                        <div
                          style={dropdownItem}
                          onClick={() => sendResetLink(emp.employee_number)}
                        >
                          Jelszó reset
                        </div>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const filterStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  minWidth: "150px"
};

const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "600",
  borderBottom: "1px solid #ddd"
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee"
};

const menuButton = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  padding: "5px"
};

const dropdownMenu = {
  position: "absolute",
  right: "10px",
  top: "35px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  zIndex: 10
};

const dropdownItem = {
  padding: "10px 15px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  fontSize: "14px"
};

export default Employees;
