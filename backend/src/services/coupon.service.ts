import { prisma } from '../config/db';

interface ValidateResult {
  valid: boolean;
  message: string;
  code?: string;
  couponId?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountAmount?: number;
  usageLimitPerUser?: number | null;
}

// Public coupon preview: validates a code against the real admin-managed
// Coupon table and returns the discount it would apply to this subtotal.
// Final enforcement (usage-limit-per-user, recording CouponUsage) happens
// at order placement — this is a live preview for the cart page.
async function validate(code: string, subtotal: number): Promise<ValidateResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: 'Invalid coupon code.' };
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, message: 'This coupon is not active yet.' };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }

  const minOrderValue = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
  if (subtotal < minOrderValue) {
    return { valid: false, message: `Add ₹${minOrderValue - subtotal} more to use this coupon.` };
  }

  const discountValue = Number(coupon.discountValue);
  let discountAmount =
    coupon.discountType === 'PERCENTAGE' ? Math.round((subtotal * discountValue) / 100) : discountValue;

  const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null;
  if (maxDiscount !== null) discountAmount = Math.min(discountAmount, maxDiscount);
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    valid: true,
    message: 'Coupon applied.',
    code: coupon.code,
    couponId: coupon.id,
    discountType: coupon.discountType,
    discountAmount,
    usageLimitPerUser: coupon.usageLimitPerUser,
  };
}

export const couponService = { validate };
