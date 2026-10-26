import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const LINE_COLORS = ["#4C6EF5", "#40c057", "#fab005", "#e03131", "#7950f2", "#15aabf", "#e64980", "#495057", "#f76707", "#0ca678"];

export default function TeamDashboard() {
  const token = localStorage.getItem("token");

  // Területenkénti diagram állapota
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [deptFilterOpen, setDeptFilterOpen] = useState(false);
  const [deptData, setDeptData] = useState(null);
  const [loadingDept, setLoadingDept] = useState(true);

  // Emberenkénti diagram állapota
  const [selectableEmployees, setSelectableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [empFilterOpen, setEmpFilterOpen] = useState(false);
  const [empData, setEmpData] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(true);

  const loadDeptData = (departments) => {
    setLoadingDept(true);
    const query = departments.length > 0 ? `?departments=${departments.join(",")}` : "";
    fetch(`${API_BASE_URL}/dashboard/skills-by-department${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeptData(data);
          if (availableDepartments.length === 0) {
            setAvailableDepartments(data.availableDepartments);
          }
        }
      })
      .finally(() => setLoadingDept(false));
  };

  const loadEmpData = (employeeNumbers) => {
    setLoadingEmp(true);
    const query = employeeNumbers.length > 0 ? `?employee_numbers=${employeeNumbers.join(",")}` : "";
    fetch(`${API_BASE_URL}/dashboard/skills-by-employee${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmpData(data);
          if (selectableEmployees.length === 0) {
            setSelectableEmployees(data.selectableEmployees);
          }
        }
      })
      .finally(() => setLoadingEmp(false));
  };

  useEffect(() => {
    loadDeptData([]);
    loadEmpData([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDepartment = (dept) => {
    const next = selectedDepartments.includes(dept)
      ? selectedDepartments.filter(d => d !== dept)
      : [...selectedDepartments, dept];
    setSelectedDepartments(next);
    loadDeptData(next);
  };

  const toggleEmployee = (empNum) => {
    const next = selectedEmployees.includes(empNum)
      ? selectedEmployees.filter(e => e !== empNum)
      : [...selectedEmployees, empNum];
    setSelectedEmployees(next);
    loadEmpData(next);
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "28px", fontWeight: "600" }}>Csapat áttekintés</h2>

      {/* TERÜLETENKÉNTI DIAGRAM */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>Skill-átlagok területenként</h3>

          <MultiSelectFilter
            label="Területek"
            options={availableDepartments.map(d => ({ value: d, label: d }))}
            selected={selectedDepartments}
            onToggle={toggleDepartment}
            isOpen={deptFilterOpen}
            setIsOpen={setDeptFilterOpen}
          />
        </div>

        {loadingDept && <p>Betöltés...</p>}

        {!loadingDept && (!deptData || deptData.series.length === 0) && (
          <p style={{ color: "#999" }}>Nincs megjeleníthető adat.</p>
        )}

        {!loadingDept && deptData && deptData.series.length > 0 && (
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={deptData.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {deptData.seriesKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
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

      {/* EMBERENKÉNTI DIAGRAM */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>Skill-átlagok emberenként</h3>

          <MultiSelectFilter
            label="Dolgozók"
            options={selectableEmployees.map(e => ({ value: e.employee_number, label: `${e.name} (${e.employee_number})` }))}
            selected={selectedEmployees}
            onToggle={toggleEmployee}
            isOpen={empFilterOpen}
            setIsOpen={setEmpFilterOpen}
          />
        </div>

        {loadingEmp && <p>Betöltés...</p>}

        {!loadingEmp && (!empData || empData.series.length === 0) && (
          <p style={{ color: "#999" }}>Nincs megjeleníthető adat.</p>
        )}

        {!loadingEmp && empData && empData.series.length > 0 && (
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={empData.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {empData.seriesKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
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

function MultiSelectFilter({ label, options, selected, onToggle, isOpen, setIsOpen }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 14px",
          background: selected.length > 0 ? "#4C6EF5" : "#f1f3f5",
          color: selected.length > 0 ? "white" : "#333",
          border: "1px solid #dee2e6",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600"
        }}
      >
        {label} {selected.length > 0 ? `(${selected.length})` : ""} {isOpen ? "▲" : "▼"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "40px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "10px",
            minWidth: "220px",
            maxHeight: "280px",
            overflowY: "auto",
            zIndex: 20
          }}
        >
          {options.length === 0 && <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>Nincs elérhető opció.</p>}

          {options.map(opt => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 4px",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}

          {selected.length > 0 && (
            <button
              onClick={() => {
                selected.forEach(s => onToggle(s));
              }}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "6px",
                background: "#f1f3f5",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Szűrők törlése
            </button>
          )}
        </div>
      )}
    </div>
  );
}