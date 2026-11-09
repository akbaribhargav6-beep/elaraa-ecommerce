// Decorative countdown for the luxury-deal section (ports
// useDecorativeCountdown from FeaturedLuxuryDeal.tsx). It loops on a fixed
// clock to convey urgency and does not gate or expire any real offer.

export const START_SECONDS = 8 * 3600 + 42 * 60 + 19;

export function countdownParts(remaining) {
  const r = Math.max(0, Math.floor(remaining));
  const pad = (n) => String(n).padStart(2, '0');
  return { hours: pad(Math.floor(r / 3600)), mins: pad(Math.floor((r % 3600) / 60)), secs: pad(r % 60) };
}

export function nextRemaining(prev) {
  return prev <= 0 ? START_SECONDS : prev - 1;
}

export function initCountdowns(root = document) {
  root.querySelectorAll('[data-countdown]').forEach((el) => {
    if (el.dataset.countdownBound === '1') return;
    el.dataset.countdownBound = '1';
    const hours = el.querySelector('[data-countdown-hours]');
    const mins = el.querySelector('[data-countdown-mins]');
    const secs = el.querySelector('[data-countdown-secs]');
    let remaining = START_SECONDS;
    const timer = setInterval(() => {
      // The theme editor can remove the section; stop ticking when it is gone.
      if (!document.body.contains(el)) return clearInterval(timer);
      remaining = nextRemaining(remaining);
      const p = countdownParts(remaining);
      if (hours) hours.textContent = p.hours;
      if (mins) mins.textContent = p.mins;
      if (secs) secs.textContent = p.secs;
    }, 1000);
  });
}
