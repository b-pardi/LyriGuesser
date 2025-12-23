/**
 * middleware.js
 *
 * "Middleware" in Express is just a function that runs BEFORE your route handler.
 * We use it for things like:
 *  - checking if user is logged in
 *  - checking if user is admin
 */

const jwt = require("jsonwebtoken");

/**
 * requireAuth
 * - Reads the Authorization header: "Bearer <TOKEN>"
 * - Verifies the token using JWT_SECRET
 * - Attaches decoded user data to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  // Expect "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });
  }

  try {
    // If token is valid, jwt.verify returns the decoded payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // We'll store it on req.user so routes can use it
    req.user = payload;

    // Continue to the actual endpoint handler
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * requireAdmin
 * - Must be used AFTER requireAuth
 * - Checks if req.user.role === "ADMIN"
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
