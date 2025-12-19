/*
  Warnings:

  - You are about to drop the column `imageUrls` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stockTypeId` on the `products` table. All the data in the column will be lost.
  - Added the required column `stockTypeId` to the `inventories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_stockTypeId_fkey";

-- AlterTable
ALTER TABLE "public"."inventories" ADD COLUMN     "stockTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "imageUrls",
DROP COLUMN "note",
DROP COLUMN "stockTypeId";

-- AddForeignKey
ALTER TABLE "public"."inventories" ADD CONSTRAINT "inventories_stockTypeId_fkey" FOREIGN KEY ("stockTypeId") REFERENCES "public"."stock_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
