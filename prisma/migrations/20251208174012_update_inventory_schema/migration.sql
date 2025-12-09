/*
  Warnings:

  - You are about to drop the column `lotNumber` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."inventories" DROP CONSTRAINT "inventories_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventories" DROP CONSTRAINT "inventories_warehouseId_fkey";

-- AlterTable
ALTER TABLE "public"."inventories" DROP COLUMN "lotNumber",
DROP COLUMN "supplierId",
DROP COLUMN "unitPrice",
DROP COLUMN "warehouseId";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "barcode",
DROP COLUMN "sku";

-- CreateTable
CREATE TABLE "public"."sub_inventories" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "supplierId" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventories_productId_key" ON "public"."inventories"("productId");

-- AddForeignKey
ALTER TABLE "public"."sub_inventories" ADD CONSTRAINT "sub_inventories_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_inventories" ADD CONSTRAINT "sub_inventories_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_inventories" ADD CONSTRAINT "sub_inventories_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
