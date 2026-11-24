import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RiskBadge from "./RiskBadge.jsx";
import { formatDate, formatNumber } from "../lib/trends.js";

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((item) => item.value != null);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-700">{formatDate(label, "medium")}</p>
      {rows.map((item) => (
        <p
          key={item.dataKey}
          className="mt-0.5 tabular-nums"
          style={{ color: item.color }}
        >
          {item.dataKey === "projected" ? "Projected" : "Actual"}:{" "}
          {formatNumber(item.value)} {unit}
        </p>
      ))}
    </div>
  );
}

function LegendChip({ dashed, label, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
      <span
        className={`inline-block h-0.5 w-4 rounded-full ${dashed ? "border-t-2 border-dashed" : ""}`}
        style={
          dashed
            ? { borderColor: color }
            : { backgroundColor: color }
        }
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function TrendCard({ series }) {
  const { points, latest, threshold, unit, low, high } = series;
  const values = points
    .map((point) => point.value)
    .concat(
      series.chartData
        .filter((point) => point.projected != null)
        .map((point) => point.projected),
    )
    .concat(typeof threshold === "number" ? [threshold] : [])
    .concat(typeof series.target === "number" ? [series.target] : []);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.2, Math.abs(max) * 0.05, 1);
  const domain = [
    Number((min - padding).toFixed(2)),
    Number((max + padding).toFixed(2)),
  ];

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {series.test}
          </h3>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Latest · {formatDate(latest.date, "medium")}
          </p>
        </div>
        <RiskBadge risk={series.risk} />
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
          {formatNumber(latest.value)}
        </span>
        <span className="pb-1 text-sm text-slate-500">{unit}</span>
        <span className="ml-auto pb-1 text-[11px] tabular-nums text-slate-400">
          Ref {formatNumber(low)}–{formatNumber(high)}
        </span>
      </div>

      <div className="mt-3 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series.chartData}
            margin={{ top: 8, right: 10, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value, "year")}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip
              content={<ChartTooltip unit={unit} />}
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
            />
            {typeof threshold === "number" ? (
              <ReferenceLine
                y={threshold}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.4}
                label={{
                  value: `Threshold ${formatNumber(threshold)}`,
                  position: "insideTopRight",
                  fill: "#dc2626",
                  fontSize: 9,
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#0d9488"
              strokeWidth={2.4}
              dot={{ r: 2.6, fill: "#0d9488", strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#5eead4"
              strokeWidth={2}
              strokeDasharray="6 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <LegendChip label="Actual" color="#0d9488" />
        <LegendChip label="Projected" dashed color="#5eead4" />
        <LegendChip label="Threshold" dashed color="#dc2626" />
      </div>

      <p className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-[13px] leading-snug text-slate-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 11v5.2M12 8h.01" strokeLinecap="round" />
        </svg>
        <span>{series.sentence}</span>
      </p>
    </article>
  );
}

export default function TrendCharts({ series }) {
  if (series.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
        At least two visits with the same test are needed to draw a trend.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {series.map((entry) => (
        <TrendCard key={entry.test} series={entry} />
      ))}
    </div>
  );
}
