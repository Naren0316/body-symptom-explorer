/**
 * symptom-data.js
 * ------------------------------------------------------------------
 * A small, hand-curated, offline knowledge base. This intentionally
 * does NOT scrape or aggregate live medical sources — uncurated
 * internet text about symptoms/medication is unreliable and unsafe
 * to serve automatically. Everything here is general education only,
 * phrased in categories rather than diagnoses, with no drug names
 * or dosages. See README.md for how to wire in a real backend model
 * if you want richer answers.
 * ------------------------------------------------------------------
 */

// Body parts are modelled with left/right suffixes (e.g. "knee_L").
// Medical content is shared across sides, so we normalize first.
export function normalizePart(partId) {
  return partId.replace(/_(L|R)$/, "");
}

export const regionLabels = {
  head: "Head",
  neck: "Neck",
  chest: "Chest",
  abdomen: "Abdomen",
  upper_back: "Upper back",
  lower_back: "Lower back",
  shoulder: "Shoulder",
  upperarm: "Upper arm",
  elbow: "Elbow",
  forearm: "Forearm",
  hand: "Hand / wrist",
  pelvis: "Hip / pelvis",
  thigh: "Thigh",
  knee: "Knee",
  calf: "Calf / shin",
  foot: "Foot / ankle",
};

/**
 * generalCategories: broad, non-diagnostic buckets a pain pattern
 *   commonly falls under — never a named disease.
 * selfCare: general, non-pharmacological measures.
 * seekCareIf: concrete reasons to escalate to a professional.
 */
export const regionInfo = {
  head: {
    generalCategories: [
      "Tension-type patterns (tight, band-like pressure)",
      "Migraine-type patterns (throbbing, one-sided, light/sound sensitivity)",
      "Sinus-related pressure",
      "Dehydration, poor sleep, or eye strain",
    ],
    selfCare: [
      "Rest in a dim, quiet room",
      "Steady hydration through the day",
      "Regular sleep and meal timing",
      "Gentle neck and shoulder stretches",
    ],
    seekCareIf: [
      "It's the 'worst headache of your life' or came on suddenly and severely",
      "It follows a head injury",
      "It comes with confusion, slurred speech, facial drooping, or limb weakness",
      "It comes with a stiff neck and fever",
      "It's a new pattern after age 50",
    ],
  },
  neck: {
    generalCategories: [
      "Muscle strain from posture or sleep position",
      "Stiffness after physical activity",
      "Referred tension from the upper back or shoulders",
    ],
    selfCare: ["Gentle range-of-motion stretches", "Alternating rest with light movement", "Posture breaks if desk-based work"],
    seekCareIf: [
      "Stiffness comes with fever and headache (possible meningitis warning combination)",
      "There's numbness, tingling, or weakness radiating into an arm",
      "It follows a fall, collision, or whiplash injury",
    ],
  },
  chest: {
    generalCategories: [
      "Musculoskeletal strain of the chest wall",
      "Reflux-related discomfort",
      "Anxiety-related tightness",
    ],
    selfCare: ["Slow, steady breathing", "Avoiding heavy meals close to activity", "Noting exactly when it occurs"],
    seekCareIf: [
      "ANY chest pain with shortness of breath, sweating, nausea, or pain spreading to the arm, jaw, or back",
      "Pressure or squeezing rather than a localized ache",
      "It appears with exertion and eases with rest",
      "You are unsure — chest pain is one symptom where it is always safer to get it checked urgently",
    ],
  },
  abdomen: {
    generalCategories: [
      "Digestive discomfort (gas, indigestion, irregularity)",
      "Muscular strain",
      "Menstrual-related cramping",
    ],
    selfCare: ["Light, bland meals", "Hydration", "Warmth applied to the area", "Tracking what precedes flare-ups"],
    seekCareIf: [
      "Pain is severe, sudden, or localized to one side (especially lower right)",
      "It comes with a rigid or board-like abdomen",
      "There's persistent vomiting, blood in vomit or stool, or black stools",
      "It comes with fever or you are pregnant",
    ],
  },
  upper_back: {
    generalCategories: ["Postural muscle strain", "Tightness from repetitive movement or desk work"],
    selfCare: ["Stretching and mobility work", "Ergonomic adjustments", "Short walks to break up sitting"],
    seekCareIf: ["Pain follows an injury", "There's numbness or weakness in an arm", "It comes with chest symptoms — treat as chest pain (see above)"],
  },
  lower_back: {
    generalCategories: ["Muscular strain", "Joint stiffness", "Nerve irritation (sciatica-type pattern)"],
    selfCare: ["Gentle movement rather than prolonged bed rest", "Alternating positions", "Supportive seating"],
    seekCareIf: [
      "Pain radiates down a leg past the knee, especially with numbness",
      "There's loss of bladder or bowel control, or numbness in the groin (seek emergency care immediately)",
      "It follows a significant fall or trauma",
      "There's unexplained weight loss alongside the pain",
    ],
  },
  shoulder: {
    generalCategories: ["Rotator cuff strain", "Joint stiffness ('frozen shoulder' pattern)", "Referred pain from the neck"],
    selfCare: ["Rest from the aggravating motion", "Gentle pendulum stretches", "Alternating temperature therapy"],
    seekCareIf: ["Sudden inability to lift the arm after injury", "Visible deformity", "Numbness down the arm"],
  },
  upperarm: {
    generalCategories: ["Muscle strain", "Overuse from repetitive lifting"],
    selfCare: ["Rest from the aggravating activity", "Gradual return to movement"],
    seekCareIf: ["Sudden severe pain with a snapping sensation", "Visible swelling or bruising after injury"],
  },
  elbow: {
    generalCategories: ["Tendon overuse (tennis/golfer's elbow pattern)", "Joint strain"],
    selfCare: ["Rest from gripping/twisting motions", "Gentle stretching of the forearm"],
    seekCareIf: ["Visible deformity after a fall", "Inability to bend or straighten the arm"],
  },
  forearm: {
    generalCategories: ["Repetitive strain", "Muscle tightness from grip-heavy activity"],
    selfCare: ["Wrist and forearm stretches", "Breaks from repetitive tasks"],
    seekCareIf: ["Numbness or tingling into the hand", "Weakness gripping objects"],
  },
  hand: {
    generalCategories: ["Joint strain", "Repetitive strain (typing, tools)", "Nerve compression pattern"],
    selfCare: ["Rest and gentle stretching", "Shaking out numbness/tingling breaks"],
    seekCareIf: ["Numbness/tingling that's constant or worsening at night", "Visible deformity after injury", "Loss of grip strength"],
  },
  pelvis: {
    generalCategories: ["Hip joint strain", "Muscular tightness (hip flexors/glutes)"],
    selfCare: ["Gentle stretching", "Avoiding prolonged sitting"],
    seekCareIf: ["Inability to bear weight after a fall, especially in older adults", "Sudden severe pain"],
  },
  thigh: {
    generalCategories: ["Muscle strain", "Cramping from dehydration or overuse"],
    selfCare: ["Rest, gentle stretching, hydration"],
    seekCareIf: ["Sudden swelling with warmth and redness in one leg (possible clot warning combination)", "Severe pain after a pop or tear sensation"],
  },
  knee: {
    generalCategories: ["Ligament or tendon strain", "Overuse from running/stairs", "Joint wear-related stiffness"],
    selfCare: ["Rest, gentle range-of-motion", "Supportive footwear"],
    seekCareIf: ["Visible deformity or inability to bear weight", "Locking or giving-way sensation", "Significant swelling right after injury"],
  },
  calf: {
    generalCategories: ["Muscle cramp or strain", "Tightness from overuse"],
    selfCare: ["Gentle stretching", "Hydration", "Gradual activity increase"],
    seekCareIf: ["Sudden swelling, warmth, and redness in one calf (possible clot warning combination — seek prompt care)", "Sudden sharp pain with a 'pop'"],
  },
  foot: {
    generalCategories: ["Overuse strain (arch/heel)", "Footwear-related irritation"],
    selfCare: ["Supportive footwear", "Rest from high-impact activity", "Gentle stretching"],
    seekCareIf: ["Inability to bear weight after injury", "Visible deformity", "Signs of infection (spreading redness, warmth, fever) especially if diabetic"],
  },
};

