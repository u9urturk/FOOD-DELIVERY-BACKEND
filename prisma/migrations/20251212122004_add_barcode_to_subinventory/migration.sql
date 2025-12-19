/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `sub_inventories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."sub_inventories" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sub_inventories_barcode_key" ON "public"."sub_inventories"("barcode");

-- CreateIndex
CREATE INDEX "sub_inventories_barcode_idx" ON "public"."sub_inventories"("barcode");

-- CreateIndex
CREATE INDEX "sub_inventories_inventoryId_idx" ON "public"."sub_inventories"("inventoryId");
