"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setVisible(false) });

      // Zoom-out entrance: starts large and transparent, settles to normal size
      tl.from(logoRef.current, {
        scale: reduce ? 1 : 3,
        opacity: 0,
        duration: reduce ? 0.4 : 1.2,
        ease: "power4.out",
      });

      // Hold the logo, then fade the whole overlay away
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.7,
        ease: "power2.inOut",
        delay: 1.1, // 1.2s zoom + 1.1s hold ≈ 2.3s, plus 0.7s fade = 3s total
      });
    }, overlayRef);

    return () => ctx.revert();
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-label="Loading Mirqas Perfumes"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // stops the scaled logo causing scrollbars
        background: "#FCF8F0",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/images/logoo.png"
        alt="Mirqas Perfumes"
        style={{
          width: "min(60vw, 360px)", // scales down on phones, capped on desktop
          height: "auto",
          display: "block",
          mixBlendMode: "multiply",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}