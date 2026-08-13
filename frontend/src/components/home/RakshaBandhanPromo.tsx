import Link from 'next/link';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { RakhiMotif, MandalaRing, FlowerMotif } from '@/components/ui/RakshaBandhanMotifs';

// Sits above the main Hero Banner — a compact, festive strip whose only job
// is to funnel customers to /combo during the Raksha Bandhan window. Reuses
// the .rb-hero design language (and its motifs/keyframes) already shipped
// for the /combo page, so the two feel like one campaign without a second
// design system to maintain.
export function RakshaBandhanPromo() {
  return (
    <section className="rb-hero relative px-6 py-12 sm:py-14 md:py-16 text-center">
      <div className="rb-hero-pattern" />
      <div className="rb-hero-vignette" />

      <div className="rb-float-el" style={{ top: '10%', left: '5%', animationDelay: '0s' }}>
        <RakhiMotif size={40} className="hidden sm:block" />
      </div>
      <div className="rb-float-el rb-float-b" style={{ top: '14%', right: '6%', animationDelay: '.5s' }}>
        <RakhiMotif size={52} />
      </div>
      <div className="rb-float-el" style={{ bottom: '10%', left: '9%', animationDelay: '1s' }}>
        <FlowerMotif size={28} className="hidden sm:block" />
      </div>
      <div className="rb-float-el rb-float-b" style={{ bottom: '8%', right: '11%', animationDelay: '.2s' }}>
        <MandalaRing size={34} className="hidden sm:block" />
      </div>
      <div className="rb-sparkle-el" style={{ top: '25%', left: '20%', fontSize: 12, animationDelay: '0s' }}>✦</div>
      <div className="rb-sparkle-el" style={{ top: '60%', right: '22%', fontSize: 14, animationDelay: '.7s' }}>✦</div>

      <div className="relative z-10 max-w-xl mx-auto">
        <RevealOnScroll>
          <p className="eyebrow" style={{ color: '#FFE8B0' }}>🪢 Raksha Bandhan · 2026</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1}>
          <h2 className="rb-hero-title serif text-2xl sm:text-3xl md:text-4xl mt-3 mb-3 leading-[1.15]">
            Create a Special <em>Raksha Bandhan</em> Combo
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.2}>
          <p className="text-xs sm:text-sm opacity-85 max-w-sm mx-auto mb-7 font-handwriting" style={{ fontSize: '1.15rem' }}>
            Choose your favourite products and create a special gift for your loved ones.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.3}>
          <Link href="/combo" className="btn-luxury btn-gold-solid">
            <span>Create Your Combo →</span>
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
