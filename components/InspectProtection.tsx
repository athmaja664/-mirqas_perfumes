"use client";

import { useEffect } from "react";

/**
 * Console Silencer Component
 *
 * When NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION=true:
 * - Allows the Inspect Element / Developer Tools box to open normally.
 * - Suppresses all console output (error messages, success messages, logs, warnings)
 *   so the Console tab stays completely clean when opened by clients or visitors.
 * - Suppresses browser unhandled error & promise rejection banners in the console.
 * - Cleanly restores normal console logging when NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION=false.
 */
export default function InspectProtection() {
  useEffect(() => {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION === "true";
    if (!isEnabled) return;

    // Save references to original console functions for clean restoration
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;
    const originalTrace = console.trace;
    const originalTable = console.table;

    // No-op function to swallow all console messages
    const noop = () => {};

    // Override console output to keep the console tab clean
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop;
    console.trace = noop;
    if (typeof console.table === "function") {
      console.table = noop;
    }

    // Suppress unhandled runtime error prints in console
    const handleError = (e: ErrorEvent) => {
      // Prevent browser default logging of the error to the console
      e.preventDefault();
    };

    // Suppress unhandled promise rejection prints in console
    const handleRejection = (e: PromiseRejectionEvent) => {
      // Prevent browser default logging of the rejection to the console
      e.preventDefault();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Initial clear
    try {
      console.clear();
    } catch {}

    // Cleanup: restore original console methods and listeners when unmounted or disabled
    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
      console.debug = originalDebug;
      console.trace = originalTrace;
      if (typeof console.table === "function") {
        console.table = originalTable;
      }
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
