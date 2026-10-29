"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select one or more",
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close when clicking outside or pressing Escape
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <div ref={ref} className="relative">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#111111]/60">
        {label}
      </span>

      {/* the box (rounded corners) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-[50px] w-full items-center justify-between gap-3 rounded-[10px] border border-[#9C5A2B]/40 bg-white px-3 py-2 text-left text-[15px] outline-none focus-visible:border-[#9C5A2B]"
      >
        <span className="flex flex-wrap gap-1.5">
          {value.length === 0 ? (
            <span className="text-[#111111]/45">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="rounded-[6px] bg-[#F3E7D5] px-2 py-0.5 text-[12px] text-[#9C5A2B]"
              >
                {labelOf(v)}
              </span>
            ))
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          className={`shrink-0 fill-none stroke-current transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* the list */}
      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-[10px] border border-[#9C5A2B]/40 bg-white py-1 shadow-[0_10px_30px_rgba(36,36,36,0.15)]"
        >
          {options.map((o) => {
            const checked = value.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={checked}>
                <button
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] hover:bg-[#F3E7D5]"
                >
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                      checked ? "border-[#9C5A2B] bg-[#9C5A2B]" : "border-[#9C5A2B]/50"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 24 24" width="12" height="12" className="fill-none stroke-white" strokeWidth="3">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    )}
                  </span>
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}