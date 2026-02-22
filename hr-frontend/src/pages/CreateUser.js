import { useState } from "react";

function CreateUser() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    const res = await fetch("http://localhost:3001/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        employeeNumber
      })
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Új felhasználó létrehozása</h2>

      <input
        type="text"
        placeholder="Törzsszám"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
      /><br /><br />

      <input
        type="text"
        placeholder="Név"
        value={name}
        onChange={(e) => setName(e.target.value)}
      /><br /><br />

      <input
        type="email"
        placeholder="Email cím"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br /><br />

      <button onClick={handleCreate}>Felhasználó létrehozása</button>

      <p>{message}</p>
    </div>
  );
}

export default CreateUser;
