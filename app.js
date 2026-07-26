import { initBodyScene, onHover, onSelect, setAutoRotate, resetView, markReported } from "./three-scene.js";
import { initChatDom, greet, reportPain } from "./chatbot.js";
import { regionLabels, normalizePart } from "./symptom-data.js";

// ---------- DOM refs ----------
const canvas = document.getElementById("bodyCanvas");
const loadingOverlay = document.getElementById("loadingOverlay");
const hoverReadout = document.getElementById("hoverReadout");
const hoverLabel = document.getElementById("hoverLabel");
const regionLog = document.getElementById("regionLog");
const regionLogList = document.getElementById("regionLogList");

const toggleRotateBtn = document.getElementById("toggleRotate");
const resetViewBtn = document.getElementById("resetView");
const toggleChatBtn = document.getElementById("toggleChat");
const chatPanel = document.getElementById("chatPanel");
const chatCloseBtn = document.getElementById("chatClose");

const painModalBackdrop = document.getElementById("painModalBackdrop");
const painModalTitle = document.getElementById("painModalTitle");
const painModalClose = document.getElementById("painModalClose");
const painTypeChips = document.getElementById("painTypeChips");
const triggerChips = document.getElementById("triggerChips");
const severitySlider = document.getElementById("severitySlider");
const severityValue = document.getElementById("severityValue");
const painDuration = document.getElementById("painDuration");
const submitPainBtn = document.getElementById("submitPain");

// ---------- state ----------
let currentPartId = null;
let selectedPainType = null;
let selectedSwelling = null;
let selectedTriggers = new Set();
const reportedRegions = [];

// ---------- boot ----------
initBodyScene(canvas);
initChatDom();
window.requestAnimationFrame(() => {
  setTimeout(() => (loadingOverlay.style.opacity = "0"), 400);
  setTimeout(() => (loadingOverlay.hidden = true), 850);
});

// ---------- hover HUD ----------
onHover((label) => {
  if (label) {
    hoverLabel.textContent = label;
    hoverReadout.hidden = false;
  } else {
    hoverReadout.hidden = true;
  }
});

// ---------- click -> open pain modal ----------
onSelect((partId) => {
  currentPartId = partId;
  const base = normalizePart(partId);
  const side = partId.endsWith("_L") ? " (left)" : partId.endsWith("_R") ? " (right)" : "";
  painModalTitle.textContent = (regionLabels[base] || base) + side;

  selectedPainType = null;
  selectedSwelling = null;
  selectedTriggers = new Set();
  [...painTypeChips.children].forEach((c) => c.classList.remove("active"));
  [...triggerChips.children].forEach((c) => c.classList.remove("active"));
  document.querySelectorAll("[data-swell]").forEach((c) => c.classList.remove("active"));
  severitySlider.value = 5;
  severityValue.textContent = "5";
  painDuration.value = "just_now";

  painModalBackdrop.hidden = false;
});

// ---------- modal interactions ----------
painModalClose.addEventListener("click", () => (painModalBackdrop.hidden = true));
painModalBackdrop.addEventListener("click", (e) => {
  if (e.target === painModalBackdrop) painModalBackdrop.hidden = true;
});

painTypeChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  [...painTypeChips.children].forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  selectedPainType = chip.dataset.value;
});

document.querySelectorAll("[data-swell]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("[data-swell]").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedSwelling = chip.dataset.swell;
  });
});

triggerChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  chip.classList.toggle("active");
  const val = chip.dataset.trigger;
  if (selectedTriggers.has(val)) selectedTriggers.delete(val);
  else selectedTriggers.add(val);
});

severitySlider.addEventListener("input", () => {
  severityValue.textContent = severitySlider.value;
});

submitPainBtn.addEventListener("click", () => {
  if (!currentPartId) return;
  const base = normalizePart(currentPartId);
  const side = currentPartId.endsWith("_L") ? " (left)" : currentPartId.endsWith("_R") ? " (right)" : "";
  const label = (regionLabels[base] || base) + side;

  const ctx = {
    part: base,
    fullPartId: currentPartId,
    label,
    painType: selectedPainType,
    swelling: selectedSwelling || "unsure",
    duration: painDuration.value,
    severity: Number(severitySlider.value),
    triggers: [...selectedTriggers],
  };

  markReported(currentPartId);
  reportedRegions.push(label);
  regionLog.hidden = false;
  regionLogList.innerHTML = reportedRegions.map((r) => `<li>${r}</li>`).join("");

  painModalBackdrop.hidden = true;
  openChat();
  reportPain(ctx);
});

// ---------- top bar controls ----------
let autoRotateOn = true;
toggleRotateBtn.addEventListener("click", () => {
  autoRotateOn = !autoRotateOn;
  setAutoRotate(autoRotateOn);
  toggleRotateBtn.setAttribute("aria-pressed", String(autoRotateOn));
});

resetViewBtn.addEventListener("click", resetView);

function openChat() {
  chatPanel.hidden = false;
  greet();
}
function closeChat() {
  chatPanel.hidden = true;
}
toggleChatBtn.addEventListener("click", () => {
  if (chatPanel.hidden) openChat();
  else closeChat();
});
chatCloseBtn.addEventListener("click", closeChat);

// keyboard: Escape closes whichever overlay is open
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!painModalBackdrop.hidden) painModalBackdrop.hidden = true;
  else if (!chatPanel.hidden) closeChat();
});
