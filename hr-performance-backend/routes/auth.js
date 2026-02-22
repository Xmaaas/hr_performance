const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../db");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Felhasználó keresése a users táblában
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR employee_number = ?",
      [email, email]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Hibás email vagy jelszó" });
    }

    const user = rows[0];

    // 2) Jelszó ellenőrzése
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Hibás email vagy jelszó" });
    }

    // 3) Dolgozó státuszának ellenőrzése az employees táblából
    const [empRows] = await db.query(
      "SELECT status FROM employees WHERE employee_number = ?",
      [user.employee_number]
    );

    if (empRows.length > 0 && empRows[0].status === "Passive") {
      return res.json({
        success: false,
        message: "A felhasználó inaktív (kilépett). Belépés nem engedélyezett."
      });
    }

    // 4) JWT generálása
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        employee_number: user.employee_number 
      },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        employee_number: user.employee_number
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

module.exports = router;

