import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import SectionHeading from "./components/SectionHeading.jsx";
import LabTable from "./components/LabTable.jsx";
import MedicineList from "./components/MedicineList.jsx";
import Completeness from "./components/Completeness.jsx";
import TrendCharts from "./components/TrendCharts.jsx";
import InteractionAlerts from "./components/InteractionAlerts.jsx";
import Timeline from "./components/Timeline.jsx";
import EmptyState from "./components/EmptyState.jsx";
import Footer from "./components/Footer.jsx";
import demoPatient from "../data/demo.json";
import {
  extractFromFiles,
  listLabValues,
  listMedicines,
} from "./lib/extract.js";
import { buildSeries, buildTimeline, RISK_ORDER } from "./lib/trends.js";
import { findInteractions } from "./lib/interactions.js";
import { downloadSummary } from "./lib/exportSummary.js";

const EMPTY_RECORDS = { patient: null, reports: [] };

export default function App() {
  const [records, setRecords] = useState(EMPTY_RECORDS);
  const [extraction, setExtraction] = useState({
    pending: [],
    errors: [],
    note: null,
  });
  const [busy, setBusy] = useState(false);

  const labRows = useMemo(() => listLabValues(records.reports), [records.reports]);
  const medicines = useMemo(
    () => listMedicines(records.reports),
    [records.reports],
  );
  const series = useMemo(() => buildSeries(records.reports), [records.reports]);
  const alerts = useMemo(() => findInteractions(medicines), [medicines]);
  const timeline = useMemo(
    () => buildTimeline(records.reports),
    [records.reports],
  );
  const charts = useMemo(
    () =>
      series
        .filter((entry) => entry.chart)
        .sort(
          (a, b) =>
            (RISK_ORDER[a.risk] ?? 3) - (RISK_ORDER[b.risk] ?? 3) ||
            a.test.localeCompare(b.test),
        ),
    [series],
  );

  const hasData = records.reports.length > 0;
  const reportCount = records.reports.length;

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setBusy(true);
    try {
      const result = await extractFromFiles(files);
      if (result.reports.length > 0) {
        setRecords((previous) => ({
          patient: previous.patient ?? {
            name: "Your records",
            id: "On this device",
          },
          reports: [
            ...previous.reports.filter(
              (existing) =>
                !result.reports.some((report) => report.id === existing.id),
            ),
            ...result.reports,
          ],
        }));
      }
      setExtraction({
        pending: result.pending,
        errors: result.errors,
        note:
          result.reports.length > 0
            ? `Parsed ${result.reports.length} report${result.reports.length === 1 ? "" : "s"} on-device.`
            : null,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLoadDemo = () => {
    setRecords({
      patient: demoPatient.patient,
      reports: demoPatient.reports,
    });
    setExtraction({
      pending: [],
      errors: [],
      note: "Demo patient loaded — 3 lab reports and 2 prescriptions across 5 visit dates.",
    });
  };

  const handleExport = () => {
    const fileName = downloadSummary({
      patient: records.patient,
      reports: records.reports,
      series: charts,
      labRows,
      medicines,
      alerts,
      timeline,
    });
    setExtraction((previous) => ({
      ...previous,
      note: `Printable summary downloaded — ${fileName}`,
    }));
  };

  const patientName = records.patient?.name ?? "Your records";
  const initials = patientName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-4 sm:px-8">
        <section className="pt-10 sm:pt-14">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
            Private by design
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.6rem] sm:leading-[1.08]">
            Scattered reports, one clear picture.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Load your lab reports and prescriptions to see extracted values,
            gaps in each report, trends over time, and the medicine questions
            worth raising. Everything is processed inside this tab.
          </p>
        </section>

        <div className="mt-7">
          <UploadPanel
            onFiles={handleFiles}
            onLoadDemo={handleLoadDemo}
            busy={busy}
            pending={extraction.pending}
            errors={extraction.errors}
            note={extraction.note}
          />
        </div>

        {!hasData ? <EmptyState /> : null}

        {hasData ? (
          <div className="rise">
            <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-teal-100 bg-teal-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {initials || "ML"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {patientName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {reportCount} report{reportCount === 1 ? "" : "s"} ·{" "}
                    {labRows.length} lab values · {medicines.length} medicines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4v11m0 0-4-4m4 4 4-4M5 19.5h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export summary for my doctor
              </button>
            </div>

            <section className="mt-14">
              <SectionHeading
                eyebrow="01 · Extraction"
                title="Everything in one place"
                description="Values pulled from every report, alongside the medicines that came with them. Out-of-range readings are marked against each report's own reference range."
              />
              <div className="space-y-4">
                <LabTable rows={labRows} />
                <MedicineList medicines={medicines} />
              </div>
            </section>

            <section className="mt-14">
              <SectionHeading
                eyebrow="02 · Completeness"
                title="Reports, checked against their panel"
                description="What a panel usually includes, compared with what this report actually measured. Amber rows are gaps you may want to fill at the next visit."
              />
              <Completeness reports={records.reports} />
            </section>

            <section className="mt-14">
              <SectionHeading
                eyebrow="03 · Trends"
                title="Where things are heading"
                description="Each chart uses the visits in these records. The dashed line continues the average change to date; the red line is a clinical threshold. These are projections, not predictions."
                action={
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {charts.length} tracked test{charts.length === 1 ? "" : "s"}
                  </span>
                }
              />
              <TrendCharts series={charts} />
            </section>

            <section className="mt-14">
              <SectionHeading
                eyebrow="04 · Interactions"
                title="Questions worth asking"
                description="A small, transparent check of the medicines in these records. Each alert names both drugs, both prescribers, and what to raise at your next appointment."
                action={
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {alerts.length} alert{alerts.length === 1 ? "" : "s"}
                  </span>
                }
              />
              <InteractionAlerts alerts={alerts} />
            </section>

            <section className="mt-14">
              <SectionHeading
                eyebrow="05 · Timeline"
                title="Your story, in plain language"
                description="Visits in order, with the changes that matter and what they mean — without the jargon."
              />
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
                <Timeline entries={timeline} />
              </div>
            </section>

            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-4">
              <p className="text-[13px] text-slate-500">
                Take these questions to your next appointment, not the internet.
              </p>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-teal-300 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4v11m0 0-4-4m4 4 4-4M5 19.5h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export summary for my doctor
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
