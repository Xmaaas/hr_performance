module.exports = function (req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    return res.status(403).json({
      success: false,
      message: "Nincs jogosultságod ehhez a művelethez (admin vagy HR szükséges)"
    });
  }
  next();
};
