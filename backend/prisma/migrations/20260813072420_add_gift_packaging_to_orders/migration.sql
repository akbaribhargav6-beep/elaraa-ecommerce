-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "giftPackaging" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftPackagingFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
