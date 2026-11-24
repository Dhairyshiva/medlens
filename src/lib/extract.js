/**
 * extract.js
 * Turns report documents into MedLens' normalised shape.
 *
 * Today it reads text that is already selectable (.txt, .csv, .md, .json).
 * Image/PDF OCR is deliberately isolated behind the `ocr.recognize(file)`
 * hook so Tesseract.js can be dropped in without touching the UI or trends:
 *
 *   import { createWorker } from "tesseract.js";
 *   const worker = await createWorker("eng");
 *   const ocr = { recognize: async (file) => (await worker.recognize(file)).data.text };
 *   extractFromFiles(files, { ocr });
 */

import { TEST_META, valueStatus } from "./trends.js";

export const PANELS = {
  metabolic: {
    label: "Metabolic",
    tests: ["Fasting Glucose", "HbA1c", "Creatinine", "Sodium", "Potassium"],
  },
  lipid: {
    label: "Lipid profile",
    tests: ["Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides"],
  },
  renal: {
    label: "Kidney function",
    tests: ["eGFR", "Creatinine", "Urea", "Potassium"],
  },
  cbc: {
    label: "Complete blood count",
    tests: ["Hemoglobin", "WBC", "Platelets", "RBC"],
  },
  thyroid: {
    label: "Thyroid",
    tests: ["TSH", "Free T4", "T3"],
  },
  vitamin: {
    label: "Vitamins",
    tests: ["Vitamin D", "Vitamin B12"],
  },
  liver: {
    label: "Liver function",
    tests: ["ALT", "AST", "Bilirubin", "Albumin"],
  },
};

export const EXTRA_TESTS = {
  "Total Cholesterol": { unit: "mg/dL", aliases: ["total cholesterol", "cholesterol total", "cholesterol"] },
  Triglycerides: { unit: "mg/dL", aliases: ["triglycerides", "triglyceride", "tg"] },
  Sodium: { unit: "mmol/L", aliases: ["sodium", "na+"] },
  Potassium: { unit: "mmol/L", aliases: ["potassium", "k+"] },
  WBC: { unit: "10³/µL", aliases: ["wbc", "white blood cells", "white cell count", "leucocyte count", "leukocyte count"] },
  Platelets: { unit: "10³/µL", aliases: ["platelets", "platelet count"] },
  RBC: { unit: "10⁶/µL", aliases: ["rbc", "red blood cells", "red cell count"] },
  Urea: { unit: "mg/dL", aliases: ["urea", "blood urea", "bun"] },
  TSH: { unit: "mIU/L", aliases: ["tsh", "thyroid stimulating hormone"] },
  "Free T4": { unit: "ng/dL", aliases: ["free t4", "ft4"] },
  T3: { unit: "ng/dL", aliases: ["t3", "triiodothyronine"] },
  "Vitamin B12": { unit: "pg/mL", aliases: ["vitamin b12", "b12", "cobalamin"] },
  ALT: { unit: "U/L", aliases: ["alt", "sgpt"] },
  AST: { unit: "U/L", aliases: ["ast", "sgot"] },
  Bilirubin: { unit: "mg/dL", aliases: ["bilirubin", "total bilirubin"] },
  Albumin: { unit: "g/dL", aliases: ["albumin"] },
};

const ALL_ALIASES = [
  ...Object.entries(TEST_META).map(([name, meta]) => ({
    name,
    aliases: [name, ...(meta.aliases ?? [])],
  })),
  ...Object.entries(EXTRA_TESTS).map(([name, meta]) => ({
    name,
    aliases: [name, ...(meta.aliases ?? [])],
  })),
].sort((a, b) => b.aliases.length - a.aliases.length);

const TEXTUAL_FILE = /\.(txt|csv|md|markdown|json)$/i;

/** Expected tests for a set of panels, de-duplicated and in a stable order. */
export function expectedTests(panelKeys = []) {
  const seen = new Set();
  for (const key of panelKeys) {
    for (const test of PANELS[key]?.tests ?? []) seen.add(test);
  }
  return [...seen];
}

export function canonicalTest(rawName = "") {
  const cleaned = rawName
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9%+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  let best = null;
  let bestLength = 0;
  for (const entry of ALL_ALIASES) {
    for (const alias of entry.aliases) {
      const needle = alias.toLowerCase();
      const hit =
        needle.length <= 3
          ? cleaned === needle
          : cleaned === needle ||
            cleaned.startsWith(`${needle} `) ||
            cleaned.endsWith(` ${needle}`) ||
            cleaned.includes(` ${needle} `);
      if (hit && needle.length > bestLength) {
        best = entry.name;
        bestLength = needle.length;
      }
    }
  }
  return best;
}

const MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const DATE_LABEL =
  /^(?:report(?:ed)?\s*(?:date)?|collection\s*date|collected(?:\s*on)?|sample\s*(?:date|collected)|visit\s*date|date)\s*[:\-–]\s*(.+)$/i;

const SOURCE_LABEL =
  /^(?:source|lab(?:oratory)?(?:\s*name)?|centre|center|diagnostics|hospital|clinic|facility)\s*[:\-–]\s*(.+)$/i;

const LAB_NAME_HINT =
  /\b(diagnostics?|laborator(?:y|ies)|labs?|hospital|clinic|medical\s+cent(?:er|re)|pathology|healthcare)\b/i;

const NOT_A_SOURCE =
  /^(?:report|patient|date|ref(?:erence)?|test|result|sample|doctor|dr\.?|phone|address|email|page|lab(?:oratory)?\s+report)\b/i;

const PLACEHOLDER = /^(?:[-–—./]+|n\/?a|none|unknown|null)$/i;

function meaningful(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed && !PLACEHOLDER.test(trimmed) ? trimmed : null;
}

function parseDateToken(value = "") {
  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  const dmy = value.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const named = value.match(
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*(20\d{2})\b/i,
  );
  if (named) {
    const [, day, month, year] = named;
    return `${year}-${MONTHS[month.toLowerCase()]}-${day.padStart(2, "0")}`;
  }

  return null;
}

/**
 * Read the date and lab name printed in the document.
 * Labelled lines win, then a standalone lab-name line, then any date in the
 * text. File metadata is applied by the caller only when these are empty.
 */
function readDocumentMeta(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let date = null;
  let source = null;

  for (const line of lines) {
    if (!date) {
      const match = line.match(DATE_LABEL);
      if (match) date = parseDateToken(match[1]);
    }
    if (!source) {
      const match = line.match(SOURCE_LABEL);
      if (match) source = meaningful(match[1]);
    }
    if (date && source) break;
  }

  if (!date) date = parseDateToken(text);

  if (!source) {
    const bare = lines.find(
      (line) =>
        line.length <= 80 &&
        !NOT_A_SOURCE.test(line) &&
        LAB_NAME_HINT.test(line),
    );
    source = bare ? bare.replace(/[,\s]+$/, "") : null;
  }

  return { date, source };
}

function cleanFilename(name = "report") {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanUnit(raw = "") {
  const match = raw.match(/^[A-Za-z%µμ\/^.\d·]+/);
  return match ? match[0].replace(/[.\-]+$/, "") : "";
}

function parseLabLine(line) {
  const range = line.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i);
  if (!range) return null;

  const beforeRange = line.slice(0, range.index);
  const numbers = [...beforeRange.matchAll(/-?\d+(?:\.\d+)?/g)];
  if (numbers.length === 0) return null;

  const lastNumber = numbers[numbers.length - 1];
  const rawName = beforeRange
    .slice(0, lastNumber.index)
    .replace(/^[\s•*·\-–]+/, "")
    .replace(/[:\-–=\s]+$/, "")
    .trim();
  if (!rawName || rawName.length > 60 || !/[a-z]/i.test(rawName)) return null;
  if (/date|patient|report|visit|page|phone|age|ref(erence)?\s*$/i.test(rawName)) return null;

  const rawValue = Number(lastNumber[0]);
  if (!Number.isFinite(rawValue)) return null;
  const unit = cleanUnit(beforeRange.slice(lastNumber.index + lastNumber[0].length).trim());
  const low = Number(range[1]);
  const high = Number(range[2]);

  const canonical = canonicalTest(rawName);
  const fallbackUnit = canonical ? TEST_META[canonical]?.unit ?? EXTRA_TESTS[canonical]?.unit : "";
  const prettyName = canonical
    ? canonical
    : rawName
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

  return {
    test: prettyName,
    value: rawValue,
    unit: unit || fallbackUnit || "",
    low: Number.isFinite(low) ? low : null,
    high: Number.isFinite(high) ? high : null,
  };
}

function parseMedicineLine(line) {
  const match = line.match(
    /^(?:tab\.?|cap\.?|tablet|capsule|syp\.?|syr\.?|inj\.?|rx)?\s*([A-Za-z][A-Za-z0-9 +\-]{2,40}?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|units?)\b(.*)$/i,
  );
  if (!match) return null;
  const [, rawName, amount, unit, rest] = match;
  const name = rawName.replace(/^(?:tab|cap|syp|inj)\s+/i, "").trim();
  if (!name || /^(report|patient|date|lab)$/i.test(name)) return null;
  const doctorMatch = rest.match(/Dr\.?\s*([A-Za-z.]+(?:\s+[A-Za-z.]+){0,2})/);
  const doctor = doctorMatch
    ? `Dr. ${doctorMatch[1].trim().replace(/[.,]$/, "")}`
    : null;
  return {
    name: name.replace(/\b\w/g, (character) => character.toUpperCase()),
    dose: `${amount} ${unit.toLowerCase()}`,
    doctor,
  };
}

