import { formatDate, formatNumber } from "./trends.js";
import { SEVERITY } from "./interactions.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

function riskPill(risk) {
  const palette = {
    High: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    Watch: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
    Low: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" },
  }[risk] ?? { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.04em;background:${palette.bg};border:1px solid ${palette.border};color:${palette.text}">${esc(risk)}</span>`;
}

export function buildSummaryHtml({
  patient,
  reports = [],
  series = [],
  labRows = [],
  medicines = [],
  alerts = [],
  timeline = [],
  generatedAt = new Date(),
}) {
  const name = patient?.name || "Your records";
  const trends = series
    .slice()
    .sort(
      (a, b) =>
        ({ High: 0, Watch: 1, Low: 2 }[a.risk] ?? 3) -
          ({ High: 0, Watch: 1, Low: 2 }[b.risk] ?? 3) ||
        a.test.localeCompare(b.test),
    );

  const labSection =
    labRows.length > 0
      ? `<table>
          <thead>
            <tr><th>Test</th><th>Value</th><th>Unit</th><th>Reference</th><th>Date</th><th>Source</th></tr>
          </thead>
          <tbody>
            ${labRows
              .map(
                (row) => `<tr>
                  <td>${esc(row.test)}</td>
                  <td class="num${row.status === "high" || row.status === "low" ? " flag" : ""}">${esc(formatNumber(row.value))}${
                    row.status === "high" || row.status === "low"
                      ? ` <span class="tag">${esc(row.status)}</span>`
                      : ""
                  }</td>
                  <td>${esc(row.unit || "—")}</td>
                  <td class="num">${row.low != null && row.high != null ? `${esc(formatNumber(row.low))}–${esc(formatNumber(row.high))}` : "—"}</td>
                  <td class="nowrap">${esc(formatDate(row.date, "medium"))}</td>
                  <td>${esc(row.sourceReport)}<br /><span class="muted">${esc(row.source)}</span></td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : `<p class="muted">No lab values in these records.</p>`;

  const trendSection =
    trends.length > 0
      ? trends
          .map(
            (item) => `<tr>
              <td>${esc(item.test)}</td>
              <td class="num">${esc(formatNumber(item.latest.value))} ${esc(item.unit)}</td>
              <td>${riskPill(item.risk)}</td>
              <td>${esc(item.sentence)}</td>
            </tr>`,
          )
          .join("")
      : "";

  const medicineSection =
    medicines.length > 0
      ? `<table>
          <thead><tr><th>Medicine</th><th>Dose</th><th>Prescribed by</th><th>Date</th></tr></thead>
          <tbody>
            ${medicines
              .map(
                (medicine) => `<tr>
                  <td>${esc(medicine.name)}</td>
                  <td>${esc(medicine.dose || "—")}</td>
                  <td>${esc(medicine.doctor)}</td>
                  <td class="nowrap">${esc(formatDate(medicine.date, "medium"))}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : `<p class="muted">No medicines in these records.</p>`;

  const alertSection =
    alerts.length > 0
      ? alerts
          .map(
            (alert) => `<div class="alert ${alert.severity === "high" ? "high" : "moderate"}">
              <p class="alert-head">${esc(SEVERITY[alert.severity]?.label ?? "Flagged")} · ${esc(alert.title)}</p>
              <p><strong>${esc(alert.a.name)} ${esc(alert.a.dose || "")}</strong> (${esc(alert.a.doctor)}) and <strong>${esc(alert.b.name)} ${esc(alert.b.dose || "")}</strong> (${esc(alert.b.doctor)})</p>
              <p>${esc(alert.explanation)}</p>
              <p class="ask-label">What to ask your doctor</p>
              <ul>${alert.ask.map((question) => `<li>${esc(question)}</li>`).join("")}</ul>
            </div>`,
          )
          .join("")
      : `<p class="muted">No interaction patterns were flagged in these medicines.</p>`;

  const timelineSection =
    timeline.length > 0
      ? `<div class="timeline">${timeline
          .map(
            (entry) => `<div class="visit">
              <div class="visit-head">
                <span class="visit-date">${esc(entry.label)}</span>
                <span class="visit-title">${esc(entry.title)}</span>
                <span class="muted">${esc(entry.sources.join(" · "))}</span>
              </div>
              <ul>${entry.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            </div>`,
          )
          .join("")}</div>`
      : `<p class="muted">No visits in these records.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MedLens summary — ${esc(name)}</title>
  <style>
    :root { --teal: #0f766e; --ink: #0f172a; --muted: #64748b; --line: #e2e8f0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px 20px 56px; background: #f8fafc; color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13px; line-height: 1.5; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid var(--line);
      border-radius: 14px; padding: 34px 36px 30px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    header { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap;
      border-bottom: 2px solid var(--teal); padding-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .mark { width: 30px; height: 30px; border-radius: 8px; background: var(--teal); color: #fff;
      display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
    h1 { margin: 0; font-size: 21px; letter-spacing: -.02em; }
    .sub { margin: 2px 0 0; color: var(--muted); font-size: 11px; }
    .patient { text-align: right; }
    .patient .name { font-weight: 600; font-size: 14px; }
    .patient .meta { color: var(--muted); font-size: 11px; }
    h2 { margin: 26px 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .12em;
      color: var(--teal); }
    h2:first-of-type { margin-top: 22px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
      color: var(--muted); border-bottom: 1px solid var(--line); padding: 6px 8px; }
    td { border-bottom: 1px solid #f1f5f9; padding: 7px 8px; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .flag { color: #b45309; font-weight: 600; }
    .tag { font-size: 8px; text-transform: uppercase; letter-spacing: .08em; padding: 1px 4px;
      border-radius: 4px; background: #fffbeb; border: 1px solid #fde68a; color: #b45309; }
    .nowrap { white-space: nowrap; }
    .muted { color: var(--muted); }
    .alert { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
    .alert.high { border-color: #fecaca; background: #fef7f7; }
    .alert.moderate { border-color: #fde68a; background: #fffdf5; }
    .alert-head { margin: 0 0 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .1em; color: #b91c1c; }
    .alert.moderate .alert-head { color: #b45309; }
    .alert p { margin: 3px 0; }
    .ask-label { margin-top: 8px !important; font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .1em; color: #92400e; }
    .alert ul { margin: 4px 0 0; padding-left: 18px; }
    .timeline { border-left: 2px solid var(--line); margin-left: 5px; padding-left: 16px; }
    .visit { margin-bottom: 14px; }
    .visit-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    .visit-date { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--teal); }
    .visit-title { font-weight: 600; }
    .visit ul { margin: 4px 0 0; padding-left: 16px; }
    footer { margin-top: 28px; border-top: 1px solid var(--line); padding-top: 12px;
      color: var(--muted); font-size: 10px; }
    footer strong { color: var(--ink); }
    .note { margin-top: 10px; color: var(--muted); font-size: 10px; }
    .print-bar { max-width: 900px; margin: 0 auto 14px; display: flex; justify-content: flex-end; }
    .print-bar button { font: inherit; font-size: 12px; font-weight: 600; color: #fff; background: var(--teal);
      border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; font-size: 11px; }
      .page { border: 0; border-radius: 0; padding: 0; max-width: none; box-shadow: none; }
      .print-bar { display: none; }
      .alert, .visit { break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      h2 { break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-bar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <main class="page">
    <header>
      <div class="brand">
        <span class="mark">M</span>
        <div>
          <h1>MedLens health summary</h1>
          <p class="sub">Prepared for a conversation with your clinician · ${esc(formatDate(generatedAt.toISOString().slice(0, 10), "medium"))}</p>
        </div>
      </div>
      <div class="patient">
        <div class="name">${esc(name)}</div>
        <div class="meta">${patient?.age ? `${esc(patient.age)} yrs` : ""}${patient?.sex ? ` · ${esc(patient.sex)}` : ""}${patient?.id ? ` · ${esc(patient.id)}` : ""}</div>
        <div class="meta">${reports.length} report${reports.length === 1 ? "" : "s"} · ${labRows.length} lab values · ${medicines.length} medicines</div>
      </div>
    </header>

    <h2>Trends at a glance</h2>
    ${
      trends.length > 0
        ? `<table><thead><tr><th>Test</th><th>Latest</th><th>Risk</th><th>Plain-language read</th></tr></thead><tbody>${trendSection}</tbody></table>`
        : `<p class="muted">Not enough repeat tests to draw trends yet.</p>`
    }

    <h2>Lab values</h2>
    ${labSection}

    <h2>Medicines</h2>
    ${medicineSection}

    <h2>Medicine interaction alerts</h2>
    ${alertSection}

    <h2>Visit timeline</h2>
    ${timelineSection}

    <footer>
      <strong>MedLens does not diagnose. It helps you ask better questions.</strong>
      <p class="note">This summary was generated locally in the browser from the reports loaded into MedLens. Trends are simple straight-line projections from past readings, not predictions, and reference ranges come from the source reports. Nothing here replaces a clinician's assessment.</p>
    </footer>
  </main>
</body>
</html>`;
}

/** Build the printable page and download it. Returns the file name. */
export function downloadSummary(data) {
  const html = buildSummaryHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = `MedLens-summary-${new Date().toISOString().slice(0, 10)}.html`;

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  return fileName;
}
