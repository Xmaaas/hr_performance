console.log("authMiddleware fut!");
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Nincs token, hozzáférés megtagadva" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Érvénytelen token" });
  }
}

module.exports = authMiddleware;
