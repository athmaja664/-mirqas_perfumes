"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  message: string;
  label: string;
  title?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  disabled?: boolean;
};

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export default function ConfirmDeleteButton({
  message,
  label,
  title = "Delete for good?",
  confirmLabel = "Delete",
  onConfirm,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function confirm() {
    setOpen(false);
    if (onConfirm) onConfirm();
    else triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center bg-transparent p-0 align-middle leading-none text-[#A32A1F] transition-colors hover:text-[#7a1f16] disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md border border-black/10 bg-[#FCF8F0] p-6 shadow-xl"
            >
              <h2
                className="m-0 text-2xl font-medium lining-nums"
                style={{ fontFamily: serif, color: "#9C5A2B" }}
              >
                {title}
              </h2>
              <p className="mb-0 mt-3 whitespace-pre-line text-[14px] leading-relaxed text-black/70">
                {message}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="border border-black/25 bg-transparent px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-black/70 transition-colors hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="bg-[#A32A1F] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7a1f16]"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}