"use client";

import { useEffect, useRef } from "react";

export default function PageShell() {
  const haze = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = haze.current;
        if (!el) return;
        el.style.transform = `translate3d(${e.clientX - 160}px, ${e.clientY - 160}px, 0)`;
        el.style.opacity = "1";
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <div className="nxOrb1" />
      <div className="nxOrb2" />
      <div className="nxDotGrid" />
      <div className="nxCityFront" />
      <div className="nxCars" aria-hidden="true">
        <span className="nxCar nxCar1" />
        <span className="nxCar nxCar2" />
        <span className="nxCar nxCar3" />
      </div>
      <div className="nxCursorHaze" ref={haze} aria-hidden="true" />
    </>
  );
}
