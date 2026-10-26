const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const adminOrHR = require("../middleware/adminOrHR");
const leaderOrAdmin = require("../middleware/leaderOrAdmin");

// ===========================================================
// ÁLTALÁNOS SZEMPONTOK (radar chart tengelyei)
// ===========================================================

router.get("/skills/criteria", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, label, description, sort_order, active
       FROM skill_criteria
       ORDER BY sort_order ASC, label ASC`
    );
    res.json({ success: true, criteria: rows });
  } catch (err) {
    console.error("GET /skills/criteria ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.post("/skills/criteria", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { label, description, sort_order } = req.body;

    if (!label || label.trim() === "") {
      return res.status(400).json({ success: false, message: "A szempont neve kötelező." });
    }

    const [result] = await db.query(
      `INSERT INTO skill_criteria (label, description, sort_order, active)
       VALUES (?, ?, ?, 1)`,
      [label.trim(), description || null, sort_order || 0]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("POST /skills/criteria ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.put("/skills/criteria/:id", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, sort_order, active } = req.body;

    if (!label || label.trim() === "") {
      return res.status(400).json({ success: false, message: "A szempont neve kötelező." });
    }

    await db.query(
      `UPDATE skill_criteria
       SET label = ?, description = ?, sort_order = ?, active = ?
       WHERE id = ?`,
      [label.trim(), description || null, sort_order || 0, active ? 1 : 0, id]
    );

    res.json({ success: true, message: "Szempont frissítve." });
  } catch (err) {
    console.error("PUT /skills/criteria/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.delete("/skills/criteria/:id", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT id FROM skill_criteria WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "A szempont nem található." });
    }

    const [usage] = await db.query(
      "SELECT COUNT(*) AS cnt FROM skill_evaluation_scores WHERE general_criteria_id = ?",
      [id]
    );

    if (usage[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Ez a szempont már használatban van ${usage[0].cnt} (régi típusú) értékelésben, ezért nem törölhető véglegesen. Inaktiváld helyette.`
      });
    }

    await db.query("DELETE FROM skill_criteria WHERE id = ?", [id]);

    res.json({ success: true, message: "Szempont véglegesen törölve." });
  } catch (err) {
    console.error("DELETE /skills/criteria/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// CSOPORTOK
// ===========================================================

router.get("/skills/groups", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const [groups] = await db.query(
      `SELECT id, name, description, active, created_at
       FROM skill_groups
       ORDER BY created_at DESC`
    );

    for (const g of groups) {
      const [members] = await db.query(
        `SELECT sgm.employee_number, e.name
         FROM skill_group_members sgm
         JOIN employees e ON e.employee_number = sgm.employee_number
         WHERE sgm.group_id = ?`,
        [g.id]
      );
      g.members = members;

      const [criteria] = await db.query(
        `SELECT id, label, description, active
         FROM skill_group_criteria
         WHERE group_id = ?`,
        [g.id]
      );
      g.criteria = criteria;
    }

    res.json({ success: true, groups });
  } catch (err) {
    console.error("GET /skills/groups ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.post("/skills/groups", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "A csoport neve kötelező." });
    }

    const [result] = await db.query(
      `INSERT INTO skill_groups (name, description, created_by, active)
       VALUES (?, ?, ?, 1)`,
      [name.trim(), description || null, req.user.id]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("POST /skills/groups ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.put("/skills/groups/:id", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "A csoport neve kötelező." });
    }

    await db.query(
      `UPDATE skill_groups SET name = ?, description = ?, active = ? WHERE id = ?`,
      [name.trim(), description || null, active ? 1 : 0, id]
    );

    res.json({ success: true, message: "Csoport frissítve." });
  } catch (err) {
    console.error("PUT /skills/groups/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.delete("/skills/groups/:id", authMiddleware, adminOrHR, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    const [existing] = await conn.query("SELECT id, name FROM skill_groups WHERE id = ?", [id]);
    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: "A csoport nem található." });
    }

    const [usage] = await conn.query(
      `SELECT COUNT(*) AS cnt
       FROM skill_evaluation_scores ses
       JOIN skill_group_criteria sgc ON sgc.id = ses.group_criteria_id
       WHERE sgc.group_id = ?`,
      [id]
    );

    if (usage[0].cnt > 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: `A(z) "${existing[0].name}" csoport szempontjai már használatban vannak ${usage[0].cnt} (régi típusú) értékelésben, ezért nem törölhető véglegesen. Inaktiváld helyette.`
      });
    }

    await conn.beginTransaction();

    await conn.query("DELETE FROM skill_group_criteria WHERE group_id = ?", [id]);
    await conn.query("DELETE FROM skill_group_members WHERE group_id = ?", [id]);
    await conn.query("DELETE FROM skill_groups WHERE id = ?", [id]);

    await conn.commit();

    res.json({ success: true, message: "Csoport véglegesen törölve." });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE /skills/groups/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  } finally {
    conn.release();
  }
});

