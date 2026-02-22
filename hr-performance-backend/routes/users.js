const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../db");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");


// ------------------------------------------------------
//  ÚJ FELHASZNÁLÓ LÉTREHOZÁSA – AUTOMATIKUS ROLE KIOSZTÁS
// ------------------------------------------------------
router.post("/create-user", async (req, res) => {
  const { email, name, employeeNumber } = req.body;

  try {
    // 1) Ellenőrizzük, hogy a törzsszám létezik-e az employees táblában
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

    // 2) A dolgozóhoz tartozó role automatikusan jön az Excelből
    const employeeRole = emp[0].role || "user";

    // 3) Token generálása jelszó beállításhoz
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 óra

    // 4) User létrehozása employee_number-rel + automatikus role-lal
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

    // 5) Jelszó beállító link
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
router.post("/send-reset-link/:employee_number", async (req, res) => {
  const employee_number = req.params.employee_number;

  try {
    // 1) User keresése
    const [rows] = await db.query(
      "SELECT * FROM users WHERE employee_number = ?",
      [employee_number]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Nincs ilyen felhasználó." });
    }

    const user = rows[0];

    // 2) Token generálása
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 óra

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE employee_number = ?",
      [resetToken, resetExpires, employee_number]
    );

    // 3) Link összeállítása
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 4) Email küldése
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

    res.json({ success: true, message: "Jelszóbeállító link elküldve!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});


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


module.exports = router;
