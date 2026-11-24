import { PANELS } from "../lib/extract.js";
import { analyseCompleteness } from "../lib/completeness.js";
import { formatDate } from "../lib/trends.js";

export default function Completeness({ reports }) {
  const entries = analyseCompleteness(reports);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
        Upload a lab report to see how complete it is against its panel.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map(({ report, expected, present, missing, message }) => (
        <article
          key={report.id}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {report.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(report.date, "medium")} · {report.source}
              </p>
            </div>
            {missing.length > 0 ? (
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                {missing.length} missing
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Complete
              </span>
            )}
          </div>

          <div className="flex-1 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {report.panels.length > 0 ? (
                report.panels.map((key) => (
                  <span
                    key={key}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500"
                  >
                    {PANELS[key]?.label ?? key}
                  </span>
                ))
              ) : (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Unclassified panel
                </span>
              )}
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              {present.length} of {expected.length} expected parameters
            </p>

            <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {expected.map((test) =>
                present.includes(test) ? (
                  <li
                    key={test}
                    className="flex items-center gap-2 text-[13px] text-slate-600"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {test}
                  </li>
                ) : (
                  <li
                    key={test}
                    className="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-2 py-1 text-[13px] font-medium text-amber-800"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5 shrink-0 text-amber-500"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 8.5v5M12 16.5h.01"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M12 3.8 21 20H3L12 3.8Z" strokeLinejoin="round" />
                      </svg>
                      <span className="truncate">{test}</span>
                    </span>
                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-600">
                      Missing
                    </span>
                  </li>
                ),
              )}
            </ul>

            {message ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-800">
                {message}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
