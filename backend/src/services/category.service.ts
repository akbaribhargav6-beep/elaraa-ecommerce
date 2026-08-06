import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';

async function list() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }));
}

async function getBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug, isActive: true } });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export const categoryService = { list, getBySlug };
