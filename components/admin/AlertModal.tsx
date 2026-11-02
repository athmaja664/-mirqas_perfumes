"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type AlertModalProps = {
  open: boolean;
  title?: string;
  message: string;
  type?: "info" | "error" | "success";
  onClose: () => void;
};

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export default function AlertModal({
  open,
  title,
  message,
  type = "info",
  onClose,
}: AlertModalProps) {
  const okBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    okBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !message) return null;

  const defaultTitle =
    type === "error" ? "Notice" : type === "success" ? "Success" : "Information";

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title || defaultTitle}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-black/10 bg-[#FCF8F0] p-6 shadow-2xl transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <h3
            className="m-0 text-2xl font-medium"
            style={{
              fontFamily: serif,
              color: type === "error" ? "#A32A1F" : type === "success" ? "#1F7A3A" : COPPER,
            }}
          >
            {title || defaultTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center text-black/50 hover:text-black"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-0 mt-3 whitespace-pre-line text-[14px] leading-relaxed text-black/75">
          {message}
        </p>

        <div className="mt-6 flex justify-end">
          <button
            ref={okBtnRef}
            type="button"
            onClick={onClose}
            className="cursor-pointer px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:opacity-90"
            style={{
              background: type === "error" ? "#A32A1F" : type === "success" ? "#1F7A3A" : COPPER,
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
