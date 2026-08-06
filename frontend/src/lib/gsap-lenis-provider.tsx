'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenisSingleton: Lenis | null = null;

export function getLenis() {
  return lenisSingleton;
}

// Mounted once in the root layout — ports the static site's Lenis + GSAP
// ticker + custom-cursor wiring. Persists across client-side navigations
// (the layout doesn't unmount), and re-measures ScrollTrigger positions
// whenever the route changes so newly-mounted page content is accounted for.
export function GsapLenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenisSingleton = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisSingleton = null;
    };
  }, []);

  useEffect(() => {
    // Custom cursor (desktop only) — matches the static site's behavior.
    const dot = cursorRef.current;
    if (!dot || !window.matchMedia('(min-width:769px)').matches) return;

    const move = (e: MouseEvent) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
    };
    const grow = () => {
      dot.style.width = '28px';
      dot.style.height = '28px';
      dot.style.opacity = '.5';
    };
    const shrink = () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.opacity = '1';
    };

    window.addEventListener('mousemove', move);
    const interactive = document.querySelectorAll('a,button');
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => {
      window.removeEventListener('mousemove', move);
      interactive.forEach((el) => {
        el.removeEventListener('mouseenter', grow);
        el.removeEventListener('mouseleave', shrink);
      });
    };
  }, [pathname]);

  useEffect(() => {
    // Route changed — new page content is mounted, recalc trigger offsets.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <div ref={cursorRef} className="cursor-dot" />
      {children}
    </>
  );
}
