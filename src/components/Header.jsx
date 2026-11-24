export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/25">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.2" />
              <path d="M15.2 15.2 20 20" strokeLinecap="round" />
              <path d="M10.5 7.6v5.8M7.6 10.5h5.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                MedLens
              </h1>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700 sm:inline">
                Private health record
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-[13px]">
              Your health records, connected. Your data, never uploaded.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Processing on-device
        </span>
      </div>
    </header>
  );
}
