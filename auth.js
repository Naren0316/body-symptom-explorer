const jwt = require("jsonwebtoken");

// Requires a valid Bearer token. Attaches { id, email } to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Doesn't fail if there's no token — just attaches req.user if one is present.
// Used for routes that work both anonymously and logged-in (e.g. reports).
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
  } catch (err) {
    // ignore invalid token for optional auth — treat as anonymous
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
