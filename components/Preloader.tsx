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
      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false);
        },
      });

      // Zoom-out entrance: starts large and transparent, settles to normal size
      tl.from(logoRef.current, {
        scale: reduce ? 1 : 2.8,
        opacity: 0,
        duration: reduce ? 0.4 : 1.2,
        ease: "power4.out",
      });

      // Hold the logo, then fade the whole overlay away (total ~3.5s)
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        delay: 1.5, // 1.2s entrance + 1.5s hold + 0.8s fade = 3.5 seconds total
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
        overflow: "hidden",
        background: "#FCF8F0",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/images/logoo.png"
        alt="Mirqas Perfumes"
        style={{
          width: "min(60vw, 360px)",
          height: "auto",
          display: "block",
          mixBlendMode: "multiply",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