/**
 * Cross-region red-flag rules. These override normal responses
 * whenever the described combination is present, regardless of
 * which body part was clicked.
 */
export const redFlagRules = [
  {
    id: "chest-emergency",
    test: (ctx) => ctx.part === "chest",
    title: "Chest pain needs urgent attention",
    text: "Chest pain can occasionally signal a heart or lung emergency. If you also have shortness of breath, sweating, nausea, or pain spreading to your arm, jaw, or back, call emergency services now rather than waiting on this response.",
  },
  {
    id: "stroke-signs",
    test: (ctx) => /face.*droop|slurred|can'?t speak|one side.*weak|sudden.*confusion/i.test(ctx.text || ""),
    title: "Possible stroke warning signs",
    text: "Facial drooping, slurred speech, or sudden one-sided weakness are stroke warning signs. Call emergency services immediately — treatment works best in the first hours.",
  },
  {
    id: "clot-signs",
    test: (ctx) => (ctx.part === "calf" || ctx.part === "thigh") && ctx.swelling === "yes",
    title: "Sudden one-leg swelling",
    text: "Sudden swelling, warmth, and redness in one leg can occasionally indicate a blood clot. If it's new, gotten worse quickly, or you also feel short of breath, seek care promptly rather than waiting it out.",
  },
  {
    id: "back-neuro",
    test: (ctx) => /bladder|bowel|numb.*groin|saddle/i.test(ctx.text || ""),
    title: "Possible nerve emergency",
    text: "Loss of bladder or bowel control, or numbness in the groin/inner thighs alongside back pain, needs emergency evaluation right away — this combination can indicate pressure on the spinal nerves.",
  },
  {
    id: "worst-headache",
    test: (ctx) => /worst headache|thunderclap/i.test(ctx.text || ""),
    title: "Sudden, severe headache",
    text: "A sudden, severe headache described as the 'worst of your life' is a recognized emergency warning sign. Please seek urgent care rather than waiting to see if it passes.",
  },
];

