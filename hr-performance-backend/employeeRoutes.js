const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('./db');
const upload = require('./upload');
const authMiddleware = require('./middleware/authMiddleware');
const adminOnly = require('./middleware/adminOnly');
const adminOrHR = require('./middleware/adminOrHR');


// ------------------------------------------------------
//  EXCEL FELTÖLTÉS – Role + LeaderId beolvasással (FK-biztos verzió)
// ------------------------------------------------------
router.post('/upload', authMiddleware, adminOrHR, upload.single('file'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.getWorksheet('worksheet');

    // Excelben szereplő employee_number-ek listája
    const excelEmployees = [];

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

      if (!employee_number || employee_number.toString().trim() === "") continue;

      excelEmployees.push(employee_number.toString());

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

    // Inaktiváljuk azokat, akik NINCSENEK az Excelben
    if (excelEmployees.length > 0) {
      await db.query(
        "UPDATE employees SET status = 'inactive' WHERE employee_number NOT IN (?)",
        [excelEmployees]
      );
    }

    // Users tábla frissítése employee_number-rel
    await db.query(`
      UPDATE users u
      JOIN employees e ON u.email = e.email
      SET u.employee_number = e.employee_number
    `);

    // Audit log
    await db.query(
      "INSERT INTO audit_log (user_id, action) VALUES (?, ?)",
      [req.user.id, "Excel feltöltés"]
    );

    res.json({ message: 'Dolgozók sikeresen frissítve, inaktiválva és users tábla szinkronizálva!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hiba történt az Excel feldolgozása során.' });
  }
});


// ------------------------------------------------------
//  SAJÁT ADATOK LEKÉRÉSE – minden bejelentkezett usernek
// ------------------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const empNum = req.user.employee_number;

    const [rows] = await db.query(
      "SELECT * FROM employees WHERE employee_number = ?",
      [empNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Nincs ilyen dolgozó." });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Hiba a saját adatlap lekérdezésénél:", err);
    res.status(500).json({ error: "Szerver hiba" });
  }
});


// ------------------------------------------------------
//  DOLGOZÓK LISTÁZÁSA – Role alapú jogosultságokkal
// ------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    const empNum = req.user.employee_number;

    if (userRole === "admin" || userRole === "hr") {
      const [rows] = await db.query("SELECT * FROM employees");
      return res.json(rows);
    }

    if (userRole === "leader") {
      const [rows] = await db.query(
        "SELECT * FROM employees WHERE leader_id = ? OR employee_number = ?",
        [empNum, empNum]
      );
      return res.json(rows);
    }

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
//  SQL LEKÉRDEZŐ
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
//  DOLGOZÓ STÁTUSZ VÁLTÁSA
// ------------------------------------------------------
router.put('/status/:employee_number', authMiddleware, adminOrHR, async (req, res) => {
  const { employee_number } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      "UPDATE employees SET status = ? WHERE employee_number = ?",
      [status, employee_number]
    );

    await db.query(
      "INSERT INTO audit_log (user_id, action, target_employee_number) VALUES (?, ?, ?)",
      [req.user.id, `Státusz módosítás: ${status}`, employee_number]
    );

    res.json({ success: true, message: "Státusz frissítve" });
  } catch (err) {
    console.error("Státusz frissítési hiba:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});


// ------------------------------------------------------
//  AUDIT LOG – CSAK ADMIN
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

//Célok
router.get('/employees', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT employee_number, name FROM employees ORDER BY name ASC"
    );
    res.json({ success: true, employees: rows });
  } catch (err) {
    console.error("GET /employees ERROR:", err);
    res.json({ success: false, message: "Szerver hiba" });
  }
});


module.exports = router;
