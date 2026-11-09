"use client";

import { useEffect } from "react";

/**
 * Console Silencer Component
 *
 * - Allows the Inspect Element / Developer Tools box to open normally (does not block inspect, right-click, or shortcuts).
 * - Completely silences and clears the Console tab so that no logs, errors, warnings,
 *   debug traces, or network banners appear when someone opens Inspect Element.
 */

// Immediate silence on module evaluation in browser
if (typeof window !== "undefined") {
  const isExplicitlyDisabled = process.env.NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION === "false";
  if (!isExplicitlyDisabled) {
    const noop = () => {};
    const methods: Array<keyof Console> = [
      "log",
      "info",
      "warn",
      "error",
      "debug",
      "trace",
      "table",
      "dir",
      "dirxml",
      "group",
      "groupCollapsed",
      "groupEnd",
      "time",
      "timeEnd",
      "timeLog",
      "assert",
      "count",
      "countReset",
    ];

    for (const m of methods) {
      try {
        if (typeof console[m] === "function") {
          // @ts-ignore
          console[m] = noop;
        }
      } catch {}
    }

    try {
      console.clear();
    } catch {}
  }
}

export default function InspectProtection() {
  useEffect(() => {
    const isExplicitlyDisabled = process.env.NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION === "false";
    if (isExplicitlyDisabled) return;

    const noop = () => {};
    const methods: Array<keyof Console> = [
      "log",
      "info",
      "warn",
      "error",
      "debug",
      "trace",
      "table",
      "dir",
      "dirxml",
      "group",
      "groupCollapsed",
      "groupEnd",
      "time",
      "timeEnd",
      "timeLog",
      "assert",
      "count",
      "countReset",
    ];

    // Store originals for clean cleanup
    const originals: Record<string, unknown> = {};
    for (const m of methods) {
      try {
        originals[m] = console[m];
        // @ts-ignore
        console[m] = noop;
      } catch {}
    }

    // Suppress unhandled runtime error prints in console
    const handleError = (e: ErrorEvent) => {
      e.preventDefault();
      try {
        console.clear();
      } catch {}
    };

    // Suppress unhandled promise rejection prints in console
    const handleRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      try {
        console.clear();
      } catch {}
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Initial clear
    try {
      console.clear();
    } catch {}

    // Continuous interval to ensure console tab stays wiped clean if devtools is opened
    const interval = setInterval(() => {
      try {
        console.clear();
      } catch {}
    }, 1000);

    // Also clear on window resize or focus (typical when opening inspect pane)
    const handleDevToolsOpen = () => {
      try {
        console.clear();
      } catch {}
    };

    window.addEventListener("resize", handleDevToolsOpen);
    window.addEventListener("focus", handleDevToolsOpen);

    return () => {
      clearInterval(interval);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("resize", handleDevToolsOpen);
      window.removeEventListener("focus", handleDevToolsOpen);

      for (const m of methods) {
        try {
          if (originals[m]) {
            // @ts-ignore
            console[m] = originals[m];
          }
        } catch {}
      }
    };
  }, []);

  return null;
}
