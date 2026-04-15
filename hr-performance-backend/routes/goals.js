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

  const start = goal.created_at ? new Date(goal.created_at) : new Date();

  let end;
  if (goal.deadline) {
    end = new Date(goal.deadline);
  } else {
    end = new Date(start.getTime());
    end.setMonth(end.getMonth() + 1);
  }

  const freq = goal.progress_frequency || "monthly";

  let current = new Date(start);

  while (current <= end) {
    schedule.push(new Date(current));

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
  return schedule.map(date => {
    const iso = date.toISOString().split("T")[0]; // YYYY-MM-DD

    const update = updates.find(u => {
      // u.created_at már VARCHAR(10) → pl. "2026-04-11"
      const updIso = typeof u.created_at === "string"
        ? u.created_at
        : new Date(u.created_at).toISOString().split("T")[0];
      return updIso === iso;
    });

    let status = "pending";
    if (update) status = "completed";
    else if (iso < new Date().toISOString().split("T")[0]) status = "overdue";

    return { date: iso, status, update: update || null };
  });
}

// ---------------------------------------------------------
// 3) Leader beosztottainak lekérése
// ---------------------------------------------------------
router.get("/leader/subordinates", authMiddleware, leaderOrAdmin, async (req, res) => {
  try {
    const leaderEmpNum = req.user.employee_number;

    const [rows] = await db.query(
      "SELECT name, employee_number FROM employees WHERE leader_id = ?",
      [leaderEmpNum]
    );

    res.json({ success: true, subordinates: rows });
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
// 5) Saját célok lekérése timeline-nal
// ---------------------------------------------------------
router.get("/goals/my", authMiddleware, async (req, res) => {
  try {
    const empNum = req.user.employee_number;

    const [assignedGoals] = await db.query(
      `SELECT g.*
       FROM goals g
       JOIN goal_assignments ga ON g.id = ga.goal_id
       WHERE ga.employee_number = ?`,
      [empNum]
    );

    const [createdGoals] = await db.query(
      `SELECT *
       FROM goals
       WHERE leader_id = ?`,
      [empNum]
    );

    async function attachTimeline(goal) {
      goal.created_at = goal.created_at || new Date();
      goal.deadline = goal.deadline || null;
      goal.progress_frequency = goal.progress_frequency || "monthly";

      const [updates] = await db.query(
        "SELECT * FROM goal_updates WHERE goal_id = ? ORDER BY created_at ASC",
        [goal.id]
      );

      // created_at → biztosan string (YYYY-MM-DD)
      updates.forEach(u => {
        if (typeof u.created_at !== "string") {
          u.created_at = new Date(u.created_at).toISOString().split("T")[0];
        }
      });

      const schedule = generateSchedule(goal);
      goal.timeline = mergeTimeline(schedule, updates);
      goal.updates = updates;

      return goal;
    }

    const assignedWithTimeline = await Promise.all(assignedGoals.map(attachTimeline));
    const createdWithTimeline = await Promise.all(createdGoals.map(attachTimeline));

    res.json({
      success: true,
      assignedGoals: assignedWithTimeline,
      createdGoals: createdWithTimeline
    });

  } catch (err) {
    console.error(err);
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

    const [goalRows] = await db.query("SELECT * FROM goals WHERE id = ?", [goalId]);
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

    const [updates] = await db.query(
      "SELECT * FROM goal_updates WHERE goal_id = ? ORDER BY created_at ASC",
      [goalId]
    );

    const schedule = generateSchedule(goalRows[0]);
    const timeline = mergeTimeline(schedule, updates);

    const todayStr = new Date().toISOString().split("T")[0];

    // legközelebbi timeline dátum
    let closest = timeline[0].date;
    let minDiff = Math.abs(new Date(closest) - new Date(todayStr));

    for (const t of timeline) {
      const diff = Math.abs(new Date(t.date) - new Date(todayStr));
      if (diff < minDiff) {
        minDiff = diff;
        closest = t.date;
      }
    }

    const isoDate = closest; // már YYYY-MM-DD

    const [result] = await db.query(
      "INSERT INTO goal_updates (goal_id, employee_number, progress, comment, created_at) VALUES (?, ?, ?, ?, ?)",
      [goalId, employee, progress, comment, isoDate]
    );

    const [update] = await db.query(
      "SELECT * FROM goal_updates WHERE id = ?",
      [result.insertId]
    );

    update[0].created_at = isoDate;

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
      progress_days
    } = req.body;

    await db.query(
      `UPDATE goals
       SET name = ?, description = ?, priority = ?, deadline = ?, 
           progress_frequency = ?, progress_days = ?
       WHERE id = ?`,
      [
        name,
        description,
        priority,
        deadline || null,
        progress_frequency || null,
        progress_days || null,
        goalId
      ]
    );

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
