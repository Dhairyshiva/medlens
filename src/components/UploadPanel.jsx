import { useRef, useState } from "react";

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.md,.markdown,.json,application/pdf,image/*,text/plain,text/csv";

export default function UploadPanel({
  onFiles,
  onLoadDemo,
  busy,
  pending = [],
  errors = [],
  note,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer?.files?.length) onFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors sm:py-10 ${
          dragging
            ? "border-teal-500 bg-teal-50/70"
            : "border-slate-200 bg-slate-50/60 hover:border-teal-300 hover:bg-teal-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) onFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="pointer-events-none mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-teal-100 bg-white text-teal-600 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 15.5v2.2A2.3 2.3 0 0 0 6.3 20h11.4a2.3 2.3 0 0 0 2.3-2.3v-2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="pointer-events-none mt-3 text-base font-medium text-slate-800">
          Drop lab reports or prescriptions here
        </p>
        <p className="pointer-events-none mx-auto mt-1 max-w-md text-sm text-slate-500">
          Images, PDFs or text exports. Read inside this tab — never sent
          anywhere.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.2l1.4 1.8H18.5A1.5 1.5 0 0 1 20 9.3v8.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-10Z"
                strokeLinejoin="round"
              />
            </svg>
            {busy ? "Reading…" : "Browse files"}
          </button>
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-teal-300 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M12 3.5 4.5 7v5c0 4.2 3.1 7.3 7.5 8.5 4.4-1.2 7.5-4.3 7.5-8.5V7L12 3.5Z"
                strokeLinejoin="round"
              />
              <path
                d="M9.4 12.1l1.8 1.8 3.5-3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Load demo patient
          </button>
        </div>

        <p className="pointer-events-none mt-4 text-[11px] text-slate-400">
          JPG · PNG · PDF · TXT · CSV
        </p>
      </div>

      {note ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-[13px] text-teal-800">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{note}</span>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
            Waiting for OCR · {pending.length} file{pending.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {pending.map((file) => (
              <li key={file.name} className="text-[13px] text-amber-900/90">
                {file.name}{" "}
                <span className="text-amber-800/60">— {file.reason}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-amber-800/70">
            Text exports are parsed now. Drop an OCR hook into{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">extract.js</code>{" "}
            to read images and PDFs too.
          </p>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-800">
            Could not read {errors.length} file{errors.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {errors.map((file) => (
              <li key={file.name} className="text-[13px] text-rose-900/90">
                {file.name} <span className="text-rose-800/60">— {file.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
