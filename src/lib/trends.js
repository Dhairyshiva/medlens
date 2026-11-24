/**
 * trends.js
 * Pure, dependency-free trend analysis.
 *
 * Input: reports shaped like { id, kind: "lab", date: "YYYY-MM-DD", values: [...] }
 * Output: plain objects the UI can render directly — no backend, no storage.
 */

const DAY_MS = 86_400_000;
const MONTH_MS = DAY_MS * 30.4375;

/**
 * Curated tests get a clinical threshold and plain-language names.
 * A threshold is the line shown in red on the chart; reference ranges still
 * come from the report itself so unusual labs are not silently "corrected".
 */
export const TEST_META = {
  HbA1c: {
    unit: "%",
    range: [4.0, 5.6],
    threshold: 6.5,
    direction: "above",
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
    threshold: 100,
    direction: "above",
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
    threshold: 160,
    direction: "above",
    step: 8,
    aliases: ["ldl cholesterol", "ldl-c", "ldl"],
  },
  "HDL Cholesterol": {
    unit: "mg/dL",
    range: [40, 100],
    threshold: 40,
    direction: "below",
    step: 2,
    aliases: ["hdl cholesterol", "hdl-c", "hdl"],
  },
  eGFR: {
    unit: "mL/min/1.73m²",
    range: [90, 120],
    threshold: 60,
    direction: "below",
    step: 3,
    aliases: ["egfr", "gfr", "estimated gfr"],
  },
  Hemoglobin: {
    unit: "g/dL",
    range: [12, 15],
    threshold: 12,
    direction: "below",
    step: 0.2,
    aliases: ["hemoglobin", "haemoglobin", "hgb"],
  },
  "Vitamin D": {
    unit: "ng/mL",
    range: [30, 100],
    threshold: 30,
    direction: "below",
    step: 2,
    aliases: ["vitamin d", "vit d", "25-oh vitamin d", "25 hydroxy vitamin d"],
  },
  Creatinine: {
    unit: "mg/dL",
    range: [0.6, 1.2],
    threshold: 1.3,
    direction: "above",
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
 * Each series is analysed immediately so the UI never has to re-do math.
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
      const low = meta?.range?.[0] ?? latest.low;
      const high = meta?.range?.[1] ?? latest.high;
      const threshold =
        typeof meta?.threshold === "number"
          ? meta.threshold
          : typeof high === "number"
            ? high
            : typeof low === "number"
              ? low
              : null;
      const direction =
        meta?.direction ?? (typeof high === "number" ? "above" : "below");

      return analyseSeries({
        test: series.test,
        unit,
        low,
        high,
        threshold,
        direction,
        meta,
        points,
      });
    })
    .sort((a, b) => a.test.localeCompare(b.test));
}

