export function generateSku(productSlug: string, metalLabel: string, backType?: string | null): string {
  const metalCode = metalLabel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const backCode = backType ? '-' + backType.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() : '';
  return `${productSlug.toUpperCase()}-${metalCode}${backCode}`;
}
