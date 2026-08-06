import Link from 'next/link';
import Image from 'next/image';
import type { ProductListResponse, CategoryDTO } from '@elaraa/shared';
import { apiGetServer } from '@/lib/api-server';
import { getUploadUrl, getCategoryImageUrl } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { NewsletterForm } from '@/components/ui/NewsletterForm';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/home/HeroBanner';
import { NecklaceChapter } from '@/components/home/NecklaceChapter';
import { NewArrivalsSpotlight } from '@/components/home/NewArrivalsSpotlight';
import { TestimonialsGallery } from '@/components/home/TestimonialsGallery';
import { BestSellersShowcase } from '@/components/home/BestSellersShowcase';
import { SignatureEarringsGrid } from '@/components/home/SignatureEarringsGrid';
import { FeaturedLuxuryDeal } from '@/components/home/FeaturedLuxuryDeal';

export const revalidate = 60;

const CHAPTER_LABELS = ['Chapter 01', 'Chapter 02', 'Chapter 03', 'Chapter 04'];

export default async function HomePage() {
  const [featured, bestSellers, newArrivals, necklaces, loved, earrings, categoriesData] = await Promise.all([
    apiGetServer<ProductListResponse>('/api/products?featured=true&limit=3'),
    apiGetServer<ProductListResponse>('/api/products?bestSeller=true&limit=4'),
    apiGetServer<ProductListResponse>('/api/products?newArrival=true&limit=6'),
    apiGetServer<ProductListResponse>('/api/products?category=necklaces&limit=4'),
    apiGetServer<ProductListResponse>('/api/products?limit=8'),
    apiGetServer<ProductListResponse>('/api/products?category=earrings&limit=4'),
    apiGetServer<{ categories: CategoryDTO[] }>('/api/categories'),
  ]);

  const shopByCategories = categoriesData?.categories ?? [];

  const dealProduct = featured?.items.find((p) => p.compareAtPrice) ?? featured?.items[0];
  const instaThumbs = (loved?.items ?? []).slice(0, 5);

  return (
    <>
      <HeroBanner />

      {/* CATEGORIES */}
      <section className="px-6 md:px-16 py-20 max-w-6xl mx-auto text-center">
        <RevealOnScroll><Eyebrow>Shop by Category</Eyebrow></RevealOnScroll>
        <RevealOnScroll as="div" className="mt-4 mb-14">
          <h2 className="serif text-4xl md:text-5xl">Find Your Piece</h2>
        </RevealOnScroll>
        <div className="flex flex-wrap justify-center gap-8 md:grid md:grid-cols-3 md:justify-items-center md:gap-x-16 md:gap-y-12">
          {shopByCategories.map((cat) => {
            const image = getCategoryImageUrl(cat.imageUrl);
            return (
              <RevealOnScroll key={cat.id} className="flex flex-col items-center group">
                <Link href={`/shop?category=${cat.slug}`} className="flex flex-col items-center">
                  <div
                    className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 transition-transform duration-500 group-hover:scale-105 flex items-center justify-center"
                    style={{ border: '2px solid var(--gold)', background: 'var(--cream)' }}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} className="w-full h-full object-cover" alt={cat.name} />
                    ) : (
                      <span className="serif text-3xl" style={{ color: 'var(--gold-deep)' }}>{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="serif text-lg">{cat.name}</span>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="px-6 py-10 border-y" style={{ borderColor: 'rgba(43,38,32,.08)', background: 'var(--cream)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {['Handcrafted Detail', 'Skin Friendly', 'Anti Tarnish', '14 Day Easy Returns'].map((label) => (
            <RevealOnScroll key={label}>
              <div
                className="flex items-center justify-center mb-2 mx-auto rounded-full"
                style={{ width: 56, height: 56, background: 'var(--ivory)', border: '1px solid rgba(168,130,61,.3)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" strokeWidth="1.3">
                  <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
                </svg>
              </div>
              <p className="text-xs tracking-[.15em] uppercase opacity-80">{label}</p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTION */}
      {featured && featured.items.length > 0 && (
        <section className="px-6 md:px-16 py-28 max-w-7xl mx-auto">
          <RevealOnScroll as="div" className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <Eyebrow>Featured Collection</Eyebrow>
              <h2 className="serif text-4xl md:text-5xl mt-4">Timeless Essentials</h2>
            </div>
            <p className="max-w-xs text-sm opacity-70 mt-6 md:mt-0">
              Premium anti-tarnish jewellery crafted to keep its brilliance through every day, every occasion, and every moment.
            </p>
          </RevealOnScroll>
          <div className="grid md:grid-cols-3 gap-8">
            {featured.items.map((p) => (
              <RevealOnScroll key={p.id}><ProductCard product={p} /></RevealOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      {bestSellers && bestSellers.items.length > 0 && (
        <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden" style={{ background: '#F7F4EE' }}>
          <div className="max-w-7xl mx-auto relative z-10">
            <RevealOnScroll as="div" className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-px" style={{ background: 'var(--gold-deep)' }} />
                  <p className="eyebrow" style={{ color: 'var(--gold-deep)' }}>Best Sellers</p>
                </div>
                <h2 className="serif text-4xl sm:text-5xl md:text-6xl font-light leading-tight">Most Loved Collection</h2>
              </div>
              <div className="mt-4 md:mt-0 max-w-md">
                <p className="text-xs sm:text-sm opacity-70 leading-relaxed">
                  Our most coveted pieces, crafted in premium anti tarnish alloy and luster pearls, chosen repeatedly by our customers.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll as="div">
              <BestSellersShowcase products={bestSellers.items} />
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* SIGNATURE EARRINGS */}
      {earrings && earrings.items.length > 0 && (
        <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden" style={{ background: '#FAF8F5' }}>
          <div className="max-w-7xl mx-auto relative z-10">
            <RevealOnScroll as="div" className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-px" style={{ background: 'var(--gold-deep)' }} />
                  <p className="eyebrow" style={{ color: 'var(--gold-deep)' }}>01 / The Earrings Edit</p>
                </div>
                <h2 className="serif text-4xl sm:text-5xl md:text-6xl font-light leading-tight">Signature Earrings</h2>
              </div>
              <div className="mt-4 md:mt-0 max-w-md">
                <p className="text-xs sm:text-sm opacity-70 leading-relaxed">
                  Handcrafted icons in a premium anti tarnish finish, engineered to reflect light effortlessly with square precision frames.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll as="div">
              <SignatureEarringsGrid products={earrings.items} />
            </RevealOnScroll>
            <RevealOnScroll as="div" className="mt-20 text-center">
              <Button href="/shop?category=earrings" variant="gold">View Full Earrings Collection →</Button>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* BRAND STORY */}
      <section className="relative py-32 px-6" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <RevealOnScroll><Eyebrow className="!text-gold">About ELARAA</Eyebrow></RevealOnScroll>
          <RevealOnScroll as="div" className="mt-6">
            <h2 className="serif text-4xl md:text-6xl leading-tight">
              Jewellery made for the moments
              <br />
              that don&apos;t need an occasion.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll as="div" className="mt-8 max-w-xl mx-auto opacity-70 text-sm md:text-base">
            <p>
              ELARAA was born from a simple belief: premium fashion jewellery shouldn&apos;t sit in a box waiting
              for a wedding. Every piece has a long lasting, anti tarnish finish, made by hand and designed to be
              worn every single day until it becomes part of you.
            </p>
          </RevealOnScroll>
          <RevealOnScroll as="div" className="mt-10">
            <Button href="/about" variant="gold" className="!border-gold !text-gold">Read Our Story</Button>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURED LUXURY DEAL */}
      {dealProduct && (
        <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #FAF6EE 0%, #EFE7DA 100%)' }}>
          <div className="max-w-7xl mx-auto relative z-10">
            <RevealOnScroll as="div">
              <FeaturedLuxuryDeal product={dealProduct} />
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* NECKLACE CHRONICLES */}
      {necklaces && necklaces.items.length > 0 && (
        <section className="px-6 md:px-16 py-28 max-w-7xl mx-auto">
          <RevealOnScroll as="div" className="text-center max-w-3xl mx-auto mb-20">
            <Eyebrow>The Necklace Chronicles</Eyebrow>
            <h2 className="serif text-4xl md:text-6xl mt-4">Timeless Necklace Collection</h2>
            <p className="mt-4 text-sm opacity-70 max-w-xl mx-auto leading-relaxed">
              Ethereal neckpieces with an anti tarnish finish, accented with luster pearls and crystal.
            </p>
          </RevealOnScroll>
          <div className="space-y-24">
            {necklaces.items.map((p, i) => (
              <RevealOnScroll key={p.id}>
                <NecklaceChapter product={p} chapter={CHAPTER_LABELS[i] ?? `Chapter ${i + 1}`} reversed={i % 2 === 1} />
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll as="div" className="mt-20 text-center">
            <Button href="/shop?category=necklaces" variant="gold">Explore Complete Necklace Edit →</Button>
          </RevealOnScroll>
        </section>
      )}

      {/* NEW ARRIVALS SPOTLIGHT */}
      {newArrivals && newArrivals.items.length > 0 && (
        <section className="px-6 md:px-16 pb-28 max-w-7xl mx-auto">
          <RevealOnScroll as="div" className="flex flex-col md:flex-row md:items-end md:justify-between mb-14">
            <div>
              <Eyebrow>Latest Edit</Eyebrow>
              <h2 className="serif text-4xl md:text-5xl mt-4">The New Collection</h2>
            </div>
            <Link href="/shop?newArrival=true" className="text-xs tracking-[.2em] uppercase hover:opacity-60">View All →</Link>
          </RevealOnScroll>
          <RevealOnScroll as="div">
            <NewArrivalsSpotlight products={newArrivals.items} />
          </RevealOnScroll>
        </section>
      )}

      {/* LOVED BY WOMEN ACROSS INDIA — testimonial polaroid gallery */}
      {loved && loved.items.length > 0 && (
        <section className="px-6 md:px-16 py-28 max-w-7xl mx-auto">
          <RevealOnScroll as="div" className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>In Their Words</Eyebrow>
            <h2 className="serif text-4xl md:text-6xl mt-4">Loved by Women Across India</h2>
            <p className="mt-4 text-sm opacity-70 leading-relaxed">
              Real pieces, styled and worn every day by the women who bought them.
            </p>
          </RevealOnScroll>
          <RevealOnScroll as="div">
            <TestimonialsGallery products={loved.items} />
          </RevealOnScroll>
        </section>
      )}

      {/* STYLE GALLERY */}
      {instaThumbs.length > 0 && (
        <section className="px-6 md:px-16 py-24 max-w-7xl mx-auto text-center">
          <RevealOnScroll><Eyebrow>Follow Along</Eyebrow></RevealOnScroll>
          <RevealOnScroll as="div" className="mt-4 mb-12"><h2 className="serif text-4xl md:text-5xl">The ELARAA Edit</h2></RevealOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {instaThumbs.map((p, i) => {
              const img = p.images[0];
              return (
                <RevealOnScroll key={p.id} className={`aspect-square overflow-hidden ${i === 4 ? 'hidden md:block' : ''}`}>
                  <Link href={`/product/${p.slug}`} className="block w-full h-full">
                    {img && (
                      <Image
                        src={getUploadUrl(img.url)}
                        alt={p.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    )}
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 md:px-16 py-24 max-w-3xl mx-auto">
        <RevealOnScroll className="text-center"><Eyebrow>Questions</Eyebrow></RevealOnScroll>
        <RevealOnScroll as="div" className="text-center mt-4 mb-14"><h2 className="serif text-4xl md:text-5xl">Frequently Asked</h2></RevealOnScroll>
        <div>
          {[
            { q: 'Will the jewellery tarnish over time??', a: 'Our jewellery is crafted with premium anti-tarnish technology to maintain its shine. With proper care, it stays beautiful for everyday wear.' },
            { q: 'Is the jewellery waterproof and sweat resistant?', a: 'Yes. Our anti-tarnish jewellery is designed to resist water, sweat, and everyday exposure, helping it retain its lasting shine.' },
            { q: 'Is it safe for sensitive skin?', a: 'Absolutely. Our jewellery is hypoallergenic, nickel-free, and designed to be gentle on sensitive skin for all-day comfort.' },
            { q: 'How long does delivery take?', a: 'We ship across India. Most orders are delivered within 3 to 7 business days in secure, premium packaging.' },
          ].map((item) => (
            <RevealOnScroll key={item.q} as="div" className="py-6 border-b" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
              <details>
                <summary className="serif text-lg cursor-pointer flex items-center justify-between">
                  {item.q} <span className="opacity-50 text-sm">+</span>
                </summary>
                <p className="text-sm opacity-70 mt-4">{item.a}</p>
              </details>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="px-6 py-24 text-center" style={{ background: 'var(--cream)' }}>
        <RevealOnScroll><Eyebrow>Stay in the Light</Eyebrow></RevealOnScroll>
        <RevealOnScroll as="div" className="mt-4 mb-8"><h2 className="serif text-3xl md:text-4xl">Join the ELARAA Circle</h2></RevealOnScroll>
        <RevealOnScroll><NewsletterForm /></RevealOnScroll>
      </section>

      <Footer noMt />
    </>
  );
}
