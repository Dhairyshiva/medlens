export default function Timeline({ entries }) {
  return (
    <ol className="relative ml-2 space-y-7 border-l border-slate-200 pl-6">
      {entries.map((entry) => (
        <li key={entry.date} className="relative">
          <span
            className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ring-4 ${
              entry.isBaseline
                ? "bg-slate-400 ring-slate-100"
                : entry.medicines.length > 0
                  ? "bg-teal-500 ring-teal-50"
                  : "bg-teal-600 ring-teal-50"
            }`}
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <time
              dateTime={entry.date}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700"
            >
              {entry.label}
            </time>
            <span className="text-sm font-semibold text-slate-900">
              {entry.title}
            </span>
            <span className="text-[11px] text-slate-400">
              {entry.sources.join(" · ")}
            </span>
          </div>

          <ul className="mt-2 space-y-1.5">
            {entry.items.map((item, index) => (
              <li
                key={`${entry.date}-${index}`}
                className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600"
              >
                <span
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
