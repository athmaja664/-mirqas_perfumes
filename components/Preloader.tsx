"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function Preloader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Never show the full-screen splash preloader in the admin dashboard
    if (pathname?.startsWith("/admin")) {
      return;
    }

    // Only show the intro splash once per browser session
    try {
      if (sessionStorage.getItem("mirqas_splash_shown")) {
        return;
      }
      sessionStorage.setItem("mirqas_splash_shown", "1");
    } catch {
      // Ignore if sessionStorage is disabled
    }

    setVisible(true);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setVisible(false) });

      // Snappy, elegant entrance
      tl.from(logoRef.current, {
        scale: reduce ? 1 : 2.2,
        opacity: 0,
        duration: reduce ? 0.3 : 0.65,
        ease: "power3.out",
      });

      // Quick hold and smooth fade away
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: "power2.inOut",
        delay: 0.35,
      });
    }, overlayRef);

    return () => ctx.revert();
  }, [pathname]);

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
          width: "min(50vw, 320px)",
          height: "auto",
          display: "block",
          mixBlendMode: "multiply",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
