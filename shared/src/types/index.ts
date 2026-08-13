// Enums and DTO shapes shared between backend and frontend so they never drift.
// Mirrors backend/prisma/schema.prisma — keep in sync when the schema changes.

export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'COD' | 'RAZORPAY';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantDTO {
  id: string;
  sku: string;
  metalLabel: string;
  metalHex: string | null;
  backType: string | null;
  price: number;
  stockQuantity: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  eyebrow: string | null;
  shortDescription: string | null;
  description: string | null;
  material: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  avgRating: number;
  reviewCount: number;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
}

export interface ProductListResponse {
  items: ProductDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

export interface AddressDTO {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItemDTO {
  id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerEmail: string;
  customerPhone: string;
  shipFullName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string;
  shipPostalCode: string;
  shipCountry: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  giftPackaging: boolean;
  giftPackagingFee: number;
  totalAmount: number;
  items: OrderItemDTO[];
  placedAt: string;
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
}

export interface ReviewDTO {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessShape<T> {
  success: true;
  data: T;
}
