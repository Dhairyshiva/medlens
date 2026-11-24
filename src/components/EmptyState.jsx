export default function EmptyState() {
  const items = [
    {
      title: "One clean extraction",
      body: "Lab values and medicines are pulled out of each report and lined up in one table — test, value, unit, range, date and source.",
      icon: (
        <path
          d="M8 4.5h6l3.5 3.5v8.5A1.5 1.5 0 0 1 16 18H8a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 8 4.5Zm5.8 0V8h3.6M9.5 12h5M9.5 15h3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      title: "Gaps made visible",
      body: "Each report is checked against what its panel usually includes. Missing parameters are highlighted so you can ask for them next time.",
      icon: (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <path d="m8.4 12.2 2.4 2.4 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ),
    },
    {
      title: "Trends, not snapshots",
      body: "See where a value is heading over visits, with a projection, a threshold line and a plain sentence about what it might mean.",
      icon: (
        <path
          d="M4 17.5 9 12l3.2 2.6L20 6.5M16 6.5h4v4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          What you get once records are loaded
        </h2>
        <span className="text-[11px] text-slate-400">
          Demo data is fictional and illustrative
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-4.5 w-4.5"
                style={{ width: 18, height: 18 }}
                aria-hidden="true"
              >
                {item.icon}
              </svg>
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-[13px] text-slate-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4 text-teal-600"
          aria-hidden="true"
        >
          <rect x="4.5" y="10" width="15" height="9.5" rx="2" />
          <path d="M8 10V7.8a4 4 0 0 1 8 0V10" strokeLinecap="round" />
        </svg>
        Nothing leaves this browser tab — no account, no server, no uploads.
      </p>
    </section>
  );
}
