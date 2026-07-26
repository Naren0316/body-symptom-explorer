import { regionInfo, regionLabels, normalizePart, redFlagRules, findFaqMatch } from "./symptom-data.js";

let messagesEl, formEl, inputEl;
let emergencyBanner, emergencyTitle, emergencyText, emergencyDismiss;
let hasGreeted = false;

export function initChatDom() {
  messagesEl = document.getElementById("chatMessages");
  formEl = document.getElementById("chatForm");
  inputEl = document.getElementById("chatInput");
  emergencyBanner = document.getElementById("emergencyBanner");
  emergencyTitle = document.getElementById("emergencyTitle");
  emergencyText = document.getElementById("emergencyText");
  emergencyDismiss = document.getElementById("emergencyDismiss");

  emergencyDismiss.addEventListener("click", () => (emergencyBanner.hidden = true));

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    addUserMessage(text);
    inputEl.value = "";
    handleFreeText(text);
  });
}

function scrollDown() {
  messagesEl.scrollTop = messagesEl.scrollHeight + 200;
}

function addUserMessage(text) {
  const div = document.createElement("div");
  div.className = "msg msg-user";
  div.textContent = text;
  messagesEl.appendChild(div);
  scrollDown();
}

function addBotMessage(html, { flag = false } = {}) {
  const div = document.createElement("div");
  div.className = flag ? "msg msg-flag" : "msg msg-bot";
  div.innerHTML = html;
  messagesEl.appendChild(div);
  scrollDown();
}

function listHtml(items) {
  return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function raiseEmergency(title, text) {
  emergencyTitle.textContent = title;
  emergencyText.textContent = text;
  emergencyBanner.hidden = false;
  addBotMessage(`<strong>${title}</strong><p style="margin-top:6px">${text}</p>`, { flag: true });
}

function checkRedFlags(ctx) {
  const hit = redFlagRules.find((rule) => rule.test(ctx));
  if (hit) {
    raiseEmergency(hit.title, hit.text);
    return true;
  }
  return false;
}

export function greet() {
  if (hasGreeted) return;
  hasGreeted = true;
  addBotMessage(
    `Hi — I'm the SOMASCAN assistant. Click a region on the model, or just tell me what's going on, and I'll share general information to help you understand it. I'm not a doctor, so anything urgent or uncertain should still go to a real one.`
  );
}

/**
 * Called after the pain-report modal is submitted.
 * ctx = { part, label, painType, swelling, duration, severity, triggers }
 */
export function reportPain(ctx) {
  const base = normalizePart(ctx.part);
  const info = regionInfo[base];
  const label = ctx.label || regionLabels[base] || ctx.part;

  addUserMessage(
    `${label}: ${ctx.painType || "unspecified"} pain, severity ${ctx.severity}/10, ` +
      `swelling: ${ctx.swelling}, duration: ${ctx.duration}` +
      (ctx.triggers?.length ? `, worse with: ${ctx.triggers.join(", ")}` : "")
  );

  if (checkRedFlags(ctx)) {
    // Emergency message already shown; still add gentle context after.
  }

  if (!info) {
    addBotMessage(
      `Thanks for reporting the ${label.toLowerCase()}. I don't have a detailed profile for this exact region yet, so the safest step is a quick check with a clinician, especially if it's severe or getting worse.`
    );
    return;
  }

  let severityNote = "";
  if (ctx.severity >= 8) {
    severityNote = `<p style="margin-top:8px"><strong>That's a high severity rating.</strong> Pain at ${ctx.severity}/10 is worth getting checked soon rather than waiting it out.</p>`;
  } else if (ctx.duration === "chronic" && ctx.severity >= 4) {
    severityNote = `<p style="margin-top:8px">Since this has been going on for months, it's worth having a clinician take a look even if it's tolerable day-to-day.</p>`;
  }

  addBotMessage(
    `<strong>${label} — general picture</strong>` +
      `<p style="margin-top:6px">Patterns like this are commonly associated with:</p>` +
      listHtml(info.generalCategories) +
      `<p style="margin-top:8px"><strong>General self-care</strong></p>` +
      listHtml(info.selfCare) +
      `<p style="margin-top:8px"><strong>Get it checked if</strong></p>` +
      listHtml(info.seekCareIf) +
      severityNote +
      `<small>General information only — not a diagnosis.</small>`
  );
}

function handleFreeText(text) {
  const redFlagHit = checkRedFlags({ text });

  const faq = findFaqMatch(text);
  if (faq) {
    addBotMessage(
      `<strong>${faq.label}</strong>` +
        `<p style="margin-top:6px">Commonly associated with:</p>` +
        listHtml(faq.generalCategories) +
        `<p style="margin-top:8px"><strong>General self-care</strong></p>` +
        listHtml(faq.selfCare) +
        `<p style="margin-top:8px"><strong>Get it checked if</strong></p>` +
        listHtml(faq.seekCareIf) +
        `<small>General information only — not a diagnosis.</small>`
    );
    return;
  }

  if (!redFlagHit) {
    addBotMessage(
      `I don't have a specific profile for that yet in my local knowledge base — it's intentionally small and curated rather than pulled live from the internet, so it won't cover everything. ` +
        `You can also try clicking the matching region on the model for a more structured report, or describe it a bit more (location, what it feels like, how long).`
    );
  }
}
