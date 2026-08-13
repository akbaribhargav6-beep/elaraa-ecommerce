import Link from 'next/link';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { RakhiLottie } from '@/components/ui/RakhiLottie';

const PETALS = [
  { left: '8%', duration: 9, delay: 0, size: 10 },
  { left: '22%', duration: 11, delay: 2.4, size: 8 },
  { left: '78%', duration: 10, delay: 1.1, size: 9 },
  { left: '90%', duration: 12, delay: 3.6, size: 7 },
];

const STATS = ['🎁 Pick any 3+ favourites', '✨ One special combo price', '💛 A gift they will remember'];

// A deliberately different centerpiece from the /combo page's own maroon
// .rb-hero — a blush/ivory editorial split with an illustrated gift box +
// rakhi thread, so the homepage doesn't read as a smaller repeat of the
// combo page it's promoting.
export function RakshaBandhanPromo() {
  return (
    <section className="rb2-section px-6 py-10 sm:py-16 md:py-24">
      <div className="rb2-rangoli-bg" />
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="rb2-petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.4,
            borderRadius: '50% 50% 50% 0',
            background: i % 2 === 0 ? '#E8B4BC' : '#FFE8B0',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-4 sm:gap-10 md:gap-16">
        <RevealOnScroll className="flex justify-center order-1">
          <RakhiLottie className="w-56 sm:w-96 md:w-full max-w-md" />
        </RevealOnScroll>

        <div className="order-2 text-center md:text-left">
          <RevealOnScroll>
            <span className="rb2-badge">🪢 Raksha Bandhan · 2026</span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <h2 className="rb2-heading serif text-2xl sm:text-4xl md:text-5xl mt-3 sm:mt-5 mb-3 sm:mb-4 leading-[1.15]">
              Celebrate the Bond with a <em>Handpicked Combo</em>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-xs sm:text-base opacity-70 max-w-md mx-auto md:mx-0 mb-5 sm:mb-7 leading-relaxed">
              Choose your favourite products and create a special gift for your loved ones, priced as one
              beautiful combo, not the sum of its parts.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.3}>
            <Link href="/combo" className="rb2-cta">
              <span className="relative z-10">Build Your Combo →</span>
            </Link>
          </RevealOnScroll>
          <RevealOnScroll delay={0.4} className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-2.5 mt-5 sm:mt-7">
            {STATS.map((s) => (
              <span key={s} className="rb2-chip">{s}</span>
            ))}
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
