"use client";

import { useEffect } from "react";

/**
 * Reversible Inspect Protection Component
 * 
 * Activated when NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION=true in .env / .env.local.
 * - Prevents right-click context menu (Inspect Element).
 * - Intercepts common developer shortcut keys (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U).
 * - Suppresses casual console.log output in production while preserving console.error and console.warn.
 * - Cleanly restores all default browser behaviour when NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION=false.
 */
export default function InspectProtection() {
  useEffect(() => {
    // Only activate when explicitly enabled via environment variable
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_INSPECT_PROTECTION === "true";
    if (!isEnabled) return;

    // 1. Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable common inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect macOS vs Windows/Linux
      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const isShiftOrAlt = isMac ? (e.altKey || e.shiftKey) : e.shiftKey;
      const key = e.key ? e.key.toUpperCase() : "";

      // F12 key (Windows/Linux/Mac)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + Shift + I (Inspect) / Cmd + Option + I
      // Ctrl + Shift + J (Console) / Cmd + Option + J
      // Ctrl + Shift + C (Element Selector) / Cmd + Option + C
      // Ctrl + Shift + K (Firefox Console) / Cmd + Option + K
      if (isCtrlOrCmd && isShiftOrAlt && ["I", "J", "C", "K"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U / Cmd + U (View Source)
      if (isCtrlOrCmd && key === "U") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Attach listeners with capture = true to intercept before default handlers
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("keydown", handleKeyDown, true);

    // 3. Hygiene: Suppress verbose console.log / info / debug in production
    // (Preserve console.error and console.warn so real application issues are never hidden)
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};

    // Cleanup: cleanly restore normal browser behavior when component unmounts
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      console.log = originalLog;
      console.info = originalInfo;
      console.debug = originalDebug;
    };
  }, []);

  return null;
}
