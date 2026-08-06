import { z } from 'zod';

export const checkoutSchema = z
  .object({
    customerEmail: z.string().email(),
    customerPhone: z.string().min(6, 'Enter a valid phone number'),
    shippingAddressId: z.string().optional(),
    shipFullName: z.string().optional(),
    shipLine1: z.string().optional(),
    shipLine2: z.string().optional(),
    shipCity: z.string().optional(),
    shipState: z.string().optional(),
    shipPostalCode: z.string().optional(),
    shipCountry: z.string().default('India'),
    paymentMethod: z.literal('COD'),
    notes: z.string().max(500).optional(),
    couponCode: z.string().max(40).optional(),
  })
  .refine(
    (data) =>
      !!data.shippingAddressId ||
      (!!data.shipFullName && !!data.shipLine1 && !!data.shipCity && !!data.shipState && !!data.shipPostalCode),
    { message: 'A shipping address is required (either shippingAddressId or the full inline address fields)' }
  );

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().min(1),
});

export const orderHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
