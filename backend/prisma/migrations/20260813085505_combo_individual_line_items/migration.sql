-- Replace the single "combo anchor" line-item mechanism with real,
-- individually-priced product rows grouped by comboGroupId, so combo
-- purchases stay visible as separate products in the cart/order while
-- pricing is still driven by the admin-configured combo price.

-- CartItem
ALTER TABLE "CartItem" DROP COLUMN "comboSelection";
ALTER TABLE "CartItem" ADD COLUMN "comboGroupId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CartItem" ADD COLUMN "comboGroupName" TEXT;
ALTER TABLE "CartItem" ADD COLUMN "comboGroupPrice" DECIMAL(10,2);

DROP INDEX "CartItem_cartId_variantId_key";
CREATE UNIQUE INDEX "CartItem_cartId_variantId_comboGroupId_key" ON "CartItem"("cartId", "variantId", "comboGroupId");

-- OrderItem
ALTER TABLE "OrderItem" DROP COLUMN "comboSelection";
ALTER TABLE "OrderItem" ADD COLUMN "comboGroupId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrderItem" ADD COLUMN "comboGroupName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "comboGroupPrice" DECIMAL(10,2);
