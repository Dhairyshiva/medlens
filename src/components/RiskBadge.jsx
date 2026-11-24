const STYLES = {
  High: "border-red-200 bg-red-50 text-red-700",
  Watch: "border-amber-200 bg-amber-50 text-amber-800",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const DOTS = {
  High: "bg-red-500",
  Watch: "bg-amber-500",
  Low: "bg-emerald-500",
};

export default function RiskBadge({ risk }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        STYLES[risk] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOTS[risk] ?? "bg-slate-400"}`}
        aria-hidden="true"
      />
      {risk ?? "Unknown"}
    </span>
  );
}
