import Link from 'next/link';
import type { Metadata } from 'next';
import type { CategoryDTO, ProductListResponse } from '@elaraa/shared';
import { apiGetServer } from '@/lib/api-server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ProductCard } from '@/components/ui/ProductCard';
import { ShopControls, SortSelect } from '@/components/shop/ShopFilters';
import { Footer } from '@/components/layout/Footer';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Shop All Jewellery | ELARAA',
  description: 'Browse the full ELARAA collection of premium fashion jewellery.',
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  ['category', 'metal', 'minPrice', 'maxPrice', 'sort', 'search', 'newArrival', 'bestSeller', 'featured', 'page'].forEach(
    (key) => {
      if (params[key]) query.set(key, params[key]!);
    }
  );
  query.set('limit', '12');

  const [products, categoriesData] = await Promise.all([
    apiGetServer<ProductListResponse>(`/api/products?${query.toString()}`, 30),
    apiGetServer<{ categories: CategoryDTO[] }>('/api/categories', 300),
  ]);

  const categories = categoriesData?.categories ?? [];
  const items = products?.items ?? [];
  const page = products?.page ?? 1;
  const totalPages = products?.totalPages ?? 1;
  const grandTotal = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <>
      <div className="pt-28" />
      <section className="px-4 sm:px-6 md:px-16 pb-20 sm:pb-28 max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <Eyebrow>The Full Edit</Eyebrow>
          <h1 className="serif text-3xl sm:text-4xl md:text-6xl mt-2 sm:mt-4">Shop All Jewellery</h1>
          <p className="text-xs sm:text-sm opacity-60 mt-2 sm:mt-4">
            {grandTotal} pieces, crafted with premium fashion finish
          </p>
        </div>

        <ShopControls categories={categories} totalCount={grandTotal}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <p className="text-xs opacity-60">Showing {items.length} of {products?.total ?? 0} products</p>
              <SortSelect />
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <p className="serif text-2xl opacity-70">No pieces match your selected filters</p>
                <p className="text-xs opacity-50">Try broadening your search term or adjusting the price range.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-16">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const qp = new URLSearchParams(query);
                  qp.set('page', String(p));
                  return (
                    <Link
                      key={p}
                      href={`/shop?${qp.toString()}`}
                      className="w-9 h-9 flex items-center justify-center text-sm border"
                      style={{
                        borderColor: p === page ? 'var(--black)' : 'rgba(43,38,32,.2)',
                        background: p === page ? 'var(--black)' : 'transparent',
                        color: p === page ? 'var(--ivory)' : 'inherit',
                      }}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>
            )}
        </ShopControls>
      </section>
      <Footer />
    </>
  );
}
