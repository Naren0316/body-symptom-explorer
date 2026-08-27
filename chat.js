const express = require("express");
const rateLimit = require("express-rate-limit");
const { checkRedFlags } = require("../utils/redFlags");

const router = express.Router();

// Keeps someone from hammering your Anthropic key through this endpoint.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages — please wait a moment and try again." },
});

const SYSTEM_PROMPT = `You are the free-text assistant inside SOMASCAN, an educational
symptom-explorer site. You are NOT a medical device and must not diagnose,
prescribe, or name specific drugs or dosages. Give general educational
information only, in plain language, and always suggest seeing a clinician
for anything beyond mild/self-limiting concerns. If the message describes
anything that could be a medical emergency, say so plainly and recommend
contacting emergency services immediately, before anything else in your
reply. Keep responses concise (under ~150 words).`;

// POST /api/chat  { message, context }
router.post("/", chatLimiter, async (req, res) => {
  const { message, context } = req.body || {};

  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "A message is required." });
  }

  const redFlag = checkRedFlags(message);

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Server is not configured with an ANTHROPIC_API_KEY yet.",
      emergencyWarning: redFlag.triggered,
    });
  }

  try {
    const userContent = context
      ? `Context: ${JSON.stringify(context)}\n\nUser message: ${message}`
      : message;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(502).json({ error: "The AI service returned an error." });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    res.json({
      reply: reply || "Sorry, I couldn't generate a response just now.",
      emergencyWarning: redFlag.triggered,
    });
  } catch (err) {
    console.error("Chat proxy error:", err);
    res.status(500).json({ error: "Something went wrong talking to the AI service." });
  }
});

module.exports = router;
