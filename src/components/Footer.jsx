export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50/70">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-600 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.2" />
                <path d="M15.2 15.2 20 20" strokeLinecap="round" />
                <path d="M10.5 7.6v5.8M7.6 10.5h5.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-800">
              MedLens
            </span>
          </div>

          <p className="text-sm font-medium text-slate-700">
            MedLens does not diagnose. It helps you ask better questions.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            All processing happens in your browser. Records are not stored,
            transmitted or synced.
          </p>
          <p className="text-slate-400">
            Projections are simple straight-line estimates. Review them with
            your clinician.
          </p>
        </div>
      </div>
    </footer>
  );
}
