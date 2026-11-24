/**
 * interactions.js
 * A small, transparent rule engine. It flags known patterns so the patient
 * can ask a better question — it does not diagnose or tell anyone to stop a
 * medicine.
 */

export const SEVERITY = {
  high: {
    label: "High concern",
    badge: "bg-red-100 text-red-700 border-red-200",
    card: "border-red-200 bg-red-50/50",
    bar: "bg-red-100/70 border-red-200/70",
    heading: "text-red-900",
  },
  moderate: {
    label: "Worth asking",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    card: "border-amber-200 bg-amber-50/50",
    bar: "bg-amber-100/70 border-amber-200/70",
    heading: "text-amber-900",
  },
};

const RULES = [
  {
    id: "warfarin-aspirin",
    severity: "high",
    title: "Bleeding risk",
    a: { label: "Warfarin", aliases: ["warfarin", "coumadin"] },
    b: { label: "Aspirin", aliases: ["aspirin", "ecosprin", "acetylsalicylic"] },
    explanation:
      "Warfarin and aspirin both reduce clotting. Taken together, the risk of serious bleeding — including stomach bleeding — is higher than with either medicine alone.",
    ask: [
      "Do I need both of these together, or can one be stopped?",
      "Should my INR be checked more often while I take both?",
      "Which warning signs of bleeding mean I should get care right away?",
    ],
  },
  {
    id: "warfarin-nsaid",
    severity: "high",
    title: "Bleeding risk with painkillers",
    a: { label: "Warfarin", aliases: ["warfarin", "coumadin"] },
    b: {
      label: "NSAID painkiller",
      aliases: ["ibuprofen", "diclofenac", "naproxen", "aceclofenac"],
    },
    explanation:
      "Anti-inflammatory painkillers (NSAIDs) make bleeding more likely with warfarin and can irritate the stomach lining, so the two are usually avoided together.",
    ask: [
      "What can I take for pain or fever instead of ibuprofen?",
      "Should I have a stomach-protecting medicine if I must take one?",
      "How often should my INR be checked after a change?",
    ],
  },
  {
    id: "levothyroxine-calcium",
    severity: "moderate",
    title: "Thyroid medicine absorption",
    a: {
      label: "Levothyroxine",
      aliases: ["levothyroxine", "thyroxine", "eltroxin", "thyronorm"],
    },
    b: {
      label: "Calcium",
      aliases: ["calcium", "calcium carbonate", "calcium citrate"],
    },
    explanation:
      "Calcium binds levothyroxine in the gut, so less thyroid hormone is absorbed. Thyroid levels can drift even when the levothyroxine dose has not changed.",
    ask: [
      "How many hours apart should I take calcium and levothyroxine?",
      "Should we recheck my TSH after I settle into this routine?",
      "Does the timing change if I also take iron or antacids?",
    ],
  },
  {
    id: "levothyroxine-iron",
    severity: "moderate",
    title: "Thyroid medicine absorption",
    a: {
      label: "Levothyroxine",
      aliases: ["levothyroxine", "thyroxine", "eltroxin", "thyronorm"],
    },
    b: {
      label: "Iron",
      aliases: ["ferrous", "iron", "ferritin supplement"],
    },
    explanation:
      "Iron and levothyroxine compete in the gut, which can lower how much thyroid hormone your body absorbs.",
    ask: [
      "How far apart should I space iron and levothyroxine?",
      "When should my thyroid levels be checked again?",
    ],
  },
  {
    id: "statin-amlodipine",
    severity: "moderate",
    title: "Statin levels can rise",
    a: {
      label: "Statin",
      aliases: ["atorvastatin", "simvastatin", "rosuvastatin", "statin"],
    },
    b: { label: "Amlodipine", aliases: ["amlodipine"] },
    explanation:
      "Amlodipine can raise the level of some statins, especially simvastatin, which may increase muscle aches or cramps.",
    ask: [
      "Is this statin dose safe alongside amlodipine?",
      "Which muscle symptoms should I report promptly?",
    ],
  },
  {
    id: "clopidogrel-ppi",
    severity: "moderate",
    title: "Clopidogrel effect",
    a: {
      label: "Clopidogrel",
      aliases: ["clopidogrel", "plavix"],
    },
    b: {
      label: "Omeprazole",
      aliases: ["omeprazole", "esomeprazole", "pantoprazole"],
    },
    explanation:
      "Some acid reducers can reduce how well clopidogrel works. A different acid reducer may be preferred.",
    ask: [
      "Is there a different acid reducer that suits clopidogrel better?",
      "Do I need this medicine long term?",
    ],
  },
  {
    id: "ace-spironolactone",
    severity: "high",
    title: "Potassium can get too high",
    a: {
      label: "ACE inhibitor",
      aliases: ["ramipril", "lisinopril", "enalapril", "perindopril"],
    },
    b: {
      label: "Spironolactone",
      aliases: ["spironolactone"],
    },
    explanation:
      "Both medicines raise potassium. Together they can push potassium to a dangerous level, especially with kidney problems.",
    ask: [
      "Should my potassium and kidney function be checked more often?",
      "Which symptoms of high potassium should worry me?",
    ],
  },
  {
    id: "ssri-aspirin",
    severity: "moderate",
    title: "Bleeding risk with antidepressants",
    a: {
      label: "SSRI",
      aliases: ["sertraline", "fluoxetine", "escitalopram", "paroxetine"],
    },
    b: { label: "Aspirin", aliases: ["aspirin", "ecosprin", "acetylsalicylic"] },
    explanation:
      "SSRIs and aspirin can each affect bleeding. Together they modestly increase the chance of bruising or stomach bleeding.",
    ask: [
      "Should I add a stomach-protecting medicine?",
      "Which bleeding signs should I watch for?",
    ],
  },
];

function findMatches(side, medicines) {
  return medicines.filter((medicine) => {
    const name = (medicine.name ?? "").toLowerCase();
    return side.aliases.some((alias) => name.includes(alias));
  });
}

/**
 * @param {Array<{id,name,dose,doctor,date,source}>} medicines
 * @returns {Array} alerts, high severity first
 */
export function findInteractions(medicines = []) {
  const alerts = [];
  const seen = new Set();

  for (const rule of RULES) {
    const matchesA = findMatches(rule.a, medicines);
    const matchesB = findMatches(rule.b, medicines);

    for (const a of matchesA) {
      for (const b of matchesB) {
        if (a.id === b.id) continue;
        // One alert per medicine pair, even if several rules touch the pair.
        const key = [a.id, b.id].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        alerts.push({
          id: key,
          severity: rule.severity,
          title: rule.title,
          explanation: rule.explanation,
          ask: rule.ask,
          a,
          b,
          differentDoctors:
            Boolean(a.doctor) && Boolean(b.doctor) && a.doctor !== b.doctor,
        });
      }
    }
  }

  return alerts.sort((left, right) => {
    const weight = { high: 0, moderate: 1 };
    return (weight[left.severity] ?? 2) - (weight[right.severity] ?? 2);
  });
}
