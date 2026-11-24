/**
 * trends.js
 * Pure, dependency-free trend analysis.
 *
 * For every test with at least three readings, fit a straight line through
 * (date, value), project when it crosses the upper reference limit, and report
 * the date it would reach the test's clinical target (where one is defined).
 * No backend, no storage.
 */

const DAY_MS = 86_400_000;
const MONTH_MS = DAY_MS * 30.4375;

/**
 * Curated tests get plain-language names and an optional clinical target
 * beyond the upper reference limit (e.g. HbA1c 6.5%). Reference ranges still
 * come from the report itself where present.
 */
export const TEST_META = {
  HbA1c: {
    unit: "%",
    range: [4.0, 5.7],
    target: 6.5,
    step: 0.2,
    aliases: [
      "hba1c",
      "a1c",
      "glycated hemoglobin",
      "glycosylated hemoglobin",
      "glycated haemoglobin",
    ],
  },
  "Fasting Glucose": {
    unit: "mg/dL",
    range: [70, 99],
    step: 6,
    aliases: [
      "fasting glucose",
      "fasting plasma glucose",
      "fasting blood sugar",
      "fasting sugar",
      "fbs",
      "glucose fasting",
    ],
  },
  "LDL Cholesterol": {
    unit: "mg/dL",
    range: [0, 100],
    step: 8,
    aliases: ["ldl cholesterol", "ldl-c", "ldl"],
  },
  "HDL Cholesterol": {
    unit: "mg/dL",
    range: [40, 100],
    step: 2,
    aliases: ["hdl cholesterol", "hdl-c", "hdl"],
  },
  eGFR: {
    unit: "mL/min/1.73m²",
    range: [90, 120],
    step: 3,
    aliases: ["egfr", "gfr", "estimated gfr"],
  },
  Hemoglobin: {
    unit: "g/dL",
    range: [12, 15],
    step: 0.2,
    aliases: ["hemoglobin", "haemoglobin", "hgb"],
  },
  "Vitamin D": {
    unit: "ng/mL",
    range: [30, 100],
    step: 2,
    aliases: ["vitamin d", "vit d", "25-oh vitamin d", "25 hydroxy vitamin d"],
  },
  Creatinine: {
    unit: "mg/dL",
    range: [0.6, 1.2],
    step: 0.05,
    aliases: ["creatinine", "serum creatinine"],
  },
};

/** Plain-language names used in the timeline and in chart captions. */
const PLAIN_NAMES = {
  HbA1c: "Average blood sugar (HbA1c)",
  "Fasting Glucose": "Fasting blood sugar",
  "LDL Cholesterol": "LDL (“bad”) cholesterol",
  "HDL Cholesterol": "HDL (“good”) cholesterol",
  eGFR: "Kidney filtration (eGFR)",
  Hemoglobin: "Hemoglobin",
  "Vitamin D": "Vitamin D",
  Creatinine: "Creatinine",
};

export const RISK_ORDER = { High: 0, Watch: 1, Low: 2 };

export function toDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

export function monthsBetween(fromIso, toIso) {
  return (toDate(toIso) - toDate(fromIso)) / MONTH_MS;
}

export function addMonths(iso, months) {
  const date = toDate(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Math.round(months));
  const daysInMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, daysInMonth));
  return date.toISOString().slice(0, 10);
}

/** Calendar date a fractional number of months after an ISO date. */
function dateFromMonths(iso, months) {
  return new Date(toDate(iso).getTime() + months * MONTH_MS)
    .toISOString()
    .slice(0, 10);
}

export function formatDate(iso, style = "medium") {
  if (!iso) return "—";
  const date = toDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const options =
    style === "short"
      ? { day: "numeric", month: "short", timeZone: "UTC" }
      : style === "year"
        ? { month: "short", year: "numeric", timeZone: "UTC" }
        : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return date.toLocaleDateString("en-GB", options);
}

export function formatNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(digits)));
}

function withUnit(value, unit) {
  const number = formatNumber(value);
  if (!unit) return number;
  return unit === "%" || unit.startsWith("°") ? `${number}${unit}` : `${number} ${unit}`;
}

export function valueStatus(value, low, high) {
  if (typeof value !== "number") return "unknown";
  if (typeof high === "number" && value > high) return "high";
  if (typeof low === "number" && value < low) return "low";
  return "in-range";
}

const round = (value, digits = 2) => Number(value.toFixed(digits));

/**
 * Build one series per test across every lab report, in date order.
 * Tests with three or more readings are projected; the rest are reported but
 * not charted.
 */