function analyseSeries(series) {
  const { points, threshold, direction, unit, meta } = series;
  const latest = points[points.length - 1];
  const first = points[0];
  const spanMonths = monthsBetween(first.date, latest.date);

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

  const flatEpsilon = (meta?.step ?? 0.2) / 18;
  const isFlat = Math.abs(slopePerMonth) < flatEpsilon;
  const monthsToThreshold = estimateCrossing({
    latest: latest.value,
    threshold,
    direction,
    slopePerMonth,
  });

  const nearThreshold =
    threshold != null &&
    Math.abs(threshold - latest.value) <= Math.max(Math.abs(threshold) * 0.05, 0.01);

  let risk = "Low";
  let sentence = "";

  if (threshold == null) {
    const outside = valueStatus(latest.value, series.low, series.high) !== "in-range";
    risk = outside ? "Watch" : "Low";
    sentence = outside
      ? "Outside the reference range on the latest report."
      : "No threshold set for this test — tracking only.";
  } else if (direction === "above") {
    const crossed = latest.value >= threshold;
    if (crossed) {
      risk = "High";
      sentence =
        slopePerMonth > 0.001
          ? `Already above the ${withUnit(threshold, unit)} threshold and still rising by about ${withUnit(Math.abs(slopePerMonth) * 12, unit)} a year.`
          : `Already above the ${withUnit(threshold, unit)} threshold, but holding roughly steady.`;
    } else if (!isFlat && slopePerMonth > 0 && monthsToThreshold != null) {
      const months = Math.max(1, Math.round(monthsToThreshold));
      risk = months <= 18 || nearThreshold ? "Watch" : "Low";
      sentence =
        risk === "Watch"
          ? `Likely to cross ${withUnit(threshold, unit)} in ~${months} months at this rate.`
          : `On pace to cross ${withUnit(threshold, unit)} in ~${months} months, further out than two years.`;
    } else {
      risk = nearThreshold ? "Watch" : "Low";
      sentence = nearThreshold
        ? `Sitting just under the ${withUnit(threshold, unit)} threshold — worth rechecking.`
        : "No threshold crossing expected in the next two years at this rate.";
    }
  } else {
    const crossed = latest.value <= threshold;
    const improving = slopePerMonth > 0.001;
    if (crossed) {
      if (improving) {
        const months = estimateCrossing({
          latest: latest.value,
          threshold,
          direction: "above",
          slopePerMonth,
        });
        const close = Math.abs(threshold - latest.value) <= Math.abs(threshold) * 0.15;
        risk = close ? "Watch" : "High";
        sentence =
          months != null
            ? `Within ${withUnit(Math.abs(threshold - latest.value), unit)} of the ${withUnit(threshold, unit)} target — about ${Math.max(1, Math.round(months))} months away at this rate.`
            : `Below the ${withUnit(threshold, unit)} target, but improving.`;
      } else {
        risk = "High";
        sentence =
          slopePerMonth < -0.001
            ? `Below the ${withUnit(threshold, unit)} threshold and still falling.`
            : `Below the ${withUnit(threshold, unit)} threshold and holding there.`;
      }
    } else if (!isFlat && slopePerMonth < 0 && monthsToThreshold != null) {
      const months = Math.max(1, Math.round(monthsToThreshold));
      risk = months <= 18 || nearThreshold ? "Watch" : "Low";
      sentence =
        risk === "Watch"
          ? `Likely to fall below ${withUnit(threshold, unit)} in ~${months} months at this rate.`
          : `On pace to dip below ${withUnit(threshold, unit)} in ~${months} months, further out than two years.`;
    } else {
      risk = nearThreshold ? "Watch" : "Low";
      sentence = nearThreshold
        ? `Sitting just above the ${withUnit(threshold, unit)} threshold — worth rechecking.`
        : "No threshold crossing expected in the next two years at this rate.";
    }
  }

  if (isFlat && threshold != null && risk === "Low") {
    sentence = "Holding steady — the change so far is too small to call a trend.";
  }

  const horizon = Math.min(
    18,
    Math.max(6, monthsToThreshold != null ? Math.round(monthsToThreshold) + 3 : 12),
  );

  const projectedPoints = Array.from({ length: 6 }, (_, index) => {
    const months = (horizon * (index + 1)) / 6;
    return {
      date: addMonths(latest.date, months),
      projected: round(latest.value + slopePerMonth * months, 2),
    };
  });

  const chartData = [
    ...points.map((point) => ({
      date: point.date,
      actual: point.value,
      projected: null,
    })),
    { date: latest.date, actual: null, projected: latest.value },
    ...projectedPoints.map((point) => ({
      date: point.date,
      actual: null,
      projected: point.projected,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...series,
    latest,
    first,
    slopePerMonth: round(slopePerMonth, 4),
    monthlyChange: round(slopePerMonth, 3),
    monthsToThreshold:
      monthsToThreshold == null ? null : round(monthsToThreshold, 1),
    projected12Months: round(latest.value + slopePerMonth * 12, 2),
    risk,
    sentence,
    spanMonths: round(spanMonths, 1),
    isFlat,
    chartData,
    chart:
      points.length >= 2 && (Boolean(meta) || points.length >= 3),
    plainName: PLAIN_NAMES[series.test] ?? series.test,
  };
}

function estimateCrossing({ latest, threshold, direction, slopePerMonth }) {
  if (threshold == null) return null;
  if (direction === "above" && slopePerMonth > 0) {
    if (latest >= threshold) return 0;
    return (threshold - latest) / slopePerMonth;
  }
  if (direction === "below" && slopePerMonth < 0) {
    if (latest <= threshold) return 0;
    return (latest - threshold) / Math.abs(slopePerMonth);
  }
  if (direction === "below" && slopePerMonth > 0 && latest < threshold) {
    return (threshold - latest) / slopePerMonth;
  }
  if (direction === "above" && slopePerMonth < 0 && latest > threshold) {
    return (latest - threshold) / Math.abs(slopePerMonth);
  }
  return null;
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
  const threshold = meta?.threshold;
  let context;

  if (typeof threshold === "number") {
    const above = meta.direction === "above";
    const crossed = above ? current.value >= threshold : current.value <= threshold;
    const gap = Math.abs(threshold - current.value);
    if (crossed) {
      context = `that is ${above ? "above" : "below"} the ${withUnit(threshold, unit)} mark`;
    } else if (gap <= Math.abs(threshold) * 0.1) {
      context = `close to the ${withUnit(threshold, unit)} mark`;
    } else {
      context = `still on the safer side of the ${withUnit(threshold, unit)} mark`;
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
