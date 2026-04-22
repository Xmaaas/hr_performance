const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const leaderOrAdmin = require("../middleware/leaderOrAdmin");

// ---------------------------------------------------------
// 1) Időközi értékelések automatikus generálása
// ---------------------------------------------------------
  function generateSchedule(goal) {
    const schedule = [];

    // created_at és deadline mindig STRING legyen
    const created = goal.created_at instanceof Date
      ? goal.created_at.toISOString().split("T")[0]
      : (goal.created_at || new Date().toISOString().split("T")[0]);

    const deadline = goal.deadline instanceof Date
      ? goal.deadline.toISOString().split("T")[0]
      : (goal.deadline || created);

    const startStr = created;
    const endStr = deadline;

    let current = new Date(startStr + "T00:00:00");
    const end = new Date(endStr + "T00:00:00");

    const freq = goal.progress_frequency || "monthly";

  while (current <= end) {
    const iso = current.toISOString().split("T")[0];
    schedule.push(iso);

    switch (freq) {
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      case "quarterly":
        current.setMonth(current.getMonth() + 3);
        break;
      case "yearly":
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return schedule;
}

// ---------------------------------------------------------
// 2) Timeline összevonása – csak string dátumokkal
// ---------------------------------------------------------
function mergeTimeline(schedule, updates) {
  console.log("SCHEDULE:", schedule);
  console.log("UPDATES:", updates);

  return schedule.map(dateStr => {
    const iso = dateStr; // már STRING

    const update = updates.find(u => u.created_at === iso);

    let status = "pending";
    const today = new Date().toISOString().split("T")[0];

    if (update) {
      status = "completed";
    } else if (iso < today) {
      status = "overdue";
    }

    return { date: iso, status, update: update || null };
  });
}

// ---------------------------------------------------------
// 3) Leader beosztottak lekérése
// ---------------------------------------------------------
router.get("/leader/subordinates", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const leader = req.user.employee_number;

    const [rows] = await db.query(
      `SELECT e.employee_number, e.name
       FROM employees e
       WHERE e.leader_id = ?`,
      [leader]
    );

    res.json({
      success: true,
      subordinates: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ---------------------------------------------------------
// 4) Cél létrehozása
// ---------------------------------------------------------
router.post("/goals", authMiddleware, async (req, res) => {
  try {
    const leaderId = req.user.employee_number;

    const {
      name,
      description,
      is_team_goal,
      assigned_to,
      priority,
      deadline,
      progress_frequency,
      progress_days
    } = req.body;

    const prio = priority || "medium";
    const dl = deadline || null;
    const freq = progress_frequency || null;
    const days = progress_days || null;

    const [goalResult] = await db.query(
      `INSERT INTO goals 
       (leader_id, name, description, is_team_goal, priority, deadline, progress_frequency, progress_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        leaderId,
        name,
        description,
        is_team_goal ? 1 : 0,
        prio,
        dl,
        freq,
        days
      ]
    );

    const goalId = goalResult.insertId;

    for (const empNum of assigned_to) {
      await db.query(
        "INSERT INTO goal_assignments (goal_id, employee_number) VALUES (?, ?)",
        [goalId, empNum]
      );
    }

    res.json({ success: true, goal_id: goalId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ---------------------------------------------------------
// 5) Saját célok lekérése (assigned + created)
// ---------------------------------------------------------
router.get("/goals/my", authMiddleware, async (req, res) => {
  try {
    const emp = req.user.employee_number;

    // 1) Hozzám rendelt célok (goal_assignments alapján)
    const [assigned] = await db.query(
      `SELECT 
         g.id,
         g.leader_id,
         g.name,
         g.description,
         g.is_team_goal,
         DATE(g.created_at) AS created_at,
         DATE(g.deadline) AS deadline,
         g.priority,
         g.progress_frequency,
         g.progress_days,
         e.name AS leader_name
       FROM goals g
       JOIN goal_assignments ga ON ga.goal_id = g.id
       JOIN employees e ON e.employee_number = g.leader_id
       WHERE ga.employee_number = ?`,
      [emp]
    );

    // 2) Általam létrehozott célok (leader_id alapján)
    const [created] = await db.query(
      `SELECT 
         g.id,
         g.leader_id,
         g.name,
         g.description,
         g.is_team_goal,
         DATE(g.created_at) AS created_at,
         DATE(g.deadline) AS deadline,
         g.priority,
         g.progress_frequency,
         g.progress_days,
         e.name AS leader_name
       FROM goals g
       JOIN employees e ON e.employee_number = g.leader_id
       WHERE g.leader_id = ?`,
      [emp]
    );

    // 3) Duplikáció kiszűrése
    const createdIds = new Set(created.map(g => g.id));
    const filteredAssigned = assigned.filter(g => !createdIds.has(g.id));

    // 4) Updates + timeline + assigned employees hozzácsatolása
    for (const g of [...filteredAssigned, ...created]) {

      // 4.1) Hozzárendelt dolgozók lekérése
      const [assignedEmployees] = await db.query(
        `SELECT 
          ga.employee_number,
          e.name
        FROM goal_assignments ga
        JOIN employees e ON e.employee_number = ga.employee_number
        WHERE ga.goal_id = ?`,
        [g.id]
      );

      g.assigned = assignedEmployees;

      // 4.2) Updates lekérése
      const [updates] = await db.query(
        `SELECT 
          id, goal_id, employee_number, progress, comment,
          DATE(created_at) AS created_at,
          DATE(created_real) AS created_real
        FROM goal_updates
        WHERE goal_id = ?
        ORDER BY created_at ASC`,
        [g.id]
      );

      g.updates = updates;

      // 4.3) Timeline generálása
      const schedule = generateSchedule(g);
      g.timeline = mergeTimeline(schedule, updates);
    }

    res.json({
      success: true,
      assignedGoals: filteredAssigned,
      createdGoals: created
    });

  } catch (err) {
    console.error("GET /goals/my ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ---------------------------------------------------------
// 6) Leader értékelés hozzáadása – csak létrehozó leader, fix dátum
// ---------------------------------------------------------
router.post("/goals/:id/update", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const goalId = req.params.id;
    const employee = req.user.employee_number;
    const { progress, comment } = req.body;

    // 🔧 JAVÍTVA: pontos mezők + DATE() konverzió
    const [goalRows] = await db.query(
      `SELECT 
         id,
         leader_id,
         name,
         description,
         is_team_goal,
         DATE(created_at) AS created_at,
         DATE(deadline) AS deadline,
         DATE(closed_at) AS closed_at,
         final_score,
         final_comment,
         priority,
         progress_frequency,
         progress_days
       FROM goals
       WHERE id = ?`,
      [goalId]
    );

    if (goalRows.length === 0) {
      return res.json({ success: false, message: "A cél nem található." });
    }

    // csak a létrehozó leader értékelhet
    if (goalRows[0].leader_id !== req.user.employee_number) {
      return res.status(403).json({
        success: false,
        message: "Nincs jogosultságod értékelést írni ehhez a célhoz."
      });
    }

    // 🔧 updates: DATE() konverzió
    const [updates] = await db.query(
      `SELECT 
         id,
         goal_id,
         employee_number,
         progress,
         comment,
         DATE(created_at) AS created_at,
         DATE(created_real) AS created_real
       FROM goal_updates
       WHERE goal_id = ?
       ORDER BY DATE(created_at) ASC`,
      [goalId]
    );

    const schedule = generateSchedule(goalRows[0]);
    const timeline = mergeTimeline(schedule, updates);

    const todayStr = new Date().toISOString().split("T")[0];

    // 1) Ha nincs timeline → fallback: today
    if (timeline.length === 0) {
      const fallbackDate = todayStr;

      const [result] = await db.query(
        `INSERT INTO goal_updates 
          (goal_id, employee_number, progress, comment, created_at, created_real)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [goalId, employee, progress, comment, fallbackDate, todayStr]
      );

      const [update] = await db.query(
        `SELECT 
          id, goal_id, employee_number, progress, comment,
          DATE(created_at) AS created_at,
          DATE(created_real) AS created_real
        FROM goal_updates
        WHERE id = ?`,
        [result.insertId]
      );

      update[0].created_at = fallbackDate;
      update[0].created_real = todayStr;

      return res.json({
        success: true,
        update: update[0]
      });
    }

    // 2) Ha van timeline → legközelebbi dátum keresése
    let closest = timeline[0].date;
    let minDiff = Math.abs(
      new Date(closest + "T00:00:00") - new Date(todayStr + "T00:00:00")
    );

    for (const t of timeline) {
      const diff = Math.abs(
        new Date(t.date + "T00:00:00") - new Date(todayStr + "T00:00:00")
      );
      if (diff < minDiff) {
        minDiff = diff;
        closest = t.date;
      }
    }

    const timelineDate = closest;
    const realDate = todayStr;

    const [result] = await db.query(
      `INSERT INTO goal_updates 
        (goal_id, employee_number, progress, comment, created_at, created_real)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [goalId, employee, progress, comment, timelineDate, realDate]
    );

    const [update] = await db.query(
      `SELECT 
        id,
        goal_id,
        employee_number,
        progress,
        comment,
        DATE(created_at) AS created_at,
        DATE(created_real) AS created_real
      FROM goal_updates
      WHERE id = ?`,
      [result.insertId]
    );

    update[0].created_at = timelineDate;
    update[0].created_real = realDate;

    res.json({
      success: true,
      update: update[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ---------------------------------------------------------
// 7) Cél módosítása – csak a létrehozó leader
// ---------------------------------------------------------
router.put("/goals/:id", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const goalId = req.params.id;

    const [rows] = await db.query("SELECT leader_id FROM goals WHERE id = ?", [goalId]);
    if (rows.length === 0) {
      return res.json({ success: false, message: "A cél nem található." });
    }

    if (rows[0].leader_id !== req.user.employee_number) {
      return res.status(403).json({
        success: false,
        message: "Nincs jogosultságod a cél módosításához."
      });
    }

    const {
        name,
        description,
        priority,
        deadline,
        progress_frequency,
        progress_days,
        is_team_goal,
        assigned_to
    } = req.body;

    await db.query(
      `UPDATE goals
      SET name = ?, description = ?, priority = ?, deadline = ?, 
          progress_frequency = ?, progress_days = ?,
          is_team_goal = ?
      WHERE id = ?`,
      [
        name,
        description,
        priority,
        deadline || null,
        progress_frequency || null,
        progress_days || null,
        is_team_goal ? 1 : 0,
        goalId
      ]
    );

    // 🔥 ÚJ: hozzárendelt dolgozók frissítése
    if (Array.isArray(assigned_to)) {
      await db.query("DELETE FROM goal_assignments WHERE goal_id = ?", [goalId]);

      for (const empNum of assigned_to) {
        await db.query(
          "INSERT INTO goal_assignments (goal_id, employee_number) VALUES (?, ?)",
          [goalId, empNum]
        );
      }
    }

    res.json({ success: true, message: "Cél sikeresen frissítve." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

// ---------------------------------------------------------
// 8) Cél törlése – csak a létrehozó leader
// ---------------------------------------------------------
router.delete("/goals/:id", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const goalId = req.params.id;

    const [rows] = await db.query("SELECT leader_id FROM goals WHERE id = ?", [goalId]);
    if (rows.length === 0) {
      return res.json({ success: false, message: "A cél nem található." });
    }

    if (rows[0].leader_id !== req.user.employee_number) {
      return res.status(403).json({
        success: false,
        message: "Nincs jogosultságod a cél törléséhez."
      });
    }

    await db.query("DELETE FROM goal_updates WHERE goal_id = ?", [goalId]);
    await db.query("DELETE FROM goal_assignments WHERE goal_id = ?", [goalId]);
    await db.query("DELETE FROM goals WHERE id = ?", [goalId]);

    res.json({ success: true, message: "Cél sikeresen törölve." });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
});

module.exports = router;
