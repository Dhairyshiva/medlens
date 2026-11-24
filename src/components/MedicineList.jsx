import { formatDate } from "../lib/trends.js";

export default function MedicineList({ medicines }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Medicines</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {medicines.length} active prescription{medicines.length === 1 ? "" : "s"} across
            these records
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {new Set(medicines.map((medicine) => medicine.doctor)).size} prescribers
        </span>
      </div>

      {medicines.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">
          No prescriptions were found in these records.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {medicines.map((medicine) => (
            <li
              key={medicine.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect
                    x="3.8"
                    y="8.6"
                    width="16.4"
                    height="6.8"
                    rx="3.4"
                    transform="rotate(-35 12 12)"
                  />
                  <path d="M9.4 7.6l7 8.8" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {medicine.name}{" "}
                  <span className="font-normal text-slate-500">{medicine.dose}</span>
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {medicine.doctor} · {medicine.source}
                </p>
              </div>
              <span className="text-xs tabular-nums text-slate-400">
                {formatDate(medicine.date, "medium")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