export function buildSeries(reports = []) {
  const byTest = new Map();

  for (const report of reports) {
    if (report.kind !== "lab") continue;
    for (const value of report.values ?? []) {
      if (typeof value.value !== "number" || !Number.isFinite(value.value)) continue;
      const entry = byTest.get(value.test) ?? { test: value.test, points: [] };
      entry.points.push({
        date: report.date,
        value: value.value,
        unit: value.unit ?? TEST_META[value.test]?.unit ?? "",
        low: value.low,
        high: value.high,
        source: report.source ?? "Uploaded report",
        reportTitle: report.title ?? "Lab report",
        reportId: report.id,
        doctor: report.doctor ?? null,
      });
      byTest.set(value.test, entry);
    }
  }

  return [...byTest.values()]
    .map((series) => {
      const points = [...series.points].sort((a, b) => a.date.localeCompare(b.date));
      const meta = TEST_META[series.test] ?? null;
      const latest = points[points.length - 1];
      const unit = latest.unit || meta?.unit || "";
      return analyseSeries({
        test: series.test,
        unit,
        low: latest.low ?? meta?.range?.[0] ?? null,
        high: latest.high ?? meta?.range?.[1] ?? null,
        meta,
        points,
      });
    })
    .sort((a, b) => a.test.localeCompare(b.test));
}

function analyseSeries(series) {
  const { points, unit, low, high, meta } = series;
  const latest = points[points.length - 1];
  const first = points[0];
  const spanMonths = monthsBetween(first.date, latest.date);
  const limit = typeof high === "number" ? high : null;
  const target = typeof meta?.target === "number" ? meta.target : null;

  let slopePerMonth = 0;
  if (points.length >= 2 && spanMonths > 0) {
    const xs = points.map((point) => monthsBetween(first.date, point.date));
    const ys = points.map((point) => point.value);
    const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
    const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < xs.length; i += 1) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += (xs[i] - meanX) ** 2;
    }
    slopePerMonth = denominator === 0 ? 0 : numerator / denominator;
  }

  // A projection needs three readings to describe a trend rather than a line
  // between two points.
  const enough = points.length >= 3 && limit != null && spanMonths > 0;
  let risk = "Low";
  let sentence = "";
  let monthsToLimit = null;
  let crossingDate = null;
  let targetDate = null;

  if (!enough) {
    const status = valueStatus(latest.value, low, high);
    risk = status === "high" ? "High" : status === "low" ? "Watch" : "Low";
    sentence =
      points.length < 3
        ? "At least three results are needed to project when this value might cross its upper limit."
        : "No upper reference limit is recorded for this test.";
  } else {
    monthsToLimit = estimateCrossing({
      latest: latest.value,
      threshold: limit,
      slopePerMonth,
    });

    if (latest.value >= limit) {
      risk = "High";
      sentence =
        slopePerMonth > 0.001
          ? `Already above the ${withUnit(limit, unit)} upper limit and still rising by about ${withUnit(Math.abs(slopePerMonth) * 12, unit)} a year.`
          : `Already above the ${withUnit(limit, unit)} upper limit, but holding roughly steady.`;
    } else if (monthsToLimit != null) {
      crossingDate = dateFromMonths(latest.date, monthsToLimit);
      const months = Math.max(1, Math.round(monthsToLimit));
      risk =
        monthsToLimit <= 3 ? "High" : monthsToLimit <= 12 ? "Watch" : "Low";
      sentence = `Likely to cross ${withUnit(limit, unit)} in about ${months} month${
        months === 1 ? "" : "s"
      } (around ${formatDate(crossingDate, "medium")}).`;
    } else {
      risk = "Low";
      sentence =
        slopePerMonth < -0.001
          ? `Trending away from the ${withUnit(limit, unit)} upper limit at this rate.`
          : `Holding steady below the ${withUnit(limit, unit)} upper limit.`;
    }

    if (target != null && latest.value < target) {
      const monthsToTarget = estimateCrossing({
        latest: latest.value,
        threshold: target,
        slopePerMonth,
      });
      if (monthsToTarget != null) {
        targetDate = dateFromMonths(latest.date, monthsToTarget);
        sentence += ` At this rate it reaches ${withUnit(target, unit)} around ${formatDate(targetDate, "medium")}.`;
      }
    }
  }

  const targetMonths = targetDate ? monthsBetween(latest.date, targetDate) : 0;
  const horizon = enough
    ? Math.min(
        18,
        Math.max(
          6,
          Math.round(Math.max(monthsToLimit ?? 0, targetMonths)) + 3,
        ),
      )
    : 0;

  const projectedPoints = enough
    ? Array.from({ length: 6 }, (_, index) => {
        const months = (horizon * (index + 1)) / 6;
        return {
          date: dateFromMonths(latest.date, months),
          projected: round(latest.value + slopePerMonth * months, 2),
        };
      })
    : [];

  const chartData = [
    ...points.map((point) => ({
      date: point.date,
      actual: point.value,
      projected: null,
    })),
    ...(enough
      ? [
          { date: latest.date, actual: null, projected: latest.value },
          ...projectedPoints.map((point) => ({
            date: point.date,
            actual: null,
            projected: point.projected,
          })),
        ]
      : []),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...series,
    latest,
    first,
    limit,
    target,
    slopePerMonth: round(slopePerMonth, 4),
    monthlyChange: round(slopePerMonth, 3),
    monthsToThreshold: monthsToLimit == null ? null : round(monthsToLimit, 1),
    crossingDate,
    targetDate,
    projected12Months: round(latest.value + slopePerMonth * 12, 2),
    risk,
    sentence,
    spanMonths: round(spanMonths, 1),
    isFlat: Math.abs(slopePerMonth) < (meta?.step ?? 0.2) / 18,
    chartData,
    chart: enough,
    plainName: PLAIN_NAMES[series.test] ?? series.test,
  };
}

