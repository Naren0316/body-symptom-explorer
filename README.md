# SOMASCAN — Interactive Body Symptom Explorer

A static, single-page site with a rotatable 3D human body. Click a region to
report pain (type, swelling, duration, severity, triggers), and a built-in
assistant returns general educational information plus a "get this checked
if…" list. Free-text symptom chat is also supported.

**Live demo requires no build step** — it's plain HTML/CSS/JS with Three.js
loaded from a CDN, so it runs as-is on GitHub Pages.

## Why it works this way (read before you extend it)

You asked for the assistant to "check every corner of the internet for
diseases and prescriptions worldwide." I deliberately did **not** build that
literally, for two reasons:

1. **A static GitHub Pages site can't safely call a live AI/medical API.**
   Any API key embedded in client-side JS is visible to anyone who opens
   dev tools — it would get scraped and abused within hours of going public.
2. **Scraping arbitrary medical text from the open web and serving it as
   fact is unsafe.** Symptom checkers that are actually trustworthy (Mayo
   Clinic, NHS 111, Ada) use curated, clinician-reviewed content — not live
   scraping — for exactly this reason.

So instead: `js/symptom-data.js` is a small, hand-curated, offline knowledge
base of general categories, self-care tips, and red-flag warning signs —
**no diagnoses, no drug names, no dosages.** It also includes safety rules
(`redFlagRules`) that watch for genuinely urgent combinations (chest pain,
stroke signs, clot signs, bladder/bowel loss with back pain, "worst headache
of my life") and surface an emergency banner regardless of what else is
happening in the conversation.

This is a portfolio/learning project, not a medical device — the disclaimer
bar in the header should stay in any version you ship.

## File structure

```
somascan/
├── index.html          entry point, all markup
├── style.css            clinical dark HUD theme
├── js/
│   ├── symptom-data.js  offline knowledge base + red-flag rules
│   ├── three-scene.js   3D body: build, orbit/zoom, hover, click, scan FX
│   ├── chatbot.js       message rendering + matching logic
│   └── app.js            wires the modal, chat panel, and top bar together
└── README.md
```

## Run locally

Just serve the folder — ES modules need `http://`, not `file://`.

```bash
cd somascan
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "SOMASCAN: interactive body symptom explorer"
git branch -M main
git remote add origin https://github.com/<your-username>/somascan.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source → Deploy from branch → main
→ / (root)**. Your site will be live at
`https://<your-username>.github.io/somascan/` within a minute or two.

## Extending it with a real AI backend (optional, do it right)

If you want smarter free-text answers than the local keyword matcher gives,
the safe pattern is:

1. Deploy a tiny serverless function (Cloudflare Worker, Vercel Function, or
   similar) that holds your API key **server-side only**.
2. That function receives `{ message, context }` from the browser, calls the
   model API, and returns just the reply text.
3. `chatbot.js` calls your function's URL instead of (or in addition to)
   the local matcher — never `api.anthropic.com` or similar directly from
   the browser.
4. Keep the same disclaimer and red-flag banner logic in front of whatever
   the model returns — a general-purpose model will happily sound
   authoritative about things it shouldn't diagnose.

Anthropic's docs on tool use / API basics: https://docs.claude.com

## Extending the body model

Each clickable region is a named mesh in `three-scene.js` (`addPart(...)`),
keyed by an ID like `knee_L`. To add a region: add a mesh with a new
`partId`, then add a matching entry to `regionLabels` and `regionInfo` in
`symptom-data.js`. Left/right sides automatically share the same medical
content via `normalizePart()`.

## Known simplifications

- The body is built from primitive shapes (capsules, spheres, boxes), not an
  imported anatomical mesh — this keeps the repo dependency-free and every
  region individually clickable, at the cost of anatomical realism.
- The knowledge base is intentionally small. It's meant to be a solid,
  extensible skeleton, not a finished medical product.
