// Ported verbatim from frontend/tailwind.config.ts so the compiled utility
// classes match the Next.js storefront one-for-one. Tailwind scans the Liquid
// files (and the JS that injects class names) at build time; the output is
// committed as assets/tailwind.css — nothing runs in the browser.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './blocks/**/*.liquid',
    './templates/**/*.{json,liquid}',
    './src/js/**/*.mjs',
  ],
  theme: {
    extend: {
      // The header's nav links + dead-centred logo need more room than any
      // stock breakpoint before they collide (measured on the live site).
      screens: {
        'header-desktop': '1600px',
      },
      colors: {
        ivory: '#F8F5F0',
        cream: '#EFE9DE',
        gold: '#C9A66B',
        'gold-deep': '#A8823D',
        charcoal: '#2B2620',
        black: '#17140F',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-jost)', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% center' },
          '50%': { backgroundPosition: '100% center' },
          '100%': { backgroundPosition: '0% center' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 4s ease-in-out infinite',
        marquee: 'marquee 34s linear infinite',
      },
    },
  },
  plugins: [],
};
