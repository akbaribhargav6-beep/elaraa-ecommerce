import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import type { AddressDTO } from '@elaraa/shared';
import type { Address } from '@prisma/client';

function toDTO(a: Address): AddressDTO {
  return {
    id: a.id,
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

async function list(userId: string): Promise<AddressDTO[]> {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return addresses.map(toDTO);
}

interface AddressInput {
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

async function create(userId: string, input: AddressInput): Promise<AddressDTO> {
  const existingCount = await prisma.address.count({ where: { userId } });
  const makeDefault = input.isDefault || existingCount === 0;

  if (makeDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { ...input, userId, isDefault: makeDefault },
  });
  return toDTO(address);
}

async function update(userId: string, id: string, input: Partial<AddressInput>): Promise<AddressDTO> {
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw ApiError.notFound('Address not found');

  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({ where: { id }, data: input });
  return toDTO(address);
}

async function remove(userId: string, id: string): Promise<void> {
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw ApiError.notFound('Address not found');
  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

async function setDefault(userId: string, id: string): Promise<AddressDTO> {
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw ApiError.notFound('Address not found');

  await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  const address = await prisma.address.update({ where: { id }, data: { isDefault: true } });
  return toDTO(address);
}

export const addressService = { list, create, update, remove, setDefault };
