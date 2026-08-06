import { PrismaClient } from '@prisma/client';
import { generateSku } from '../src/utils/sku';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@elaraa.example';
const ADMIN_PASSWORD = 'ElaraaAdmin123!';

const METAL_OPTIONS = [
  { label: 'Classic Gold Tone', hex: '#C9A66B' },
  { label: 'Silver Tone', hex: '#E8E2D6' },
  { label: 'Rose Tone', hex: '#B76E42' },
] as const;

const EARRING_BACK_TYPES = [
  { label: 'Push Back', priceAddon: 0 },
  { label: 'Screw Back', priceAddon: 300 },
];

const NECKLACE_CLASP_TYPES = [{ label: 'Lobster Clasp', priceAddon: 0 }];

interface ProductSeed {
  slug: string;
  name: string;
  categorySlug: 'earrings' | 'necklaces';
  eyebrow: string;
  material: string;
  defaultMetal: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  stock: number;
  /** Image folder under uploads/products/ — defaults to slug when omitted. */
  imageFolder?: string;
  backTypes?: { label: string; priceAddon: number }[];
}

const CATEGORIES: { slug: string; name: string; description: string; sortOrder: number }[] = [
  { slug: 'earrings', name: 'Earrings', description: 'Premium fashion earrings with a long lasting, anti tarnish finish.', sortOrder: 0 },
  { slug: 'rings', name: 'Rings', description: 'Premium fashion rings with a long lasting, anti tarnish finish.', sortOrder: 1 },
  { slug: 'necklaces', name: 'Necklaces', description: 'Premium fashion necklaces and pendants with a long lasting, anti tarnish finish.', sortOrder: 2 },
  { slug: 'bracelets', name: 'Bracelets', description: 'Premium fashion bracelets with a long lasting, anti tarnish finish.', sortOrder: 3 },
  { slug: 'charms', name: 'Charms', description: 'Premium fashion charms with a long lasting, anti tarnish finish.', sortOrder: 4 },
  { slug: 'combo', name: 'Combo', description: 'Curated combo sets, styled and priced together.', sortOrder: 5 },
];

