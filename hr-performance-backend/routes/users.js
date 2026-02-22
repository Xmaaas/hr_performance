const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../db");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");


// ------------------------------------------------------
//  ÚJ FELHASZNÁLÓ LÉTREHOZÁSA – AUTOMATIKUS ROLE KIOSZTÁS
// ------------------------------------------------------
router.post("/create-user", authMiddleware, adminOnly, async (req, res) => {
  const { email, name, employeeNumber } = req.body;

  try {
    const [emp] = await db.query(
      "SELECT employee_number, role FROM employees WHERE employee_number = ?",
      [employeeNumber]
    );

    if (emp.length === 0) {
      return res.json({
        success: false,
        message: "Nincs ilyen törzsszám az adatbázisban"
      });
    }

    const employeeRole = emp[0].role || "user";

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1000 * 60 * 60);

    const sql = `
      INSERT INTO users (email, name, role, employee_number, reset_token, reset_expires)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      email,
      name,
      employeeRole,
      employeeNumber,
      resetToken,
      resetExpires
    ]);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      "Jelszó beállítása",
      `
        <h2>Szia ${name}!</h2>
        <p>Kattints az alábbi linkre a jelszó beállításához:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>A link 1 óráig érvényes.</p>
      `
    );

    res.json({
      success: true,
      message: `Felhasználó létrehozva (${employeeRole}) szerepkörrel és email elküldve`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Hiba történt a létrehozás során" });
  }
});


// ------------------------------------------------------
//  JELSZÓ BEÁLLÍTÁSA TOKEN ALAPJÁN (USER OLDAL)
// ------------------------------------------------------
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Érvénytelen token" });
    }

    const user = rows[0];

    const now = new Date();
    if (now > user.reset_expires) {
      return res.json({ success: false, message: "A token lejárt" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: "A jelszó sikeresen beállítva!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});


// ------------------------------------------------------
//  ADMIN / HR ÁLTAL INDÍTOTT JELSZÓ RESET LINK KÜLDÉSE
// ------------------------------------------------------
router.post(
  "/send-reset-link/:employee_number",
  authMiddleware,
  adminOnly,
  async (req, res) => {

    const employee_number = req.params.employee_number;

    try {
      const [rows] = await db.query(
        "SELECT * FROM users WHERE employee_number = ?",
        [employee_number]
      );

      if (rows.length === 0) {
        return res.json({ success: false, message: "Nincs ilyen felhasználó." });
      }

      const user = rows[0];

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 1000 * 60 * 60);

      await db.query(
        "UPDATE users SET reset_token = ?, reset_expires = ? WHERE employee_number = ?",
        [resetToken, resetExpires, employee_number]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await sendEmail(
        user.email,
        "Jelszó visszaállítása",
        `
          <h2>Szia ${user.name}!</h2>
          <p>Kattints az alábbi linkre a jelszó beállításához:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>A link 1 óráig érvényes.</p>
        `
      );

      await db.query(
        "INSERT INTO audit_log (user_id, action, target_employee_number) VALUES (?, ?, ?)",
        [req.user.id, "Jelszó reset link kiküldése", employee_number]
      );

      res.json({ success: true, message: "Jelszóbeállító link elküldve!" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Szerver hiba" });
    }
  }
);


// ------------------------------------------------------
//  TESZT EMAIL
// ------------------------------------------------------
router.get("/test-email", async (req, res) => {
  try {
    await sendEmail(
      "karacsony.gabor.istvan@gmail.com",
      "Teszt email",
      "<h1>Működik az emailküldés!</h1>"
    );

    res.json({ success: true, message: "Email elküldve!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Hiba az emailküldésben" });
  }
});


// ------------------------------------------------------
//  AUDIT LOG LEKÉRDEZÉSE – CSAK ADMIN
// ------------------------------------------------------
router.get("/audit-log", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.action,
        a.target_employee_number,
        a.timestamp,
        u.name AS performed_by
      FROM audit_log a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Audit log hiba:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});


module.exports = router;
