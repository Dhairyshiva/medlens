import { SEVERITY } from "../lib/interactions.js";
import { formatDate } from "../lib/trends.js";

function DrugTile({ medicine, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {medicine.name}{" "}
          <span className="font-normal text-slate-500">{medicine.dose}</span>
        </p>
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${accent}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600">{medicine.doctor}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        Prescribed {formatDate(medicine.date, "medium")}
      </p>
    </div>
  );
}

function AlertCard({ alert }) {
  const theme = SEVERITY[alert.severity] ?? SEVERITY.moderate;

  return (
    <article className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-5 py-3 ${theme.bar}`}>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path d="M12 8.5v5M12 16.5h.01" strokeLinecap="round" />
            <path d="M12 3.8 21 20H3L12 3.8Z" strokeLinejoin="round" />
          </svg>
          {theme.label}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {alert.differentDoctors
            ? "Two different prescribers"
            : "Same prescriber"}
        </span>
      </div>

      <div className="p-5">
        <h3 className={`text-lg font-semibold tracking-tight ${theme.heading}`}>
          {alert.a.name} <span className="font-normal text-slate-400">+</span>{" "}
          {alert.b.name}
        </h3>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          {alert.title}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {alert.explanation}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DrugTile medicine={alert.a} accent="bg-teal-400" />
          <DrugTile medicine={alert.b} accent="bg-teal-400" />
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
            What to ask your doctor
          </p>
          <ul className="mt-2 space-y-1.5">
            {alert.ask.map((question) => (
              <li
                key={question}
                className="flex items-start gap-2 text-[13px] leading-snug text-amber-900/90"
              >
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default function InteractionAlerts({ alerts }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            No interaction patterns flagged in these medicines
          </p>
          <p className="mt-0.5 text-[13px] text-emerald-800/80">
            This checks a small, transparent rule set only. Always confirm with
            your doctor or pharmacist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
      <p className="text-[11px] leading-relaxed text-slate-400">
        These alerts name the medicines and prescribers found in your records.
        They are prompts for a conversation, not instructions to stop anything.
      </p>
    </div>
  );
}