// Real ELARAA catalog — names/prices match the existing static site exactly.
// Copy is written as premium anti tarnish fashion jewellery: no gold purity,
// hallmark, or precious metal claims, since these are fashion pieces with a
// gold tone finish, not real gold or silver.
const PRODUCTS: ProductSeed[] = [
  {
    slug: 'captivate',
    name: 'Captivate Studs',
    categorySlug: 'earrings',
    eyebrow: 'The Édition Lumière Collection',
    material: 'Gold Tone Finish, Enamel',
    defaultMetal: 'Gold Tone Finish',
    shortDescription: 'Enamel detailed studs with a premium anti tarnish gold tone finish and a quiet, catching shine.',
    description:
      'A refined pair of enamel accented studs with a premium anti tarnish gold tone finish, designed to catch light without shouting for it. Lightweight and comfortable enough to wear from your first coffee to your last meeting.',
    basePrice: 2450,
    isFeatured: true,
    stock: 40,
  },
  {
    slug: 'delicate',
    name: 'Delicate Drops',
    categorySlug: 'earrings',
    eyebrow: 'Let Your Beauty Shine',
    material: 'Gold Tone Finish, Pearl',
    defaultMetal: 'Classic Gold Tone',
    shortDescription: 'Gold tone and pearl drop earrings, handfinished, light, elegant, and easy to wear every day.',
    description:
      'A polished gold tone dome sits atop a lustrous pearl drop, quiet, rounded, and effortlessly elegant. Feather light for all day wear, with a secure push back fastening made for daily rotation.',
    basePrice: 3200,
    compareAtPrice: 4200,
    isFeatured: true,
    stock: 35,
  },
  {
    slug: 'radiance',
    name: 'Radiance Studs',
    categorySlug: 'earrings',
    eyebrow: 'Édition Lumière',
    material: 'Gold Tone Finish, Twin Pearl',
    defaultMetal: 'Classic Gold Tone',
    shortDescription: 'Twin pearls set in a warm gold tone finish, radiant from every angle.',
    description:
      'Two lustrous pearls sit side by side in a warm gold tone finish, catching the light with every turn of your head. A studio finished pair built for the pieces you never want to take off.',
    basePrice: 2800,
    isFeatured: true,
    stock: 30,
  },
  {
    slug: 'serene',
    name: 'Serene Hearts',
    categorySlug: 'earrings',
    eyebrow: 'The Daily Edit',
    material: 'Gold Tone Finish, Enamel',
    defaultMetal: 'Gold Tone Finish',
    shortDescription: 'Soft heart shaped studs with a premium gold tone finish, made for quiet mornings.',
    description:
      'A gentle heart silhouette with a premium gold tone finish and a hint of enamel warmth. Serene Hearts is the pair you reach for without thinking, light, easy, and endlessly wearable.',
    basePrice: 2100,
    isBestSeller: true,
    stock: 50,
  },
  {
    slug: 'enchant',
    name: 'Enchant Hoops',
    categorySlug: 'earrings',
    eyebrow: 'Just Landed',
    material: 'Gold Tone Finish, Pearl',
    defaultMetal: 'Classic Gold Tone',
    shortDescription: 'Pearl accented hoops with a long lasting gold tone finish, made for everyday movement.',
    description:
      'Classic hoops reimagined with a single lustrous pearl accent and a long lasting, anti tarnish gold tone finish. Enchant Hoops move with you, from desk to dinner, without ever feeling heavy.',
    basePrice: 3450,
    isBestSeller: true,
    isNewArrival: true,
    stock: 28,
  },
  {
    slug: 'dazzle',
    name: 'Dazzle Hearts',
    categorySlug: 'earrings',
    eyebrow: 'Just Landed',
    material: 'Gold Tone Finish, Shell Pearl',
    defaultMetal: 'Gold Tone Finish',
    shortDescription: 'Shell pearl hearts with a premium gold tone finish, bright enough for any occasion.',
    description:
      'A brighter take on our signature heart silhouette, finished with a shell pearl centre and a premium gold tone finish. Dazzle Hearts adds a little sparkle to everyday wear without losing its softness.',
    basePrice: 2650,
    isBestSeller: true,
    isNewArrival: true,
    stock: 32,
  },
  {
    slug: 'luster',
    name: 'Luster Drops',
    categorySlug: 'earrings',
    eyebrow: 'Just Landed',
    material: 'Gold Tone Finish, Crystal',
    defaultMetal: 'Classic Gold Tone',
    shortDescription: 'Crystal drop earrings with a long lasting gold tone finish, cut to catch the light.',
    description:
      'A faceted crystal drop suspended from a long lasting gold tone finish, cut to throw light with every movement. Luster Drops is the pair that quietly upgrades whatever you already have on.',
    basePrice: 3800,
    isBestSeller: true,
    isNewArrival: true,
    stock: 25,
  },

  // ── Necklaces ─────────────────────────────────────────────────────────
  {
    slug: 'luster-drops-pendant',
    name: 'Luster Drops Pendant',
    categorySlug: 'necklaces',
    eyebrow: 'The Necklace Chronicles',
    material: 'Gold Tone Finish, Crystal',
    defaultMetal: 'Classic Gold Tone',
    imageFolder: 'luster',
    backTypes: NECKLACE_CLASP_TYPES,
    shortDescription: 'A crystal pendant on a fine anti tarnish chain, catching morning light with an ethereal sheen.',
    description:
      'Gracefully suspended from a fine anti tarnish chain, the Luster Drops Pendant catches light with every movement. Hand selected for warm undertones and mirror symmetry.',
    basePrice: 3800,
    isNewArrival: true,
    stock: 20,
  },
  {
    slug: 'serene-pearl-chain',
    name: 'Serene Pearl Chain',
    categorySlug: 'necklaces',
    eyebrow: 'The Necklace Chronicles',
    material: 'Gold Tone Finish, Freshwater Pearl',
    defaultMetal: 'Classic Gold Tone',
    imageFolder: 'serene',
    backTypes: NECKLACE_CLASP_TYPES,
    shortDescription: 'An unbroken rhythm of luminous freshwater pearls, engineered to lie flat along the collarbone.',
    description:
      'An unbroken rhythm of luminous freshwater pearls and hand crafted links, engineered to lie flat and contour softly along the collarbone. Finished by hand for daily wear.',
    basePrice: 4200,
    isNewArrival: true,
    stock: 18,
  },
  {
    slug: 'dazzle-choker',
    name: 'Dazzle Choker',
    categorySlug: 'necklaces',
    eyebrow: 'The Necklace Chronicles',
    material: 'Gold Tone Finish, Shell Pearl',
    defaultMetal: 'Gold Tone Finish',
    imageFolder: 'dazzle',
    backTypes: NECKLACE_CLASP_TYPES,
    shortDescription: 'Modern minimalism meets timeless glamour, centred by a focal shell pearl accent.',
    description:
      'Modern minimalism meets timeless glamour. Sculpted contours in a premium anti tarnish finish, centred by a focal shell pearl accent that elevates evening attire.',
    basePrice: 4800,
    isNewArrival: true,
    stock: 15,
  },
  {
    slug: 'edition-lumiere-solitaire',
    name: 'Édition Lumière Solitaire',
    categorySlug: 'necklaces',
    eyebrow: 'The Édition Lumière Collection',
    material: 'Rose Tone Finish, Solitaire Crystal',
    defaultMetal: 'Rose Tone',
    imageFolder: 'edition',
    backTypes: NECKLACE_CLASP_TYPES,
    shortDescription: 'A hand cut solitaire crystal held within a whisper thin rose tone bezel setting.',
    description:
      'A hand cut solitaire crystal held within a whisper thin rose tone bezel setting. Designed to rest gracefully at the throat for effortless daily radiance. Includes an authenticity card.',
    basePrice: 5100,
    isFeatured: true,
    isNewArrival: true,
    stock: 15,
  },
];

