'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  as?: 'div' | 'span';
  id?: string;
}

// Ports the static site's `.reveal` fade-up-on-scroll utility as a proper
// React component — each instance owns its own ScrollTrigger, so it works
// correctly across client-side route changes (unlike a one-time DOM scan).
export function RevealOnScroll({ children, className, style, delay = 0, as = 'div', id }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 32 });
    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay]);

  const Tag = as;
  return (
    <Tag ref={ref} id={id} className={className} style={style}>
      {children}
    </Tag>
  );
}