function detectPanels(tests) {
  return Object.entries(PANELS)
    .filter(([, panel]) => panel.tests.filter((test) => tests.includes(test)).length >= 2)
    .map(([key]) => key);
}

function hash(text) {
  let hashValue = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hashValue = (hashValue * 33) ^ text.charCodeAt(i);
  }
  return (hashValue >>> 0).toString(36);
}

/**
 * Parse a block of report text into a normalised report.
 * Exported so uploaded text and (later) OCR output share exactly one parser.
 */
export function parseReport(
  text,
  { fileName = "report.txt", fallbackDate = null } = {},
) {
  if (!text || typeof text !== "string" || text.trim().length === 0) return null;

  const lines = text.split(/\r?\n/);
  const values = [];
  const medicines = [];
  let title = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!title) {
      const titleMatch = line.match(/^report\s*[:\-–]\s*(.+)$/i);
      const candidate = titleMatch?.[1].trim() ?? "";
      if (candidate && !/^(?:date|id|no|number)\b/i.test(candidate)) {
        title = candidate;
      }
    }

    // Lab lines are tried first: "LDL cholesterol 142 mg/dL 0-100" would
    // otherwise look like a medicine called "LDL Cholesterol 142 mg".
    const value = parseLabLine(line);
    if (value) {
      values.push(value);
      continue;
    }

    const medicine = parseMedicineLine(line);
    if (medicine) medicines.push(medicine);
  }

  if (values.length === 0 && medicines.length === 0) return null;

  // Document content always wins; file metadata is only a fallback.
  const documentMeta = readDocumentMeta(text);
  const reportDate = documentMeta.date || fallbackDate || null;
  const reportSource = documentMeta.source || cleanFilename(fileName);
  const panels = detectPanels(values.map((value) => value.test));
  const kind = medicines.length > 0 && values.length === 0 ? "prescription" : "lab";

  return {
    id: `upload-${hash(text)}`,
    kind,
    title:
      title ||
      (kind === "prescription" ? "Uploaded prescription" : "Uploaded lab report"),
    date: reportDate,
    source: reportSource,
    doctor: medicines.find((medicine) => medicine.doctor)?.doctor ?? null,
    panels,
    values,
    medicines,
    fileName,
  };
}

/**
 * Extract reports from File objects entirely in the browser.
 * `ocr` is optional: { recognize(file) -> Promise<string> }.
 */
export async function extractFromFiles(files = [], { ocr } = {}) {
  const reports = [];
  const pending = [];
  const errors = [];

  for (const file of files) {
    try {
      let text;
      if (TEXTUAL_FILE.test(file.name) || /^text\/|^application\/json/.test(file.type)) {
        text = await file.text();
      } else if (ocr?.recognize) {
        text = await ocr.recognize(file);
      } else {
        pending.push({
          name: file.name,
          size: file.size,
          reason:
            "Image and PDF text extraction is waiting for the Tesseract.js OCR hook.",
        });
        continue;
      }

      const fallbackDate = file.lastModified
        ? new Date(file.lastModified).toISOString().slice(0, 10)
        : null;
      const report = parseReport(text, {
        fileName: file.name,
        fallbackDate,
      });
      if (report) {
        reports.push(report);
      } else {
        errors.push({
          name: file.name,
          message: "No lab values or medicines could be read from this file.",
        });
      }
    } catch (error) {
      errors.push({ name: file.name, message: error?.message ?? "Could not read this file." });
    }
  }

  return { reports, pending, errors };
}

/** Flat table rows for extraction results, newest first. */
export function listLabValues(reports = []) {
  const rows = [];
  for (const report of reports) {
    if (report.kind !== "lab") continue;
    for (const value of report.values ?? []) {
      rows.push({
        id: `${report.id}-${value.test}`,
        test: value.test,
        value: value.value,
        unit: value.unit,
        low: value.low,
        high: value.high,
        date: report.date,
        source: report.source,
        sourceReport: report.title,
        doctor: report.doctor ?? null,
        status: valueStatus(value.value, value.low, value.high),
      });
    }
  }
  return rows.sort(
    (a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.test.localeCompare(b.test),
  );
}

/** Flat medicine list, newest first. */
export function listMedicines(reports = []) {
  const rows = [];
  for (const report of reports) {
    for (const medicine of report.medicines ?? []) {
      rows.push({
        id: `${report.id}-${medicine.name}`,
        name: medicine.name,
        dose: medicine.dose ?? "",
        doctor: medicine.doctor ?? report.doctor ?? "Not recorded",
        date: report.date,
        source: report.source,
        reportTitle: report.title,
      });
    }
  }
  return rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
