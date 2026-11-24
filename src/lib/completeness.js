/**
 * completeness.js
 * Compare what a lab report measured with what its panel normally includes.
 */

import { expectedTests } from "./extract.js";

const shortName = (test) => (test === "LDL Cholesterol" ? "LDL" : test);

/**
 * @param {Array} reports normalised reports
 * @returns {Array<{report, expected, present, missing, message}>}
 */
export function analyseCompleteness(reports = []) {
  return reports
    .filter((report) => report.kind === "lab")
    .map((report) => {
      const expected = expectedTests(report.panels);
      const found = new Set((report.values ?? []).map((value) => value.test));
      const present = expected.filter((test) => found.has(test));
      const missing = expected.filter((test) => !found.has(test));

      return {
        report,
        expected,
        present,
        missing,
        message:
          missing.length > 0
            ? `${missing.map(shortName).join(", ")} missing: report may be incomplete or mis-scanned.`
            : null,
      };
    })
    .filter((entry) => entry.expected.length > 0)
    .sort((a, b) => (b.report.date ?? "").localeCompare(a.report.date ?? ""));
}
