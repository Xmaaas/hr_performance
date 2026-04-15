module.exports = function leaderOrAdmin(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false, message: "Nincs bejelentkezve" });
  }

  if (user.role === "leader" || user.role === "admin") {
    return next();
  }

  return res.status(403).json({ success: false, message: "Nincs jogosultság" });
};
