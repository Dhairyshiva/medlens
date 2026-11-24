/**
 * interactions.js
 * A small, transparent rule table. It flags known pairs of active medicines
 * so the patient can ask a better question — it does not diagnose or tell
 * anyone to stop a medicine.
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
    drugA: "Atorvastatin",
    drugB: "Clarithromycin",
    severity: "High",
    title: "Muscle damage risk",
    why: "Clarithromycin raises statin levels (CYP3A4) and the risk of muscle damage.",
    ask: "Are both medicines safe to take together for me?",
  },
  {
    drugA: "Warfarin",
    drugB: "Aspirin",
    severity: "High",
    title: "Bleeding risk",
    why: "Warfarin and aspirin both reduce clotting, so together they raise the risk of serious bleeding.",
    ask: "Do I need both of these together, or can one be stopped?",
  },
  {
    drugA: "Warfarin",
    drugB: "Diclofenac",
    severity: "High",
    title: "Bleeding risk with painkillers",
    why: "Diclofenac is an anti-inflammatory painkiller that makes bleeding more likely with warfarin and can irritate the stomach lining.",
    ask: "Are both medicines safe to take together for me?",
  },
  {
    drugA: "Levothyroxine",
    drugB: "Calcium",
    severity: "Moderate",
    title: "Thyroid medicine absorption",
    why: "Calcium binds levothyroxine in the gut, so less thyroid hormone is absorbed.",
    ask: "How many hours apart should I take calcium and levothyroxine?",
  },
  {
    drugA: "Clopidogrel",
    drugB: "Omeprazole",
    severity: "Moderate",
    title: "Clopidogrel effect",
    why: "Omeprazole can reduce how well clopidogrel works. A different acid reducer may be preferred.",
    ask: "Is there a different acid reducer that suits clopidogrel better?",
  },
  {
    drugA: "Ramipril",
    drugB: "Spironolactone",
    severity: "High",
    title: "Potassium can get too high",
    why: "Both medicines raise potassium. Together they can push potassium to a dangerous level, especially with kidney problems.",
    ask: "Should my potassium and kidney function be checked more often?",
  },
];

const normalise = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function matches(medicine, drugName) {
  const name = normalise(medicine.name);
  return Boolean(name) && name.includes(normalise(drugName));
}

function todayIso(asOf) {
  return asOf instanceof Date
    ? asOf.toISOString().slice(0, 10)
    : String(asOf).slice(0, 10);
}

/**
 * Active from its start date until its stop date (inclusive). A duration of
 * "Continue" or a missing stop date means the medicine is still active.
 */
export function isActiveMedicine(medicine, asOf = new Date()) {
  const today = todayIso(asOf);
  const start = medicine.start ?? medicine.date ?? null;
  if (start && start > today) return false;

  const stop = medicine.stop;
  if (stop == null || /^continue$/i.test(String(stop).trim())) return true;
  const stopDate = String(stop).slice(0, 10);
  return stopDate >= today;
}

/**
 * @param {Array<{id,name,dose,doctor,start,stop,date}>} medicines
 * @param {Date|string} asOf
 * @returns {Array} one alert per active medicine pair matched by a rule
 */
export function findInteractions(medicines = [], asOf = new Date()) {
  const active = medicines.filter((medicine) => isActiveMedicine(medicine, asOf));
  const alerts = [];

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const left = active[i];
      const right = active[j];

      for (const rule of RULES) {
        let a = null;
        let b = null;
        if (matches(left, rule.drugA) && matches(right, rule.drugB)) {
          a = left;
          b = right;
        } else if (matches(left, rule.drugB) && matches(right, rule.drugA)) {
          a = right;
          b = left;
        }
        if (!a || !b) continue;

        alerts.push({
          id: `${rule.drugA}-${rule.drugB}-${a.id}-${b.id}`,
          severity: rule.severity.toLowerCase(),
          title: rule.title,
          explanation: rule.why,
          ask: [rule.ask],
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
