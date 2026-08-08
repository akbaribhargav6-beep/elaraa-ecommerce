import type { Metadata } from 'next';
import Image from 'next/image';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Footer } from '@/components/layout/Footer';
import { getUploadUrl } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Our Story | ELARAA',
  description: 'The story behind ELARAA premium fashion jewellery.',
};

const PROMISES = [
  { icon: '👑', title: 'Quality Guarantee', body: 'Every item arrives with an authenticity card and premium anti tarnish finish guarantee.' },
  { icon: '🎁', title: 'Velvet Gift Unboxing', body: 'Enclosed in our signature gift packaging, luxury ribbon, and personalized care instructions.' },
  { icon: '🚚', title: 'Insured Shipping', body: 'Dispatched via premium express logistics with transit protection covering full item value.' },
  { icon: '💎', title: 'Customer Satisfaction', body: 'Dedicated customer support and seamless assistance for all your jewellery care needs.' },
];

export default function AboutPage() {
  return (
    <>
      <div className="pt-28" />

      {/* HERO */}
      <section className="relative pb-16 sm:pb-20 px-6 md:px-16 text-center" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #F8F5F0 50%, rgba(239,233,222,.5) 100%)', borderBottom: '1px solid rgba(43,38,32,.08)' }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80" style={{ border: '1px solid rgba(201,166,107,.35)' }}>
              <span className="text-xs" style={{ color: 'var(--gold-deep)' }}>✦</span>
              <span className="text-[11px] font-medium tracking-widest uppercase">Heritage of Elegance · Jamnagar Atelier</span>
              <span className="text-xs" style={{ color: 'var(--gold-deep)' }}>✦</span>
            </div>
          </RevealOnScroll>
          <RevealOnScroll><Eyebrow className="tracking-[.4em]">Our Story & Craftsmanship</Eyebrow></RevealOnScroll>
          <RevealOnScroll as="div">
            <h1 className="serif text-4xl sm:text-6xl font-light leading-[1.1]">
              Crafting Timeless <em className="not-italic" style={{ color: 'var(--gold-deep)' }}>Fashion Jewellery</em> & Everyday Luxury
            </h1>
          </RevealOnScroll>
          <RevealOnScroll as="div">
            <p className="text-sm sm:text-base opacity-70 leading-relaxed">
              ELARAA was born from a singular conviction: jewellery shouldn&apos;t hide in a drawer awaiting special
              occasions. It should be weightless, personal, and worn every single day.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* CINEMATIC BANNER */}
      <section className="px-6 md:px-16 -mt-8 relative z-10 max-w-7xl mx-auto">
        <RevealOnScroll as="div" className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden shadow-2xl border" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
          <Image src="https://res.cloudinary.com/nvausw3f/image/upload/v1786170498/products/enchant/img-5.jpg" alt="ELARAA artisans at work" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6 sm:p-12">
            <div className="text-white space-y-2 max-w-xl">
              <p className="eyebrow text-xs" style={{ color: 'var(--gold)' }}>Jamnagar Atelier District</p>
              <h2 className="serif text-2xl sm:text-4xl font-light">Where Heritage Aesthetics Meet Modern Restraint</h2>
              <p className="text-xs sm:text-sm opacity-80 hidden sm:block">
                Handcrafted in small batches, premium anti tarnish finish, and polished by master artisans.
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* STORY */}
      <section className="px-6 md:px-16 py-20 sm:py-28 border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <RevealOnScroll className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] overflow-hidden border shadow-xl" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
              <Image src="https://res.cloudinary.com/nvausw3f/image/upload/v1786170505/products/luster/img-1.jpg" alt="ELARAA crafting" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white/90 backdrop-blur-md p-5 max-w-xs shadow-xl" style={{ border: '1px solid rgba(201,166,107,.4)' }}>
              <p className="serif text-lg italic font-medium">&ldquo;Purity is not a feature; it is our foundation.&rdquo;</p>
              <p className="text-[10px] uppercase tracking-widest mt-2" style={{ color: 'var(--gold-deep)' }}>The ELARAA Philosophy</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="lg:col-span-7 space-y-8 lg:pl-6">
            <div>
              <Eyebrow className="mb-2">Act I · The Genesis</Eyebrow>
              <h2 className="serif text-3xl sm:text-5xl leading-tight">Reimagining Fashion Jewellery for Modern Life</h2>
            </div>
            <div className="space-y-4 text-sm sm:text-base opacity-70 leading-relaxed">
              <p>
                For decades, the traditional jewellery industry forced women to choose between two extremes:
                overpriced boutiques with heavy markups for occasional wear, or low quality accessories that tarnish
                in weeks.
              </p>
              <p>
                We set out to create a third way. Based in Jamnagar, Gujarat, a city with a craftsmanship tradition
                that runs generations deep, ELARAA was established to craft <strong>premium fashion jewellery with
                anti tarnish finishes</strong> designed to be lived in.
              </p>
              <p>From morning coffees to formal galas, our creations combine architectural minimalism with everyday elegance.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
              {[
                { title: 'Premium Finish & Anti Tarnish', body: 'Skin friendly and built for daily wear.' },
                { title: 'Fair Direct Pricing', body: 'Crafted in-house without middleman markups.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold" style={{ background: 'rgba(168,130,61,.1)', color: 'var(--gold-deep)' }}>✓</span>
                  <div>
                    <h4 className="serif text-lg font-medium">{f.title}</h4>
                    <p className="text-xs opacity-60">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 md:px-16 text-center" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { target: 15000, suffix: '+', label: 'Delighted Clients' },
            { target: 100, suffix: '%', label: 'Anti Tarnish Quality' },
          ].map((s) => (
            <RevealOnScroll key={s.label} className="space-y-2">
              <AnimatedCounter target={s.target} suffix={s.suffix} />
              <p className="text-[11px] uppercase tracking-widest opacity-60">{s.label}</p>
            </RevealOnScroll>
          ))}
          <RevealOnScroll className="space-y-2">
            <p className="serif text-4xl sm:text-6xl font-light" style={{ color: 'var(--gold)' }}>4.9 / 5</p>
            <p className="text-[11px] uppercase tracking-widest opacity-60">Client Concierge Rating</p>
          </RevealOnScroll>
          <RevealOnScroll className="space-y-2">
            <AnimatedCounter target={25} suffix="+" />
            <p className="text-[11px] uppercase tracking-widest opacity-60">Cities Delivered</p>
          </RevealOnScroll>
        </div>
      </section>

      {/* PROMISES */}
      <section className="px-6 md:px-16 py-20 sm:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <RevealOnScroll className="lg:col-span-5 space-y-6">
            <Eyebrow>Our Guarantees</Eyebrow>
            <h2 className="serif text-3xl sm:text-5xl leading-tight">The ELARAA Promise to You</h2>
            <p className="text-sm sm:text-base opacity-70 leading-relaxed">
              When you choose an ELARAA piece, you are entering a lasting relationship with our atelier. Here is
              what we guarantee with every delivery.
            </p>
            <Button href="/shop" variant="gold">Explore Current Collections</Button>
          </RevealOnScroll>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PROMISES.map((p) => (
              <RevealOnScroll key={p.title} className="bg-white p-6 border space-y-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'rgba(168,130,61,.1)' }}>{p.icon}</div>
                <h3 className="serif text-xl font-medium">{p.title}</h3>
                <p className="text-xs opacity-60 leading-relaxed">{p.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL GALLERY */}
      <section className="px-6 md:px-16 py-16" style={{ background: 'rgba(239,233,222,.4)', borderTop: '1px solid rgba(43,38,32,.08)', borderBottom: '1px solid rgba(43,38,32,.08)' }}>
        <div className="max-w-7xl mx-auto space-y-8">
          <RevealOnScroll className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Eyebrow>Visual Gallery</Eyebrow>
              <h2 className="serif text-3xl sm:text-4xl">Inside the World of ELARAA</h2>
            </div>
            <p className="text-xs opacity-60 max-w-sm">A glimpse into our daily studio practice, stone selection, and finished creations.</p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { src: 'https://res.cloudinary.com/nvausw3f/image/upload/v1786170500/products/dazzle/img-1.jpg', alt: 'ELARAA Dazzle earrings', caption: 'The Dazzle Drop Collection' },
              { src: 'https://res.cloudinary.com/nvausw3f/image/upload/v1786170488/products/serene/img-1.jpg', alt: 'ELARAA Serene pearl studs', caption: 'Hand Selected Freshwater Pearls' },
              { src: 'https://res.cloudinary.com/nvausw3f/image/upload/v1786170482/products/radiance/img-1.jpg', alt: 'ELARAA Radiance studs', caption: 'Premium Anti Tarnish Finish', wide: true },
            ].map((g) => (
              <RevealOnScroll key={g.src} className={`relative aspect-[4/5] overflow-hidden border ${g.wide ? 'sm:col-span-2 lg:col-span-1' : ''}`} style={{ borderColor: 'rgba(43,38,32,.15)' }}>
                <Image src={getUploadUrl(g.src)} alt={g.alt} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent p-6 flex items-end">
                  <p className="text-xs text-white font-medium">{g.caption}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER QUOTE */}
      <section className="px-6 md:px-16 py-20 sm:py-28 max-w-5xl mx-auto text-center">
        <RevealOnScroll as="div" className="p-8 sm:p-14 shadow-2xl space-y-6" style={{ background: 'var(--black)', color: 'var(--ivory)', border: '1px solid rgba(201,166,107,.4)' }}>
          <div className="text-5xl serif leading-none opacity-80" style={{ color: 'var(--gold)' }}>&ldquo;</div>
          <p className="serif italic text-xl sm:text-3xl leading-relaxed font-light max-w-3xl mx-auto opacity-90">
            True luxury isn&apos;t defined by how loud a piece speaks, but by how deeply it connects with the person
            wearing it. When you put on ELARAA, you should feel effortless elegance and lightweight comfort.
          </p>
          <div className="pt-4 border-t max-w-xs mx-auto space-y-1" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
            <h4 className="serif text-xl font-medium" style={{ color: 'var(--gold)' }}>The Founders & Artisans</h4>
            <p className="text-[11px] uppercase tracking-widest opacity-50">ELARAA Atelier · Jamnagar, India</p>
          </div>
        </RevealOnScroll>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 md:px-16 py-20 text-center" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #EFE9DE 100%)', borderTop: '1px solid rgba(43,38,32,.08)' }}>
        <RevealOnScroll as="div" className="max-w-4xl mx-auto space-y-6">
          <Eyebrow>Discover Excellence</Eyebrow>
          <h2 className="serif text-4xl sm:text-6xl font-light leading-tight">
            Begin Your <em className="not-italic" style={{ color: 'var(--gold-deep)' }}>ELARAA Journey</em>
          </h2>
          <p className="text-sm sm:text-base opacity-70 max-w-xl mx-auto leading-relaxed">
            Explore our latest collections online, or reach out to our concierge for styling assistance.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button href="/shop" variant="gold-solid">Explore Collection →</Button>
            <Button href="/contact" variant="gold">Contact Private Concierge</Button>
          </div>
        </RevealOnScroll>
      </section>

      <Footer />
    </>
  );
}
