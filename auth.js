const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /api/auth/signup { email, password }
router.post("/signup", (req, res) => {
  const { email, password } = req.body || {};

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = db.get("users").find({ email: email.toLowerCase() }).value();
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.get("users").push(user).write();

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

// POST /api/auth/login { email, password }
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.get("users").find({ email: email.toLowerCase() }).value();
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
});

module.exports = router;
