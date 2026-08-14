import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // The Header's nav links (7 items) + dead-centered logo need more
      // room than any stock breakpoint gives before they start crowding
      // each other — measured the real collision point rather than
      // guessing, see the comment above Header's nav-link classes.
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

export default config;
