import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ProductDTO, ReviewDTO } from '@elaraa/shared';
import { apiGetServer } from '@/lib/api-server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { ProductAccordions } from '@/components/product/ProductAccordions';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { ProductCard } from '@/components/ui/ProductCard';
import { Footer } from '@/components/layout/Footer';

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await apiGetServer<{ product: ProductDTO }>(`/api/products/${slug}`);
  if (!data) return {};
  return {
    title: `${data.product.name} | ELARAA`,
    description: data.product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const data = await apiGetServer<{ product: ProductDTO }>(`/api/products/${slug}`);
  if (!data) notFound();
  const { product } = data;
  const categoryLabel = product.categorySlug.charAt(0).toUpperCase() + product.categorySlug.slice(1);

  const [relatedData, reviewsData] = await Promise.all([
    apiGetServer<{ products: ProductDTO[] }>(`/api/products/${slug}/related`),
    apiGetServer<{ reviews: ReviewDTO[] }>(`/api/products/${slug}/reviews`),
  ]);

  return (
    <>
      <div className="pt-28" />
      <main className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-70">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:opacity-100">Home</Link>
            <span>/</span>
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:opacity-100">{categoryLabel}</Link>
            <span>/</span>
            <span className="opacity-100 font-medium">{product.name}</span>
          </nav>
          {product.eyebrow && (
            <div className="flex items-center gap-2 text-[10px] tracking-[.25em] uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold-deep)' }} />
              {product.eyebrow}
            </div>
          )}
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            <div className="lg:col-span-7">
              <ProductGallery images={product.images} productName={product.name} />
              <div
                className="flex items-center justify-between gap-4 mt-4 p-4 sm:p-5 text-xs"
                style={{ background: 'rgba(239,233,222,.6)', border: '1px solid rgba(216,183,126,.3)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  <div>
                    <p className="font-medium">Handfinished Premium Finish</p>
                    <p className="opacity-70 text-[11px] mt-0.5">Every piece is individually finished for luster and symmetry.</p>
                  </div>
                </div>
                <span className="text-[10px] tracking-widest uppercase font-medium shrink-0" style={{ color: 'var(--gold-deep)' }}>
                  Anti Tarnish
                </span>
              </div>
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </section>

        <ProductAccordions product={product} />

        {relatedData && relatedData.products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-24 sm:mt-32">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <p className="eyebrow">Curated Complements</p>
                <h2 className="serif text-3xl sm:text-4xl mt-1">You May Also Like</h2>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
              {relatedData.products.map((p) => (
                <div key={p.id} className="min-w-[220px] sm:min-w-[260px] max-w-[280px] flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-24 sm:mt-32">
          <div className="border-t border-b py-12 sm:py-16" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
            <div className="text-center mb-10">
              <p className="eyebrow">Uncompromising Standards</p>
              <h2 className="serif text-3xl sm:text-4xl mt-1">The ELARAA Guarantee</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
              {[
                { icon: '👑', label: 'Anti Tarnish', sub: '100% Quality Guaranteed' },
                { icon: '💎', label: 'Premium Finish', sub: 'Ethically Sourced Materials' },
                { icon: '🎁', label: 'Velvet Box', sub: 'Signature Gift Packaging' },
                { icon: '🚚', label: 'Insured Transit', sub: 'Free Shipping across India' },
                { icon: '↺', label: '14-Day Returns', sub: 'No Questions Asked' },
                { icon: '🛡️', label: 'Lifetime Care', sub: 'Complimentary Cleaning' },
              ].map((b) => (
                <div key={b.label} className="p-4 space-y-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl"
                    style={{ background: 'rgba(43,38,32,.08)', color: 'var(--gold-deep)' }}
                  >
                    {b.icon}
                  </div>
                  <h4 className="font-medium text-xs uppercase tracking-wider">{b.label}</h4>
                  <p className="text-[11px] opacity-60 leading-snug">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-24 sm:mt-32">
          <ReviewsSection slug={slug} initialReviews={reviewsData?.reviews ?? []} />
        </section>
      </main>
      <Footer />
    </>
  );
}
