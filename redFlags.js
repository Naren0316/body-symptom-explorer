// Server-side safety net, mirroring the intent of `symptom-data.js`'s
// `redFlagRules` on the frontend. This is deliberately simple keyword
// matching, not diagnosis — its only job is to catch language that suggests
// a possible emergency and force an emergency banner regardless of what an
// AI response says.
//
// Keep this in sync conceptually with the frontend rules described in the
// repo README (chest pain, stroke signs, clot signs, bladder/bowel loss with
// back pain, "worst headache of my life", etc).

const RED_FLAG_PATTERNS = [
  /chest pain/i,
  /can'?t breathe|shortness of breath|difficulty breathing/i,
  /face.{0,15}droop|slurred speech|sudden weakness.{0,15}(one side|arm|leg)/i,
  /worst headache of my life/i,
  /(loss of|lost) (bladder|bowel) control/i,
  /coughing up blood|vomiting blood/i,
  /suicidal|want to die|end my life|kill myself/i,
  /uncontrolled bleeding/i,
];

function checkRedFlags(text) {
  if (typeof text !== "string") return { triggered: false, matches: [] };
  const matches = RED_FLAG_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (pattern) => pattern.source
  );
  return { triggered: matches.length > 0, matches };
}

module.exports = { checkRedFlags };
