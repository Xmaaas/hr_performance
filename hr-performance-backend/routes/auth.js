const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../db");
const { randomBytes } = require("crypto");
const sendEmail = require("../utils/sendEmail");

// 🔐 JWT secret – érdemes .env-ből olvasni
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// 🔵 LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR employee_number = ?",
      [email, email]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Hibás email vagy jelszó" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Hibás email vagy jelszó" });
    }

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

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        employee_number: user.employee_number
      },
      JWT_SECRET,
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
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// 🔵 Elfelejtett jelszó – email küldés
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nincs ilyen felhasználó." });
    }

    const user = rows[0];

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 perc

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    // opcionálisan: const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Jelszó visszaállítás",
      html: `
        <p>Kedves ${user.name},</p>
        <p>Kattints az alábbi linkre a jelszó visszaállításához:</p>
        <a href="${resetLink}">
          Jelszó visszaállítása
        </a>
        <p>A link 30 percig érvényes.</p>
      `
    });

    res.json({
      success: true,
      message: "Email elküldve a jelszó visszaállításához."
    });

  } catch (err) {
    console.error("FORGOT-PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// 🔵 Új jelszó beállítása – token + új jelszó
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.json({
      success: false,
      message: "Hiányzó token vagy jelszó."
    });
  }

  try {
    // Token + lejárat ellenőrzése
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "Érvénytelen vagy lejárt jelszó-visszaállító link."
      });
    }

    const user = rows[0];

    // Új jelszó hash-elése
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
      [hashed, user.id]
    );

    res.json({
      success: true,
      message: "A jelszó sikeresen frissítve."
    });

  } catch (err) {
    console.error("RESET-PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba." });
  }
});

module.exports = router;
