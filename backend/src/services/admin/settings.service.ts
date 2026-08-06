import { prisma } from '../../config/db';

async function list() {
  return prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
}

async function upsert(key: string, value: string, group?: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value, ...(group ? { group } : {}) },
    create: { key, value, group },
  });
}

export const adminSettingsService = { list, upsert };
