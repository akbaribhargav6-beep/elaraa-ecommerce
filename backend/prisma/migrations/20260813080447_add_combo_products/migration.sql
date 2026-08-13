-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "comboSelection" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "comboSelection" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isComboEligible" BOOLEAN NOT NULL DEFAULT false;
