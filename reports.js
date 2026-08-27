const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const { checkRedFlags } = require("../utils/redFlags");

const router = express.Router();

// POST /api/reports  — create a report. Works logged-in or anonymous.
// Body: { region, painType, swelling, durationDays, severity, triggers, notes }
router.post("/", optionalAuth, (req, res) => {
  const { region, painType, swelling, durationDays, severity, triggers, notes } =
    req.body || {};

  if (typeof region !== "string" || region.trim() === "") {
    return res.status(400).json({ error: "A body region is required." });
  }
  if (severity !== undefined && (typeof severity !== "number" || severity < 0 || severity > 10)) {
    return res.status(400).json({ error: "Severity must be a number between 0 and 10." });
  }

  const freeText = [painType, notes].filter(Boolean).join(" ");
  const redFlag = checkRedFlags(freeText);

  const report = {
    id: crypto.randomUUID(),
    userId: req.user ? req.user.id : null,
    region,
    painType: painType || null,
    swelling: Boolean(swelling),
    durationDays: durationDays ?? null,
    severity: severity ?? null,
    triggers: Array.isArray(triggers) ? triggers : [],
    notes: notes || null,
    redFlagTriggered: redFlag.triggered,
    createdAt: new Date().toISOString(),
  };

  db.get("reports").push(report).write();

  res.status(201).json({ report, emergencyWarning: redFlag.triggered });
});

// GET /api/reports/me — a logged-in user's own reports, most recent first.
router.get("/me", requireAuth, (req, res) => {
  const reports = db
    .get("reports")
    .filter({ userId: req.user.id })
    .sortBy((r) => r.createdAt)
    .reverse()
    .value();

  res.json({ reports });
});

module.exports = router;
