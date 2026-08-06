'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({ target, suffix = '+' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [value, setValue] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;
        const duration = 1600;
        const stepTime = 30;
        const steps = duration / stepTime;
        const increment = target / steps;
        let count = 0;
        const timer = setInterval(() => {
          count += increment;
          if (count >= target) {
            setValue(target);
            clearInterval(timer);
          } else {
            setValue(Math.floor(count));
          }
        }, stepTime);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <p ref={ref} className="serif text-4xl sm:text-6xl font-light" style={{ color: 'var(--gold)' }}>
      {value.toLocaleString('en-IN')}
      {suffix}
    </p>
  );
}
