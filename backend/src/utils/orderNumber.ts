import crypto from 'node:crypto';

// e.g. ELR-20260805-4F2A
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ELR-${y}${m}${d}-${suffix}`;
}