async function main() {
  console.log('Seeding ELARAA catalog...');

  const categoryBySlug = new Map<string, { id: string }>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: { name: c.name, slug: c.slug, description: c.description, isActive: true, sortOrder: c.sortOrder },
    });
    categoryBySlug.set(c.slug, category);
  }

  for (const p of PRODUCTS) {
    const category = categoryBySlug.get(p.categorySlug)!;
    const imageFolder = p.imageFolder ?? p.slug;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        categoryId: category.id,
        eyebrow: p.eyebrow,
        material: p.material,
        shortDescription: p.shortDescription,
        description: p.description,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isBestSeller: p.isBestSeller ?? false,
      },
      create: {
        slug: p.slug,
        name: p.name,
        categoryId: category.id,
        eyebrow: p.eyebrow,
        material: p.material,
        shortDescription: p.shortDescription,
        description: p.description,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isBestSeller: p.isBestSeller ?? false,
        publishedAt: new Date(),
      },
    });

    // Images: img-1 primary, img-2..4 gallery, img-5 hover/secondary (matches
    // the .img-secondary "worn" shot pattern already used on the static site).
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const imageFiles = ['img-1', 'img-2', 'img-3', 'img-4', 'img-5'];
    for (let i = 0; i < imageFiles.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/uploads/products/${imageFolder}/${imageFiles[i]}.jpg`,
          altText: `${p.name}, view ${i + 1}`,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
    }

    // Variants: the product's own material as the default metal, plus two
    // alternate finishes — matching the metal swatch selector on the static
    // product page — crossed with fastening/clasp types (earrings get Push
    // Back / Screw Back with a real +₹300 priceOverride; necklaces get a
    // single Lobster Clasp, since a "screw back" doesn't apply to a chain).
    //
    // Upsert by SKU rather than delete-then-recreate: once real orders
    // exist, OrderItem.variantId has a RESTRICT foreign key to
    // ProductVariant, so deleting a variant that's been ordered would fail
    // (correctly — that's the DB protecting order history integrity).
    // Re-running seed also must not silently reset stockQuantity back to
    // its initial value, clobbering real inventory movement from orders.
    const metals = [
      { label: p.defaultMetal, hex: METAL_OPTIONS.find((m) => m.label === p.defaultMetal)?.hex ?? METAL_OPTIONS[0].hex },
      ...METAL_OPTIONS.filter((m) => m.label !== p.defaultMetal),
    ];
    const backTypes = p.backTypes ?? EARRING_BACK_TYPES;

    let variantCount = 0;
    for (let i = 0; i < metals.length; i++) {
      const metal = metals[i];
      for (let j = 0; j < backTypes.length; j++) {
        const backType = backTypes[j];
        const sku = generateSku(p.slug, metal.label, backType.label);
        const initialStock = Math.round(p.stock / metals.length / backTypes.length);
        const priceOverride = backType.priceAddon > 0 ? p.basePrice + backType.priceAddon : null;

        const existing = await prisma.productVariant.findUnique({ where: { sku } });
        const variant = await prisma.productVariant.upsert({
          where: { sku },
          update: {
            metalLabel: metal.label,
            metalHex: metal.hex,
            backType: backType.label,
            priceOverride,
            isDefault: i === 0 && j === 0,
            isActive: true,
          },
          create: {
            productId: product.id,
            sku,
            metalLabel: metal.label,
            metalHex: metal.hex,
            backType: backType.label,
            priceOverride,
            stockQuantity: initialStock,
            isDefault: i === 0 && j === 0,
            isActive: true,
          },
        });

        if (!existing) {
          await prisma.inventoryLog.create({
            data: {
              variantId: variant.id,
              changeQty: initialStock,
              reason: 'RESTOCK',
              note: 'Initial seed stock',
            },
          });
        }
        variantCount++;
      }
    }

    console.log(`  ✓ ${p.name} (${p.slug}) — 5 images, ${variantCount} variants`);
  }

  // Admin user — needed to log into /admin. Change this password in any
  // shared/deployed environment; it's a known dev-only credential.
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      firstName: 'ELARAA',
      lastName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`  ✓ Admin user ready — ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  console.log(`Seed complete: ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
