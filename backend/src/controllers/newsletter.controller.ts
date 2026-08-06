import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { prisma } from '../config/db';

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true, unsubscribedAt: null },
    create: { email },
  });
  sendSuccess(res, { message: "You're on the list." });
});
