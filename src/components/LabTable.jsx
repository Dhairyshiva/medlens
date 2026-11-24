import { formatDate, formatNumber } from "../lib/trends.js";

export default function LabTable({ rows }) {
  const testCount = new Set(rows.map((row) => row.test)).size;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Lab values</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {rows.length} readings · {testCount} tests across all reports
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Extracted on-device
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <th scope="col" className="px-5 py-2.5 font-semibold">Test</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Value</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Unit</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Reference range</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Date</th>
              <th scope="col" className="px-5 py-2.5 font-semibold">Source report</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const flagged = row.status === "high" || row.status === "low";
              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-2.5 font-medium text-slate-800">{row.test}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-slate-900">
                      {formatNumber(row.value)}
                      {flagged ? (
                        <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                          {row.status}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{row.unit || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-slate-500">
                    {row.low != null && row.high != null
                      ? `${formatNumber(row.low)} – ${formatNumber(row.high)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                    {formatDate(row.date, "short")}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="block text-[13px] text-slate-700">{row.sourceReport}</span>
                    <span className="block text-[11px] text-slate-400">{row.source}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
