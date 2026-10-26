"use client";

import { useEffect, useRef, useState } from "react";

// Returns a ref to attach to a section, and `hidden`:
// true until the section scrolls into view (then it stays false).
// Content stays visible if JS or IntersectionObserver is unavailable,
// and with "reduce motion" turned on.
export function useReveal<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setShown(true);
      return;
    }

    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, hidden: armed && !shown };
}

export const REVEAL_CSS = `
  .rv {
    transition: opacity 800ms cubic-bezier(0.22, 0.61, 0.36, 1),
                transform 800ms cubic-bezier(0.22, 0.61, 0.36, 1);
    transition-delay: var(--d, 0ms);
  }
  .rv.rv-hide { opacity: 0; transform: translateY(var(--y, 20px)); }
  .rv-img {
    transition: opacity 1200ms ease,
                transform 1800ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .rv-img.rv-hide { opacity: 0; transform: scale(1.04); }
  @media (prefers-reduced-motion: reduce) {
    .rv, .rv-img { transition: none !important; }
    .rv.rv-hide, .rv-img.rv-hide { opacity: 1; transform: none; }
  }
`;