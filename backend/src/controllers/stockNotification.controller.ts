import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated } from '../utils/apiResponse';
import { prisma } from '../config/db';

export const create = asyncHandler(async (req, res) => {
  const { productId, variantId, phone, email } = req.body;
  const notification = await prisma.stockNotification.create({
    data: { productId, variantId, phone, email: email || null },
  });
  sendCreated(res, { id: notification.id, message: "We'll text you the moment it's back in stock." });
});