router.post("/skills/groups/:id/members", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_number } = req.body;

    if (!employee_number) {
      return res.status(400).json({ success: false, message: "Törzsszám megadása kötelező." });
    }

    const [emp] = await db.query(
      "SELECT employee_number FROM employees WHERE employee_number = ?",
      [employee_number]
    );
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: "Nincs ilyen dolgozó." });
    }

    await db.query(
      `INSERT IGNORE INTO skill_group_members (group_id, employee_number) VALUES (?, ?)`,
      [id, employee_number]
    );

    res.json({ success: true, message: "Dolgozó hozzáadva a csoporthoz." });
  } catch (err) {
    console.error("POST /skills/groups/:id/members ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.delete("/skills/groups/:id/members/:employee_number", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id, employee_number } = req.params;

    await db.query(
      "DELETE FROM skill_group_members WHERE group_id = ? AND employee_number = ?",
      [id, employee_number]
    );

    res.json({ success: true, message: "Dolgozó eltávolítva a csoportból." });
  } catch (err) {
    console.error("DELETE /skills/groups/:id/members/:employee_number ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.post("/skills/groups/:id/criteria", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description } = req.body;

    if (!label || label.trim() === "") {
      return res.status(400).json({ success: false, message: "A szempont neve kötelező." });
    }

    const [result] = await db.query(
      `INSERT INTO skill_group_criteria (group_id, label, description, active)
       VALUES (?, ?, ?, 1)`,
      [id, label.trim(), description || null]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("POST /skills/groups/:id/criteria ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.delete("/skills/groups/:groupId/criteria/:criteriaId", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { criteriaId } = req.params;

    const [existing] = await db.query("SELECT id FROM skill_group_criteria WHERE id = ?", [criteriaId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "A szempont nem található." });
    }

    const [usage] = await db.query(
      "SELECT COUNT(*) AS cnt FROM skill_evaluation_scores WHERE group_criteria_id = ?",
      [criteriaId]
    );

    if (usage[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Ez a szempont már használatban van ${usage[0].cnt} (régi típusú) értékelésben, ezért nem törölhető véglegesen. Inaktiváld helyette.`
      });
    }

    await db.query("DELETE FROM skill_group_criteria WHERE id = ?", [criteriaId]);

    res.json({ success: true, message: "Szempont véglegesen törölve." });
  } catch (err) {
    console.error("DELETE /skills/groups/:groupId/criteria/:criteriaId ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// IDŐSZAKOK (skill_periods) + automatikus evaluation-generálás
// + szempont-pillanatkép (snapshot) generálása
// ===========================================================

router.get("/skills/periods", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const [periods] = await db.query(
      `SELECT 
         sp.id, sp.label, 
         DATE(sp.start_date) AS start_date,
         DATE(sp.end_date) AS end_date,
         sp.status, sp.created_at,
         COUNT(se.id) AS evaluation_count,
         SUM(CASE WHEN se.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count
       FROM skill_periods sp
       LEFT JOIN skill_evaluations se ON se.period_id = sp.id
       GROUP BY sp.id
       ORDER BY sp.created_at DESC`
    );

    res.json({ success: true, periods });
  } catch (err) {
    console.error("GET /skills/periods ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.get("/skills/periods/open", authMiddleware, async (req, res) => {
  try {
    const [periods] = await db.query(
      `SELECT id, label, DATE(start_date) AS start_date, DATE(end_date) AS end_date
       FROM skill_periods
       WHERE status = 'open'
       ORDER BY start_date DESC`
    );
    res.json({ success: true, periods });
  } catch (err) {
    console.error("GET /skills/periods/open ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.post("/skills/periods", authMiddleware, adminOrHR, async (req, res) => {
  const { label, start_date, end_date } = req.body;

  if (!label || label.trim() === "") {
    return res.status(400).json({ success: false, message: "Az időszak elnevezése kötelező." });
  }
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: "A kezdő és záró dátum megadása kötelező." });
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return res.status(400).json({ success: false, message: "A záró dátumnak a kezdő dátum után kell lennie." });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [periodResult] = await conn.query(
      `INSERT INTO skill_periods (label, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, 'open', ?)`,
      [label.trim(), start_date, end_date, req.user.id]
    );
    const periodId = periodResult.insertId;

    const [generalCriteria] = await conn.query(
      `SELECT id, label, description FROM skill_criteria WHERE active = 1`
    );

    const generalSnapshotMap = new Map();

    for (const c of generalCriteria) {
      const [snapResult] = await conn.query(
        `INSERT INTO skill_period_criteria_snapshot
           (period_id, source_type, source_criteria_id, label, description, group_id, group_name)
         VALUES (?, 'general', ?, ?, ?, NULL, NULL)`,
        [periodId, c.id, c.label, c.description]
      );
      generalSnapshotMap.set(c.id, snapResult.insertId);
    }

    const [groupCriteria] = await conn.query(
      `SELECT sgc.id, sgc.label, sgc.description, sg.id AS group_id, sg.name AS group_name
       FROM skill_group_criteria sgc
       JOIN skill_groups sg ON sg.id = sgc.group_id AND sg.active = 1
       WHERE sgc.active = 1`
    );

    const groupSnapshotMap = new Map();

    for (const c of groupCriteria) {
      const [snapResult] = await conn.query(
        `INSERT INTO skill_period_criteria_snapshot
           (period_id, source_type, source_criteria_id, label, description, group_id, group_name)
         VALUES (?, 'group', ?, ?, ?, ?, ?)`,
        [periodId, c.id, c.label, c.description, c.group_id, c.group_name]
      );

      if (!groupSnapshotMap.has(c.group_id)) {
        groupSnapshotMap.set(c.group_id, []);
      }
      groupSnapshotMap.get(c.group_id).push(snapResult.insertId);
    }

    const [allMembers] = await conn.query(
      `SELECT sgm.group_id, sgm.employee_number
       FROM skill_group_members sgm
       JOIN skill_groups sg ON sg.id = sgm.group_id AND sg.active = 1`
    );

    const employeeGroupsMap = new Map();
    for (const m of allMembers) {
      if (!employeeGroupsMap.has(m.employee_number)) {
        employeeGroupsMap.set(m.employee_number, []);
      }
      employeeGroupsMap.get(m.employee_number).push(m.group_id);
    }

    const [employees] = await conn.query(
      `SELECT employee_number, leader_id
       FROM employees
       WHERE status = 'Active' AND leader_id IS NOT NULL AND leader_id != ''`
    );

    for (const emp of employees) {
      const [evalResult] = await conn.query(
        `INSERT INTO skill_evaluations (period_id, employee_number, leader_id, status)
         VALUES (?, ?, ?, 'pending')`,
        [periodId, emp.employee_number, emp.leader_id]
      );
      const evaluationId = evalResult.insertId;

      for (const snapshotId of generalSnapshotMap.values()) {
        await conn.query(
          `INSERT INTO skill_evaluation_criteria (evaluation_id, snapshot_criteria_id)
           VALUES (?, ?)`,
          [evaluationId, snapshotId]
        );
      }

      const empGroupIds = employeeGroupsMap.get(emp.employee_number) || [];
      for (const groupId of empGroupIds) {
        const snapshotIds = groupSnapshotMap.get(groupId) || [];
        for (const snapshotId of snapshotIds) {
          await conn.query(
            `INSERT INTO skill_evaluation_criteria (evaluation_id, snapshot_criteria_id)
             VALUES (?, ?)`,
            [evaluationId, snapshotId]
          );
        }
      }
    }

    await conn.commit();

    res.json({
      success: true,
      message: `Időszak megnyitva, ${employees.length} értékelés előkészítve (${generalSnapshotMap.size} általános szempont, ${groupCriteria.length} csoport-szempont befagyasztva).`,
      period_id: periodId,
      generated_count: employees.length
    });

  } catch (err) {
    await conn.rollback();
    console.error("POST /skills/periods ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  } finally {
    conn.release();
  }
});

router.post("/skills/periods/:id/close", authMiddleware, adminOrHR, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT status FROM skill_periods WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.json({ success: false, message: "Az időszak nem található." });
    }
    if (rows[0].status === "closed") {
      return res.status(400).json({ success: false, message: "Az időszak már le van zárva." });
    }

    await db.query("UPDATE skill_periods SET status = 'closed' WHERE id = ?", [id]);

    res.json({ success: true, message: "Időszak sikeresen lezárva." });
  } catch (err) {
    console.error("POST /skills/periods/:id/close ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// LEADER KITÖLTŐ FELÜLET
// ===========================================================

router.get("/skills/evaluations/my-team", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const { period_id } = req.query;

    if (!period_id) {
      return res.status(400).json({ success: false, message: "period_id megadása kötelező." });
    }

    const [rows] = await db.query(
      `SELECT 
         se.id, se.employee_number, e.name AS employee_name,
         se.status, se.submitted_at,
         sp.label AS period_label, sp.status AS period_status
       FROM skill_evaluations se
       JOIN employees e ON e.employee_number = se.employee_number
       JOIN skill_periods sp ON sp.id = se.period_id
       WHERE se.leader_id = ? AND se.period_id = ?
       ORDER BY e.name ASC`,
      [req.user.employee_number, period_id]
    );

    res.json({ success: true, evaluations: rows });
  } catch (err) {
    console.error("GET /skills/evaluations/my-team ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// Egy konkrét értékelés részletei – snapshot-alapú időszaknál a befagyasztott
// szempontlistát adja vissza, régi (snapshot nélküli) időszaknál az élő táblákból dolgozik
router.get("/skills/evaluations/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [evalRows] = await db.query(
      `SELECT 
         se.id, se.period_id, se.employee_number, se.leader_id,
         se.status, se.submitted_at,
         e.name AS employee_name,
         sp.label AS period_label, sp.status AS period_status
       FROM skill_evaluations se
       JOIN employees e ON e.employee_number = se.employee_number
       JOIN skill_periods sp ON sp.id = se.period_id
       WHERE se.id = ?`,
      [id]
    );

    if (evalRows.length === 0) {
      return res.status(404).json({ success: false, message: "Az értékelés nem található." });
    }

    const evaluation = evalRows[0];

    const isOwner = evaluation.leader_id === req.user.employee_number;
    const isAdmin = req.user.role === "admin";
    const isHR = req.user.role === "hr";

    if (!isOwner && !isAdmin && !isHR) {
      return res.status(403).json({ success: false, message: "Nincs jogosultságod megtekinteni ezt az értékelést." });
    }

    // Eldöntjük, hogy ez az értékelés snapshot-alapú-e
    const [snapshotCheck] = await db.query(
      "SELECT COUNT(*) AS cnt FROM skill_evaluation_criteria WHERE evaluation_id = ?",
      [id]
    );
    const isSnapshotBased = snapshotCheck[0].cnt > 0;

    let generalCriteria = [];
    let groupCriteria = [];

    if (isSnapshotBased) {
      // --- SNAPSHOT-ALAPÚ (befagyasztott) szempontlista ---
      const [rows] = await db.query(
        `SELECT 
           spcs.id, spcs.label, spcs.description, spcs.source_type,
           spcs.group_id, spcs.group_name,
           ses.score, ses.comment
         FROM skill_evaluation_criteria sec
         JOIN skill_period_criteria_snapshot spcs ON spcs.id = sec.snapshot_criteria_id
         LEFT JOIN skill_evaluation_scores ses
           ON ses.snapshot_criteria_id = spcs.id AND ses.evaluation_id = sec.evaluation_id
         WHERE sec.evaluation_id = ?
         ORDER BY spcs.source_type ASC, spcs.group_name ASC, spcs.label ASC`,
        [id]
      );

      generalCriteria = rows
        .filter(r => r.source_type === "general")
        .map(r => ({ id: r.id, label: r.label, description: r.description, score: r.score, comment: r.comment }));

      groupCriteria = rows
        .filter(r => r.source_type === "group")
        .map(r => ({
          id: r.id,
          label: r.label,
          description: r.description,
          group_id: r.group_id,
          group_name: r.group_name,
          score: r.score,
          comment: r.comment
        }));

    } else {
      // --- RÉGI, ÉLŐ TÁBLÁKBÓL OLVASOTT szempontlista (snapshot nélküli időszak) ---
      const [general] = await db.query(
        `SELECT 
           sc.id, sc.label, sc.description,
           ses.score, ses.comment
         FROM skill_criteria sc
         LEFT JOIN skill_evaluation_scores ses
           ON ses.general_criteria_id = sc.id AND ses.evaluation_id = ?
         WHERE sc.active = 1
         ORDER BY sc.sort_order ASC, sc.label ASC`,
        [id]
      );
      generalCriteria = general;

      const [group] = await db.query(
        `SELECT 
           sgc.id, sgc.label, sgc.description,
           sg.id AS group_id, sg.name AS group_name,
           ses.score, ses.comment
         FROM skill_group_members sgm
         JOIN skill_groups sg ON sg.id = sgm.group_id AND sg.active = 1
         JOIN skill_group_criteria sgc ON sgc.group_id = sg.id AND sgc.active = 1
         LEFT JOIN skill_evaluation_scores ses
           ON ses.group_criteria_id = sgc.id AND ses.evaluation_id = ?
         WHERE sgm.employee_number = ?
         ORDER BY sg.name ASC, sgc.label ASC`,
        [id, evaluation.employee_number]
      );
      groupCriteria = group;
    }

    evaluation.general_criteria = generalCriteria;
    evaluation.group_criteria = groupCriteria;
    evaluation.is_snapshot_based = isSnapshotBased;

    res.json({ success: true, evaluation });

  } catch (err) {
    console.error("GET /skills/evaluations/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// Pontszámok mentése – snapshot-alapú időszaknál a snapshot_criteria_id oszlopba ment,
// régi (snapshot nélküli) időszaknál a korábbi logika szerint
router.put("/skills/evaluations/:id", authMiddleware, leaderOrAdmin, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;
    const { general_scores, group_scores, submit } = req.body;

    const [evalRows] = await conn.query(
      `SELECT se.leader_id, se.status, sp.status AS period_status
       FROM skill_evaluations se
       JOIN skill_periods sp ON sp.id = se.period_id
       WHERE se.id = ?`,
      [id]
    );

    if (evalRows.length === 0) {
      conn.release();
      return res.json({ success: false, message: "Az értékelés nem található." });
    }

    const evaluation = evalRows[0];

    if (evaluation.leader_id !== req.user.employee_number && req.user.role !== "admin") {
      conn.release();
      return res.status(403).json({ success: false, message: "Nincs jogosultságod ezt az értékelést szerkeszteni." });
    }

    if (evaluation.period_status === "closed") {
      conn.release();
      return res.status(400).json({ success: false, message: "Az időszak le van zárva, az értékelés nem módosítható." });
    }

    if (evaluation.status === "submitted") {
      conn.release();
      return res.status(400).json({ success: false, message: "Az értékelés már be van küldve, nem módosítható." });
    }

    const allScores = [
      ...(Array.isArray(general_scores) ? general_scores.map(s => ({ ...s, type: "general" })) : []),
      ...(Array.isArray(group_scores) ? group_scores.map(s => ({ ...s, type: "group" })) : [])
    ];

    for (const s of allScores) {
      const scoreNum = Number(s.score);
      if (!Number.isInteger(scoreNum) || scoreNum < 1 || scoreNum > 5) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: "Minden szemponthoz 1 és 5 közötti egész pontszámot kell megadni."
        });
      }
    }

    // Eldöntjük, hogy snapshot-alapú-e ez az értékelés
    const [snapshotCheck] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM skill_evaluation_criteria WHERE evaluation_id = ?",
      [id]
    );
    const isSnapshotBased = snapshotCheck[0].cnt > 0;

    await conn.beginTransaction();

    await conn.query("DELETE FROM skill_evaluation_scores WHERE evaluation_id = ?", [id]);

    for (const s of allScores) {
      if (isSnapshotBased) {
        // Snapshot-alapú: minden pontszám a snapshot_criteria_id oszlopba kerül,
        // típustól (general/group) függetlenül, mert a snapshot-sor id-ja már egyértelmű.
        await conn.query(
          `INSERT INTO skill_evaluation_scores (evaluation_id, snapshot_criteria_id, score, comment)
           VALUES (?, ?, ?, ?)`,
          [id, s.criteria_id, s.score, s.comment || null]
        );
      } else if (s.type === "general") {
        await conn.query(
          `INSERT INTO skill_evaluation_scores (evaluation_id, general_criteria_id, score, comment)
           VALUES (?, ?, ?, ?)`,
          [id, s.criteria_id, s.score, s.comment || null]
        );
      } else {
        await conn.query(
          `INSERT INTO skill_evaluation_scores (evaluation_id, group_criteria_id, score, comment)
           VALUES (?, ?, ?, ?)`,
          [id, s.criteria_id, s.score, s.comment || null]
        );
      }
    }

    if (submit) {
      await conn.query(
        `UPDATE skill_evaluations SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
        [id]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: submit ? "Értékelés sikeresen beküldve." : "Piszkozat elmentve."
    });

  } catch (err) {
    await conn.rollback();
    console.error("PUT /skills/evaluations/:id ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  } finally {
    conn.release();
  }
});

// ===========================================================
// DOLGOZÓI SKILL-PROFIL (radar chart + csoport-pontok)
// ===========================================================

async function canViewSkillProfile(req, targetEmployeeNumber) {
  if (req.user.role === "admin" || req.user.role === "hr") return true;
  if (req.user.employee_number === targetEmployeeNumber) return true;

  const [rows] = await db.query(
    "SELECT leader_id FROM employees WHERE employee_number = ?",
    [targetEmployeeNumber]
  );

  if (rows.length === 0) return false;
  return rows[0].leader_id === req.user.employee_number;
}

router.get("/skills/employee/:employee_number/periods", authMiddleware, async (req, res) => {
  try {
    const { employee_number } = req.params;

    const allowed = await canViewSkillProfile(req, employee_number);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Nincs jogosultságod ezt a profilt megtekinteni." });
    }

    const [periods] = await db.query(
      `SELECT sp.id, sp.label, DATE(sp.start_date) AS start_date, DATE(sp.end_date) AS end_date
       FROM skill_periods sp
       JOIN skill_evaluations se ON se.period_id = sp.id
       WHERE se.employee_number = ? AND se.status = 'submitted'
       ORDER BY sp.start_date DESC`,
      [employee_number]
    );

    res.json({ success: true, periods });
  } catch (err) {
    console.error("GET /skills/employee/:employee_number/periods ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

router.get("/skills/employee/:employee_number/evaluation", authMiddleware, async (req, res) => {
  try {
    const { employee_number } = req.params;
    const { period_id } = req.query;

    if (!period_id) {
      return res.status(400).json({ success: false, message: "period_id megadása kötelező." });
    }

    const allowed = await canViewSkillProfile(req, employee_number);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Nincs jogosultságod ezt a profilt megtekinteni." });
    }

    const [evalRows] = await db.query(
      `SELECT se.id, se.submitted_at, se.leader_id, l.name AS leader_name
       FROM skill_evaluations se
       JOIN employees l ON l.employee_number = se.leader_id
       WHERE se.employee_number = ? AND se.period_id = ? AND se.status = 'submitted'`,
      [employee_number, period_id]
    );

    if (evalRows.length === 0) {
      return res.status(404).json({ success: false, message: "Nincs beküldött értékelés ebben az időszakban." });
    }

    const evaluation = evalRows[0];

    // Eldöntjük, hogy ez az értékelés snapshot-alapú-e
    const [snapshotCheck] = await db.query(
      "SELECT COUNT(*) AS cnt FROM skill_evaluation_criteria WHERE evaluation_id = ?",
      [evaluation.id]
    );
    const isSnapshotBased = snapshotCheck[0].cnt > 0;

    let generalScores = [];
    let groupScores = [];

    if (isSnapshotBased) {
      const [rows] = await db.query(
        `SELECT spcs.source_type, spcs.label, spcs.group_name, ses.score, ses.comment
         FROM skill_evaluation_scores ses
         JOIN skill_period_criteria_snapshot spcs ON spcs.id = ses.snapshot_criteria_id
         WHERE ses.evaluation_id = ?
         ORDER BY spcs.source_type ASC, spcs.group_name ASC, spcs.label ASC`,
        [evaluation.id]
      );

      generalScores = rows
        .filter(r => r.source_type === "general")
        .map(r => ({ label: r.label, score: r.score, comment: r.comment }));

      groupScores = rows
        .filter(r => r.source_type === "group")
        .map(r => ({ group_name: r.group_name, label: r.label, score: r.score, comment: r.comment }));

    } else {
      const [general] = await db.query(
        `SELECT sc.label, ses.score, ses.comment
         FROM skill_evaluation_scores ses
         JOIN skill_criteria sc ON sc.id = ses.general_criteria_id
         WHERE ses.evaluation_id = ?
         ORDER BY sc.sort_order ASC, sc.label ASC`,
        [evaluation.id]
      );
      generalScores = general;

      const [group] = await db.query(
        `SELECT sg.name AS group_name, sgc.label, ses.score, ses.comment
         FROM skill_evaluation_scores ses
         JOIN skill_group_criteria sgc ON sgc.id = ses.group_criteria_id
         JOIN skill_groups sg ON sg.id = sgc.group_id
         WHERE ses.evaluation_id = ?
         ORDER BY sg.name ASC, sgc.label ASC`,
        [evaluation.id]
      );
      groupScores = group;
    }

    res.json({
      success: true,
      evaluation: {
        ...evaluation,
        general_scores: generalScores,
        group_scores: groupScores
      }
    });

  } catch (err) {
    console.error("GET /skills/employee/:employee_number/evaluation ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

module.exports = router;