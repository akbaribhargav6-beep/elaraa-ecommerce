import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated } from '../utils/apiResponse';
import { prisma } from '../config/db';

export const submit = asyncHandler(async (req, res) => {
  const message = await prisma.contactMessage.create({ data: req.body });
  sendCreated(res, { id: message.id, message: "Thanks — we'll get back to you shortly." });
});