/**
 * Free-text FAQ matching for the open chat box (not tied to a
 * clicked body region).
 */
export const faqTopics = [
  {
    keywords: ["fever", "temperature", "chills"],
    label: "Fever",
    generalCategories: ["Common viral infection", "Bacterial infection", "Body's normal immune response"],
    selfCare: ["Rest and fluids", "Light clothing and a cool room", "Track the temperature over time"],
    seekCareIf: ["Fever above 39.4°C (103°F) in adults", "Lasts more than 3 days", "Comes with a stiff neck, rash, confusion, or difficulty breathing", "In infants under 3 months — always seek care"],
  },
  {
    keywords: ["cough"],
    label: "Cough",
    generalCategories: ["Common cold or viral infection", "Post-nasal drip", "Reflux-related irritation"],
    selfCare: ["Fluids and rest", "Humidified air", "Honey for soothing (not for infants under 1 year)"],
    seekCareIf: ["Coughing up blood", "Lasts more than 3 weeks", "Comes with chest pain or shortness of breath"],
  },
  {
    keywords: ["sore throat", "throat pain"],
    label: "Sore throat",
    generalCategories: ["Viral pharyngitis", "Bacterial infection (e.g. strep-type pattern)", "Allergies or dry air"],
    selfCare: ["Warm fluids", "Gargling with warm salt water", "Humidified air"],
    seekCareIf: ["Difficulty swallowing or breathing", "High fever with white patches on the tonsils", "Lasts beyond a week"],
  },
  {
    keywords: ["fatigue", "tired", "exhausted", "low energy"],
    label: "Fatigue",
    generalCategories: ["Sleep debt", "Stress or overexertion", "Nutritional gaps", "An underlying condition if persistent"],
    selfCare: ["Consistent sleep schedule", "Balanced meals and hydration", "Gentle regular activity"],
    seekCareIf: ["Persists for weeks despite rest", "Comes with unexplained weight change", "Comes with shortness of breath or chest discomfort"],
  },
  {
    keywords: ["rash", "skin irritation", "itchy skin", "hives"],
    label: "Rash",
    generalCategories: ["Contact irritation or allergy", "Heat rash", "Viral rash"],
    selfCare: ["Avoid the suspected irritant", "Cool compress", "Loose, breathable clothing"],
    seekCareIf: ["Spreads rapidly", "Comes with facial or throat swelling or trouble breathing (seek emergency care)", "Comes with fever", "Looks like bruising and doesn't fade under pressure"],
  },
  {
    keywords: ["dizziness", "dizzy", "lightheaded", "vertigo"],
    label: "Dizziness",
    generalCategories: ["Dehydration or low blood sugar", "Inner-ear related balance issue", "Standing up too quickly"],
    selfCare: ["Sit or lie down immediately when it hits", "Hydrate", "Rise slowly from sitting/lying"],
    seekCareIf: ["Comes with chest pain, slurred speech, or one-sided weakness", "Causes fainting", "Is persistent or recurring"],
  },
  {
    keywords: ["nausea", "vomiting", "sick to my stomach"],
    label: "Nausea / vomiting",
    generalCategories: ["Viral gastroenteritis", "Food-related irritation", "Motion or migraine-related"],
    selfCare: ["Small sips of fluid, spaced out", "Bland foods once tolerated", "Rest"],
    seekCareIf: ["Signs of dehydration (very dry mouth, little/no urination)", "Blood in vomit", "Severe abdominal pain accompanies it", "Lasts more than 2 days"],
  },
  {
    keywords: ["joint pain", "joints ache", "arthritis"],
    label: "Joint pain",
    generalCategories: ["Overuse strain", "Inflammatory joint irritation", "Age-related joint wear pattern"],
    selfCare: ["Gentle movement over full rest", "Alternating temperature therapy", "Supportive footwear/posture"],
    seekCareIf: ["Joint is hot, red, and swollen", "Comes with fever", "Follows a significant injury"],
  },
  {
    keywords: ["insomnia", "can't sleep", "trouble sleeping"],
    label: "Sleep difficulty",
    generalCategories: ["Stress-related", "Irregular sleep schedule", "Screen/caffeine timing"],
    selfCare: ["Consistent sleep/wake time", "Wind-down routine without screens", "Limit caffeine after midday"],
    seekCareIf: ["Persists beyond a few weeks and affects daily function"],
  },
];

export function findFaqMatch(text) {
  const lower = (text || "").toLowerCase();
  return faqTopics.find((topic) => topic.keywords.some((k) => lower.includes(k)));
}
