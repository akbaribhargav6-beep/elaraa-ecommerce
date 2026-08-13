import { Button } from '@/components/ui/Button';

// Replace these two files to change the hero banner — no markup changes
// needed as long as the new images keep the same aspect ratios.
const DESKTOP_HERO_SRC = '/assets/images/hero/hero-desktop.webp'; // 1920x900
const MOBILE_HERO_SRC = '/assets/images/hero/hero-mobile.png'; // 1080x1350 (4:5)

// A single <picture> element drives both breakpoints. The browser's native
// media-based source selection runs before any JS executes, so exactly one
// of the two images is ever requested on page load — never both — while
// each breakpoint still gets its own dedicated, non-cropped banner and copy.
export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#1A1714]">
      <picture>
        {/* Desktop Hero Banner — fetched only on screens >= 1024px */}
        <source media="(min-width: 1024px)" srcSet={DESKTOP_HERO_SRC} />
        {/* Mobile Hero Banner — the default source, used below 1024px */}
        <img
          src={MOBILE_HERO_SRC}
          alt="ELARAA premium fashion jewellery, anti tarnish and designed for everyday wear"
          width={1080}
          height={1350}
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
          className="block w-full aspect-[4/5] lg:aspect-[1920/900] min-h-[500px] lg:min-h-[600px] max-h-[750px] lg:max-h-[920px] object-cover object-center"
        />
      </picture>

      <DesktopHeroContent />
      <MobileHeroContent />
    </section>
  );
}

// Desktop Hero Banner copy — centered inside the safe area (~60% width) so
// text never collides with the edges of the 1920x900 banner.
function DesktopHeroContent() {
  return (
    <div className="hidden lg:flex absolute inset-0 items-center justify-center px-8 bg-gradient-to-t from-[#1A1714]/85 via-[#1A1714]/40 to-[#1A1714]/20">
      <div className="text-center max-w-2xl mx-auto z-10 pt-16">
        <h1 className="serif font-light text-white leading-[1.08] text-5xl xl:text-7xl mb-6">
          Wear Light.
          <br />
          Wear <em className="not-italic text-[#D8B77E]">ELARAA</em>.
        </h1>
        <p className="text-sm xl:text-base text-stone-200/80 max-w-lg mx-auto font-light leading-relaxed mb-8">
          Premium fashion jewellery, anti tarnish and finished for the way you actually live, from morning coffee
          to candlelit dinners.
        </p>
        <div className="flex items-center justify-center gap-5">
          {/* Default btn-luxury border/text is black — invisible against this dark banner, so it's overridden to white here. */}
          <Button href="/shop" className="!border-white !text-white min-w-[170px] justify-center">
            Shop Collections
          </Button>
          <Button href="/about" variant="gold" className="min-w-[160px] justify-center">
            Our Story
          </Button>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60 text-stone-300">
        <span className="text-[9px] tracking-[.3em] uppercase">Scroll</span>
        <div className="w-[1px] h-8 bg-[#D8B77E]" />
      </div>
    </div>
  );
}

// Mobile Hero Banner copy — anchored near the bottom of the portrait frame
// and fully centered, matching the dedicated 4:5 mobile-first layout.
function MobileHeroContent() {
  return (
    <div className="flex lg:hidden absolute inset-0 items-end justify-center px-6 pb-14 pt-20 bg-gradient-to-b from-[#1A1714]/40 via-[#1A1714]/50 to-[#1A1714]/85">
      <div className="text-center max-w-sm mx-auto z-10">
        <h1 className="serif font-light text-white leading-[1.1] text-3xl sm:text-4xl mb-4">
          Wear Light.
          <br />
          Wear <em className="not-italic text-[#D8B77E]">ELARAA</em>.
        </h1>
        <p className="text-xs sm:text-sm text-stone-200/80 font-light leading-relaxed mb-6 px-2">
          Premium fashion jewellery, anti tarnish and finished for the way you live, from morning coffee to
          candlelit dinners.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
          <Button href="/shop" className="!border-white !text-white w-full justify-center text-xs">
            Shop Collections
          </Button>
          <Button href="/about" variant="gold" className="w-full justify-center text-xs">
            Our Story
          </Button>
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 text-stone-300">
        <div className="w-[1px] h-5 bg-[#D8B77E]" />
      </div>
    </div>
  );
}
