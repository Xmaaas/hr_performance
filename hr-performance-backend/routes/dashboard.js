const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const leaderOrAdmin = require("../middleware/leaderOrAdmin");

// ===========================================================
// DOLGOZÓI SAJÁT CÉL-IDŐVONAL
// ===========================================================

router.get("/dashboard/my-goals-timeline", authMiddleware, async (req, res) => {
  try {
    const emp = req.user.employee_number;

    const [assigned] = await db.query(
      `SELECT 
         g.id, g.name, g.description,
         DATE(g.created_at) AS created_at,
         DATE(g.deadline) AS deadline,
         DATE(g.closed_at) AS closed_at,
         g.priority
       FROM goals g
       JOIN goal_assignments ga ON ga.goal_id = g.id
       WHERE ga.employee_number = ?`,
      [emp]
    );

    const [created] = await db.query(
      `SELECT 
         g.id, g.name, g.description,
         DATE(g.created_at) AS created_at,
         DATE(g.deadline) AS deadline,
         DATE(g.closed_at) AS closed_at,
         g.priority
       FROM goals g
       WHERE g.leader_id = ?`,
      [emp]
    );

    const createdIds = new Set(created.map(g => g.id));
    const filteredAssigned = assigned.filter(g => !createdIds.has(g.id));
    const allGoals = [...filteredAssigned, ...created];

    const today = new Date().toISOString().split("T")[0];

    for (const g of allGoals) {
      const [participants] = await db.query(
        `SELECT ga.employee_number, e.name
         FROM goal_assignments ga
         JOIN employees e ON e.employee_number = ga.employee_number
         WHERE ga.goal_id = ?`,
        [g.id]
      );
      g.participants = participants;

      if (g.closed_at) {
        g.status = "closed";
      } else if (g.deadline && g.deadline < today) {
        g.status = "overdue";
      } else {
        g.status = "active";
      }
    }

    res.json({ success: true, goals: allGoals });

  } catch (err) {
    console.error("GET /dashboard/my-goals-timeline ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// DOLGOZÓI SAJÁT SKILL-TREND (minden szempont, minden lezárt időszak)
// ===========================================================

router.get("/dashboard/my-skills-trend", authMiddleware, async (req, res) => {
  try {
    const emp = req.user.employee_number;

    const [evaluations] = await db.query(
      `SELECT se.id AS evaluation_id, sp.id AS period_id, sp.label AS period_label,
              DATE(sp.start_date) AS start_date
       FROM skill_evaluations se
       JOIN skill_periods sp ON sp.id = se.period_id
       WHERE se.employee_number = ? AND se.status = 'submitted'
       ORDER BY sp.start_date ASC`,
      [emp]
    );

    if (evaluations.length === 0) {
      return res.json({ success: true, periods: [], series: [] });
    }

    const evaluationIds = evaluations.map(e => e.evaluation_id);
    const placeholders = evaluationIds.map(() => "?").join(",");

    const [snapshotScores] = await db.query(
      `SELECT ses.evaluation_id, spcs.label, ses.score
       FROM skill_evaluation_scores ses
       JOIN skill_period_criteria_snapshot spcs ON spcs.id = ses.snapshot_criteria_id
       WHERE ses.evaluation_id IN (${placeholders})`,
      evaluationIds
    );

    const [oldGeneralScores] = await db.query(
      `SELECT ses.evaluation_id, sc.label, ses.score
       FROM skill_evaluation_scores ses
       JOIN skill_criteria sc ON sc.id = ses.general_criteria_id
       WHERE ses.evaluation_id IN (${placeholders})`,
      evaluationIds
    );

    const [oldGroupScores] = await db.query(
      `SELECT ses.evaluation_id, sgc.label, ses.score
       FROM skill_evaluation_scores ses
       JOIN skill_group_criteria sgc ON sgc.id = ses.group_criteria_id
       WHERE ses.evaluation_id IN (${placeholders})`,
      evaluationIds
    );

    const allScores = [...snapshotScores, ...oldGeneralScores, ...oldGroupScores];

    const evalToPeriod = new Map(evaluations.map(e => [e.evaluation_id, e.period_label]));
    const labelSet = new Set(allScores.map(s => s.label));

    const periodOrder = evaluations.map(e => e.period_label);
    const dataByPeriod = new Map();
    for (const label of periodOrder) {
      dataByPeriod.set(label, { period: label });
    }

    for (const s of allScores) {
      const periodLabel = evalToPeriod.get(s.evaluation_id);
      if (!periodLabel) continue;
      const row = dataByPeriod.get(periodLabel);
      if (row) {
        row[s.label] = s.score;
      }
    }

    res.json({
      success: true,
      periods: periodOrder,
      criteriaLabels: Array.from(labelSet),
      series: Array.from(dataByPeriod.values())
    });

  } catch (err) {
    console.error("GET /dashboard/my-skills-trend ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// SEGÉDFÜGGVÉNY: adott dolgozó-kör (employee_numbers) beküldött
// értékeléseinek összes pontszáma, szempontonként/időszakonként/
// employee_number-enként/department-enként bontva
// ===========================================================

async function getScoresForEmployees(employeeNumbers) {
  if (employeeNumbers.length === 0) {
    return [];
  }

  const empPlaceholders = employeeNumbers.map(() => "?").join(",");

  const [evaluations] = await db.query(
    `SELECT se.id AS evaluation_id, se.employee_number,
            e.name AS employee_name, e.department,
            sp.id AS period_id, sp.label AS period_label,
            DATE(sp.start_date) AS start_date
     FROM skill_evaluations se
     JOIN employees e ON e.employee_number = se.employee_number
     JOIN skill_periods sp ON sp.id = se.period_id
     WHERE se.employee_number IN (${empPlaceholders}) AND se.status = 'submitted'
     ORDER BY sp.start_date ASC`,
    employeeNumbers
  );

  if (evaluations.length === 0) {
    return [];
  }

  const evaluationIds = evaluations.map(e => e.evaluation_id);
  const evalPlaceholders = evaluationIds.map(() => "?").join(",");

  const [snapshotScores] = await db.query(
    `SELECT ses.evaluation_id, spcs.label, ses.score
     FROM skill_evaluation_scores ses
     JOIN skill_period_criteria_snapshot spcs ON spcs.id = ses.snapshot_criteria_id
     WHERE ses.evaluation_id IN (${evalPlaceholders})`,
    evaluationIds
  );

  const [oldGeneralScores] = await db.query(
    `SELECT ses.evaluation_id, sc.label, ses.score
     FROM skill_evaluation_scores ses
     JOIN skill_criteria sc ON sc.id = ses.general_criteria_id
     WHERE ses.evaluation_id IN (${evalPlaceholders})`,
    evaluationIds
  );

  const [oldGroupScores] = await db.query(
    `SELECT ses.evaluation_id, sgc.label, ses.score
     FROM skill_evaluation_scores ses
     JOIN skill_group_criteria sgc ON sgc.id = ses.group_criteria_id
     WHERE ses.evaluation_id IN (${evalPlaceholders})`,
    evaluationIds
  );

  const allScores = [...snapshotScores, ...oldGeneralScores, ...oldGroupScores];
  const evalToMeta = new Map(evaluations.map(e => [e.evaluation_id, e]));

  // Minden pontszámhoz csatoljuk a metaadatokat (period_label, department, employee_name)
  return allScores
    .map(s => {
      const meta = evalToMeta.get(s.evaluation_id);
      if (!meta) return null;
      return {
        period_label: meta.period_label,
        start_date: meta.start_date,
        department: meta.department,
        employee_number: meta.employee_number,
        employee_name: meta.employee_name,
        label: s.label,
        score: s.score
      };
    })
    .filter(Boolean);
}

// ===========================================================
// TERÜLETENKÉNTI SKILL-IDŐVONAL (átlagpontszám területenként, időszakonként)
// ===========================================================

router.get("/dashboard/skills-by-department", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    let { departments } = req.query; // vesszővel elválasztott lista, pl. "Sales,Retail"
    const isAdmin = req.user.role === "admin";
    const isHR = req.user.role === "hr";

    let employeeNumbers;

    if (isAdmin || isHR) {
      // HR/admin: tetszőleges terület, vagy ha nincs megadva, az összes
      let empQuery = "SELECT employee_number, department FROM employees WHERE status = 'Active'";
      const empParams = [];
      if (departments) {
        const deptList = departments.split(",").map(d => d.trim()).filter(Boolean);
        if (deptList.length > 0) {
          empQuery += ` AND department IN (${deptList.map(() => "?").join(",")})`;
          empParams.push(...deptList);
        }
      }
      const [emps] = await db.query(empQuery, empParams);
      employeeNumbers = emps.map(e => e.employee_number);
    } else {
      // Leader: csak a saját beosztottjai, és csak azokra a területekre szűrhet,
      // amikben a beosztottjai ténylegesen dolgoznak
      const [subs] = await db.query(
        "SELECT employee_number, department FROM employees WHERE leader_id = ? AND status = 'Active'",
        [req.user.employee_number]
      );

      let filteredSubs = subs;
      if (departments) {
        const deptList = departments.split(",").map(d => d.trim()).filter(Boolean);
        if (deptList.length > 0) {
          filteredSubs = subs.filter(s => deptList.includes(s.department));
        }
      }
      employeeNumbers = filteredSubs.map(s => s.employee_number);
    }

    const scores = await getScoresForEmployees(employeeNumbers);

    // Aggregálás: period_label + department + label -> átlag
    const periodOrder = [];
    const seenPeriods = new Set();
    const grouped = new Map(); // key: `${period_label}|${department}|${label}` -> {sum, count}

    for (const s of scores) {
      if (!seenPeriods.has(s.period_label)) {
        seenPeriods.add(s.period_label);
        periodOrder.push({ label: s.period_label, start_date: s.start_date });
      }

      const key = `${s.period_label}|${s.department}|${s.label}`;
      if (!grouped.has(key)) {
        grouped.set(key, { sum: 0, count: 0, period_label: s.period_label, department: s.department, label: s.label });
      }
      const g = grouped.get(key);
      g.sum += s.score;
      g.count += 1;
    }

    periodOrder.sort((a, b) => (a.start_date < b.start_date ? -1 : 1));

    // Recharts-barát formátum: egy sor / (period + department kombináció esetén "sorozat" néven),
    // itt: egy sor / period, minden "department - label" saját oszlopként
    const dataByPeriod = new Map();
    for (const p of periodOrder) {
      dataByPeriod.set(p.label, { period: p.label });
    }

    const seriesKeys = new Set();
    for (const g of grouped.values()) {
      const seriesKey = `${g.department} · ${g.label}`;
      seriesKeys.add(seriesKey);
      const row = dataByPeriod.get(g.period_label);
      if (row) {
        row[seriesKey] = Math.round((g.sum / g.count) * 100) / 100;
      }
    }

    res.json({
      success: true,
      periods: periodOrder.map(p => p.label),
      seriesKeys: Array.from(seriesKeys),
      series: Array.from(dataByPeriod.values()),
      availableDepartments: isAdmin || isHR
        ? await getAllDepartments()
        : Array.from(new Set(scores.map(s => s.department)))
    });

  } catch (err) {
    console.error("GET /dashboard/skills-by-department ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ===========================================================
// EMBERENKÉNTI SKILL-IDŐVONAL (átlagpontszám emberenként, időszakonként)
// ===========================================================

router.get("/dashboard/skills-by-employee", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    let { employee_numbers } = req.query; // vesszővel elválasztott lista
    const isAdmin = req.user.role === "admin";
    const isHR = req.user.role === "hr";

    let requestedNumbers = employee_numbers
      ? employee_numbers.split(",").map(e => e.trim()).filter(Boolean)
      : [];

    let allowedNumbers;

    if (isAdmin || isHR) {
      if (requestedNumbers.length > 0) {
        allowedNumbers = requestedNumbers;
      } else {
        const [emps] = await db.query("SELECT employee_number FROM employees WHERE status = 'Active'");
        allowedNumbers = emps.map(e => e.employee_number);
      }
    } else {
      // Leader: csak saját beosztottjai közül választhat
      const [subs] = await db.query(
        "SELECT employee_number FROM employees WHERE leader_id = ? AND status = 'Active'",
        [req.user.employee_number]
      );
      const subNumbers = subs.map(s => s.employee_number);

      allowedNumbers = requestedNumbers.length > 0
        ? requestedNumbers.filter(n => subNumbers.includes(n))
        : subNumbers;
    }

    const scores = await getScoresForEmployees(allowedNumbers);

    const periodOrder = [];
    const seenPeriods = new Set();
    const grouped = new Map(); // key: `${period_label}|${employee_number}|${label}` -> {sum, count}

    for (const s of scores) {
      if (!seenPeriods.has(s.period_label)) {
        seenPeriods.add(s.period_label);
        periodOrder.push({ label: s.period_label, start_date: s.start_date });
      }

      const key = `${s.period_label}|${s.employee_number}|${s.label}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          sum: 0, count: 0,
          period_label: s.period_label,
          employee_number: s.employee_number,
          employee_name: s.employee_name,
          label: s.label
        });
      }
      const g = grouped.get(key);
      g.sum += s.score;
      g.count += 1;
    }

    periodOrder.sort((a, b) => (a.start_date < b.start_date ? -1 : 1));

    const dataByPeriod = new Map();
    for (const p of periodOrder) {
      dataByPeriod.set(p.label, { period: p.label });
    }

    const seriesKeys = new Set();
    for (const g of grouped.values()) {
      const seriesKey = `${g.employee_name} · ${g.label}`;
      seriesKeys.add(seriesKey);
      const row = dataByPeriod.get(g.period_label);
      if (row) {
        row[seriesKey] = Math.round((g.sum / g.count) * 100) / 100;
      }
    }

    // Kiválasztható dolgozók listája a szűrőhöz (jogosultság szerint)
    let selectableEmployees;
    if (isAdmin || isHR) {
      const [emps] = await db.query("SELECT employee_number, name FROM employees WHERE status = 'Active' ORDER BY name ASC");
      selectableEmployees = emps;
    } else {
      const [subs] = await db.query(
        "SELECT employee_number, name FROM employees WHERE leader_id = ? AND status = 'Active' ORDER BY name ASC",
        [req.user.employee_number]
      );
      selectableEmployees = subs;
    }

    res.json({
      success: true,
      periods: periodOrder.map(p => p.label),
      seriesKeys: Array.from(seriesKeys),
      series: Array.from(dataByPeriod.values()),
      selectableEmployees
    });

  } catch (err) {
    console.error("GET /dashboard/skills-by-employee ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

async function getAllDepartments() {
  const [rows] = await db.query(
    "SELECT DISTINCT department FROM employees WHERE status = 'Active' AND department IS NOT NULL ORDER BY department ASC"
  );
  return rows.map(r => r.department);
}

module.exports = router;