import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { getStorageProvider } from '../storage';

async function list() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return categories.map((c) => ({ ...c, productCount: c._count.products }));
}

interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

async function create(input: CategoryInput, file?: Express.Multer.File) {
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict('A category with this slug already exists');

  let imageUrl = input.imageUrl;
  if (file) {
    const storage = getStorageProvider();
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `categories/${Date.now()}.${ext}`;
    imageUrl = (await storage.save(key, file.buffer, file.mimetype)).url;
  }

  return prisma.category.create({ data: { ...input, imageUrl } });
}

async function update(id: string, input: Partial<CategoryInput>, file?: Express.Multer.File) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Category not found');

  let imageUrl: string | undefined = input.imageUrl;
  if (file) {
    const storage = getStorageProvider();
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `categories/${Date.now()}.${ext}`;
    imageUrl = (await storage.save(key, file.buffer, file.mimetype)).url;
  }

  return prisma.category.update({ where: { id }, data: { ...input, ...(imageUrl !== undefined ? { imageUrl } : {}) } });
}

async function remove(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Category not found');
  try {
    await prisma.category.delete({ where: { id } });
    return { hardDeleted: true };
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
      return { hardDeleted: false, reason: 'Category has products — deactivated instead of deleted.' };
    }
    throw err;
  }
}

export const adminCategoryService = { list, create, update, remove };
