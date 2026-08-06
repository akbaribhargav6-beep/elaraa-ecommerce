import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { getStorageProvider } from '../storage';

async function list() {
  return prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }] });
}

interface BannerInput {
  title: string;
  subtitle?: string;
  linkUrl?: string;
  placement: 'HOME_HERO' | 'HOME_PROMO' | 'SHOP_TOP';
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: Date;
  expiresAt?: Date;
}

async function create(input: BannerInput, file: Express.Multer.File) {
  const storage = getStorageProvider();
  const ext = file.originalname.split('.').pop() ?? 'jpg';
  const key = `banners/${Date.now()}.${ext}`;
  const saved = await storage.save(key, file.buffer, file.mimetype);

  return prisma.banner.create({ data: { ...input, imageUrl: saved.url } });
}

async function update(id: string, input: Partial<BannerInput>, file?: Express.Multer.File) {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Banner not found');

  let imageUrl: string | undefined;
  if (file) {
    const storage = getStorageProvider();
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `banners/${Date.now()}.${ext}`;
    imageUrl = (await storage.save(key, file.buffer, file.mimetype)).url;
  }

  return prisma.banner.update({ where: { id }, data: { ...input, ...(imageUrl ? { imageUrl } : {}) } });
}

async function remove(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Banner not found');
  await prisma.banner.delete({ where: { id } });
}

export const adminBannerService = { list, create, update, remove };
