import { API_BASE_URL } from '../../config';
import { useEffect, useState } from "react";

function SkillGroupsAdmin() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [newMemberByGroup, setNewMemberByGroup] = useState({});
  const [newCriteriaByGroup, setNewCriteriaByGroup] = useState({});

  const token = localStorage.getItem("token");

  const loadGroups = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/skills/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setGroups(data.groups);
      })
      .finally(() => setLoading(false));
  };

  const loadEmployees = () => {
    fetch(`${API_BASE_URL}/employees/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setEmployees(data.employees);
      });
  };

  useEffect(() => {
    loadGroups();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGroup = async () => {
    if (!newGroupName.trim()) return alert("A csoport neve kötelező.");

    const res = await fetch(`${API_BASE_URL}/skills/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
    });

    const data = await res.json();
    if (data.success) {
      setNewGroupName("");
      setNewGroupDesc("");
      loadGroups();
    } else {
      alert(data.message || "Hiba történt.");
    }
  };

  const addMember = async (groupId) => {
    const employee_number = newMemberByGroup[groupId];
    if (!employee_number) return;

    const res = await fetch(`${API_BASE_URL}/skills/groups/${groupId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ employee_number })
    });

    const data = await res.json();
    if (data.success) {
      setNewMemberByGroup({ ...newMemberByGroup, [groupId]: "" });
      loadGroups();
    } else {
      alert(data.message || "Hiba történt.");
    }
  };

  const removeMember = async (groupId, employee_number) => {
    const res = await fetch(
      `${API_BASE_URL}/skills/groups/${groupId}/members/${employee_number}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await res.json();
    if (data.success) loadGroups();
  };

  const addCriteria = async (groupId) => {
    const label = newCriteriaByGroup[groupId];
    if (!label || !label.trim()) return;

    const res = await fetch(`${API_BASE_URL}/skills/groups/${groupId}/criteria`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ label })
    });

    const data = await res.json();
    if (data.success) {
      setNewCriteriaByGroup({ ...newCriteriaByGroup, [groupId]: "" });
      loadGroups();
    } else {
      alert(data.message || "Hiba történt.");
    }
  };

  const removeCriteria = async (groupId, criteriaId) => {
    const res = await fetch(
      `${API_BASE_URL}/skills/groups/${groupId}/criteria/${criteriaId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await res.json();
    if (data.success) loadGroups();
  };

  if (loading) return <div style={{ padding: "20px" }}>Betöltés...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "10px" }}>Skill-értékelési csoportok</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        A csoportokhoz rendelt dolgozók extra, terület- vagy személy-specifikus szempontok
        szerint is értékelve lesznek (sima pontozás, nem a radar chart része).
      </p>

      {/* ÚJ CSOPORT */}
      <div
        style={{
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "25px"
        }}
      >
        <h4 style={{ marginTop: 0 }}>Új csoport létrehozása</h4>
        <input
          type="text"
          placeholder="Csoport neve (pl. Backend fejlesztők)"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <textarea
          placeholder="Leírás (opcionális)"
          value={newGroupDesc}
          onChange={e => setNewGroupDesc(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc", height: "50px" }}
        />
        <button
          onClick={createGroup}
          style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Létrehozás
        </button>
      </div>

      {/* CSOPORTOK LISTÁJA */}
      {groups.map(group => (
        <div
          key={group.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "15px",
            background: "white",
            overflow: "hidden"
          }}
        >
          <div
            onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
            style={{
              padding: "15px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8f9fa"
            }}
          >
            <div>
              <strong>{group.name}</strong>
              <span style={{ marginLeft: "10px", color: "#666", fontSize: "13px" }}>
                {group.members.length} tag · {group.criteria.filter(c => c.active).length} extra szempont
              </span>
            </div>
            <span>{expandedGroup === group.id ? "▲" : "▼"}</span>
          </div>

          {expandedGroup === group.id && (
            <div style={{ padding: "15px" }}>
              {group.description && <p style={{ color: "#666" }}>{group.description}</p>}

              {/* TAGOK */}
              <h4>Csoporttagok</h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {group.members.map(m => (
                  <div
                    key={m.employee_number}
                    style={{
                      padding: "6px 10px",
                      background: "#f1f3f5",
                      border: "1px solid #dee2e6",
                      borderRadius: "6px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    {m.name} ({m.employee_number})
                    <span
                      onClick={() => removeMember(group.id, m.employee_number)}
                      style={{ cursor: "pointer", color: "#e03131", fontWeight: "bold" }}
                    >
                      ×
                    </span>
                  </div>
                ))}
                {group.members.length === 0 && <p style={{ color: "#999" }}>Nincs még tag.</p>}
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <select
                  value={newMemberByGroup[group.id] || ""}
                  onChange={e => setNewMemberByGroup({ ...newMemberByGroup, [group.id]: e.target.value })}
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">Válassz dolgozót...</option>
                  {employees.map(emp => (
                    <option key={emp.employee_number} value={emp.employee_number}>
                      {emp.name} ({emp.employee_number})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => addMember(group.id)}
                  style={{ padding: "8px 14px", background: "#40c057", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Hozzáadás
                </button>
              </div>

              {/* EXTRA SZEMPONTOK */}
              <h4>Extra szempontok (sima pontozás)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {group.criteria.filter(c => c.active).map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #eee"
                    }}
                  >
                    <span>{c.label}</span>
                    <button
                      onClick={() => removeCriteria(group.id, c.id)}
                      style={{ padding: "4px 10px", background: "#fa5252", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Inaktiválás
                    </button>
                  </div>
                ))}
                {group.criteria.filter(c => c.active).length === 0 && (
                  <p style={{ color: "#999" }}>Nincs még extra szempont.</p>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Új szempont neve..."
                  value={newCriteriaByGroup[group.id] || ""}
                  onChange={e => setNewCriteriaByGroup({ ...newCriteriaByGroup, [group.id]: e.target.value })}
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <button
                  onClick={() => addCriteria(group.id)}
                  style={{ padding: "8px 14px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Hozzáadás
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {groups.length === 0 && <p>Még nincs létrehozott csoport.</p>}
    </div>
  );
}

export default SkillGroupsAdmin;