/** Months until an upward trend reaches a threshold; null if it never does. */
function estimateCrossing({ latest, threshold, slopePerMonth }) {
  if (threshold == null || slopePerMonth <= 0) return null;
  if (latest >= threshold) return 0;
  return (threshold - latest) / slopePerMonth;
}

/**
 * One timeline entry per visit date, with changes written the way a friend
 * who happens to be a clinician might explain them.
 */
export function buildTimeline(reports = []) {
  const byDate = new Map();
  const previous = new Map();

  const ensureEntry = (date) => {
    if (!byDate.has(date)) {
      byDate.set(date, {
        date,
        sources: new Set(),
        items: [],
        medicines: [],
        isBaseline: false,
      });
    }
    return byDate.get(date);
  };

  const labs = reports
    .filter((report) => report.kind === "lab")
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const report of labs) {
    const entry = ensureEntry(report.date);
    entry.sources.add(report.source ?? "Lab report");

    for (const value of report.values ?? []) {
      const meta = TEST_META[value.test] ?? null;
      const last = previous.get(value.test);
      if (!last) {
        previous.set(value.test, value);
        continue;
      }
      const delta = value.value - last.value;
      const step = meta?.step ?? Math.max(0.1, Math.abs(last.value) * 0.02);
      if (Math.abs(delta) >= step) {
        entry.items.push(describeChange(value, last, meta));
        previous.set(value.test, value);
      }
    }
  }

  const prescriptions = reports.filter((report) => report.kind === "prescription");
  for (const report of prescriptions) {
    const entry = ensureEntry(report.date);
    entry.sources.add(report.source ?? "Prescription");
    for (const medicine of report.medicines ?? []) {
      entry.medicines.push(medicine);
      entry.items.push(
        `Started ${medicine.name}${medicine.dose ? ` ${medicine.dose}` : ""}${
          medicine.doctor ? ` — prescribed by ${medicine.doctor}` : ""
        }.`,
      );
    }
  }

  const entries = [...byDate.values()];
  const earliest = entries
    .map((entry) => entry.date)
    .sort((a, b) => a.localeCompare(b))[0];

  for (const entry of entries) {
    if (entry.date === earliest && entry.items.length === 0) {
      entry.isBaseline = true;
      entry.items.push(
        "Baseline visit — the first readings are recorded here, so future changes have a starting point.",
      );
    }
  }

  return entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => {
      const medicines = entry.medicines;
      return {
        date: entry.date,
        label: formatDate(entry.date, "medium"),
        sources: [...entry.sources],
        title: entry.isBaseline
          ? "Baseline visit"
          : medicines.length > 0
            ? "Visit & new prescription"
            : "Lab visit",
        items: entry.items,
        medicines,
        isBaseline: entry.isBaseline,
      };
    });
}

function describeChange(current, previous, meta) {
  const unit = current.unit || meta?.unit || "";
  const delta = current.value - previous.value;
  const direction = delta > 0 ? "rose" : "fell";
  const name = PLAIN_NAMES[current.test] ?? current.test;
  const threshold =
    typeof current.high === "number" ? current.high : meta?.range?.[1];
  let context;

  if (typeof threshold === "number") {
    const crossed = current.value >= threshold;
    const gap = Math.abs(threshold - current.value);
    if (crossed) {
      context = `that is above the ${withUnit(threshold, unit)} upper limit`;
    } else if (gap <= Math.abs(threshold) * 0.1) {
      context = `close to the ${withUnit(threshold, unit)} upper limit`;
    } else {
      context = `still below the ${withUnit(threshold, unit)} upper limit`;
    }
  } else if (
    typeof current.low === "number" &&
    typeof current.high === "number"
  ) {
    context =
      current.value < current.low || current.value > current.high
        ? "outside the usual reference range"
        : "inside the usual reference range";
  } else {
    context = "recorded on this visit";
  }

  return `${name} ${direction} from ${withUnit(previous.value, unit)} to ${withUnit(current.value, unit)} — ${context}.`;
}
