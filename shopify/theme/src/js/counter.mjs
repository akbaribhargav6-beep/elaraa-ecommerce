// Count-up figures on the About page (ports components/ui/AnimatedCounter.tsx):
// each [data-counter] runs once, when half of it has scrolled into view.

export const COUNTER_DURATION_MS = 1600;
export const COUNTER_STEP_MS = 30;

export function counterSteps() {
  return Math.ceil(COUNTER_DURATION_MS / COUNTER_STEP_MS);
}

/** Whole-number value shown at tick `step` of `steps`; lands exactly on the target. */
export function counterValueAt(target, step, steps) {
  if (step >= steps) return target;
  return Math.floor((target / steps) * step);
}

export function formatCount(value, suffix = '') {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}${suffix}`;
}

function run(el) {
  const target = Number(el.dataset.target);
  if (!Number.isFinite(target)) return;
  const suffix = el.dataset.suffix || '';
  const steps = counterSteps();
  let step = 0;
  el.textContent = formatCount(0, suffix);
  const timer = setInterval(() => {
    step += 1;
    el.textContent = formatCount(counterValueAt(target, step, steps), suffix);
    if (step >= steps || !document.body.contains(el)) clearInterval(timer);
  }, COUNTER_STEP_MS);
}

export function initCounters(scope = document) {
  const counters = [...scope.querySelectorAll('[data-counter]')].filter((el) => el.dataset.counterBound !== '1');
  if (counters.length === 0) return;
  counters.forEach((el) => (el.dataset.counterBound = '1'));
  if (!('IntersectionObserver' in window)) return; // leave the server-rendered final values
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        run(entry.target);
      }
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => io.observe(el));
}
