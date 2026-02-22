const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('./db');
const pool = require("./db");
const upload = require('./upload');
const authMiddleware = require('./middleware/authMiddleware');
const adminOnly = require('./middleware/adminOnly');
const adminOrHR = require('./middleware/adminOrHR');


// ------------------------------------------------------
//  EXCEL FELTÖLTÉS – Role + LeaderId beolvasással
// ------------------------------------------------------
router.post('/upload', authMiddleware, adminOrHR, upload.single('file'), async (req, res) => {
  try {
    // Régi adatok törlése
    await db.query("DELETE FROM employees");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.getWorksheet('worksheet');

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const employee_number = row.getCell(1).value;
      const name = row.getCell(2).value;
      const hire = row.getCell(3).value;
      const email = row.getCell(4).value;
      const department = row.getCell(5).value;
      const salary = row.getCell(6).value;
      const status = row.getCell(7).value;

      const role = row.getCell(8).value;
      const leader_id = row.getCell(9).value;

      if (!employee_number || employee_number.toString().trim() === "") {
        continue;
      }

      await db.query(
        `INSERT INTO employees 
         (employee_number, name, hire, email, department, salary, status, role, leader_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           hire = VALUES(hire),
           email = VALUES(email),
           department = VALUES(department),
           salary = VALUES(salary),
           status = VALUES(status),
           role = VALUES(role),
           leader_id = VALUES(leader_id)
        `,
        [employee_number, name, hire, email, department, salary, status, role, leader_id]
      );
    }

    // 🔥 USERS TÁBLA AUTOMATIKUS SZINKRONIZÁLÁSA
    await db.query(`
      UPDATE users u
      JOIN employees e ON u.email = e.email
      SET u.employee_number = e.employee_number
    `);

    res.json({ message: 'Dolgozók sikeresen feltöltve és users tábla frissítve!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hiba történt az Excel feldolgozása során.' });
  }
});



// ------------------------------------------------------
//  DOLGOZÓK LISTÁZÁSA – Role alapú jogosultságokkal
// ------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    const empNum = req.user.employee_number;

    // ADMIN → mindent lát
    if (userRole === "admin") {
      const [rows] = await db.query("SELECT * FROM employees");
      return res.json(rows);
    }

    // HR → mindent lát
    if (userRole === "hr") {
      const [rows] = await db.query("SELECT * FROM employees");
      return res.json(rows);
    }

    // LEADER → saját + beosztottak
    if (userRole === "leader") {
      const [rows] = await pool.query(
        "SELECT * FROM employees WHERE leader_id = ? OR employee_number = ?",
        [empNum, empNum]
      );
      return res.json(rows);
    }

    // USER → csak saját adatlap
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE employee_number = ?",
      [empNum]
    );

    return res.json(rows);

  } catch (err) {
    console.error("MySQL hiba:", err);
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------------
//  SQL LEKÉRDEZŐ (admin / hr / leader / user is használhatja)
// ------------------------------------------------------
router.post('/query', authMiddleware, async (req, res) => {
  const { sql } = req.body;

  if (!sql) {
    return res.status(400).json({ error: 'SQL lekérdezés szükséges.' });
  }

  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SQL hiba történt.', details: err });
  }
});

// ------------------------------------------------------
//  DOLGOZÓ STÁTUSZ VÁLTÁSA (Active <-> Passive)
// ------------------------------------------------------
router.put('/status/:employee_number',authMiddleware, adminOrHR, async (req, res) => {
  const { employee_number } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      "UPDATE employees SET status = ? WHERE employee_number = ?",
      [status, employee_number]
    );

    res.json({ success: true, message: "Státusz frissítve" });
  } catch (err) {
    console.error("Státusz frissítési hiba:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});


module.exports = router;
