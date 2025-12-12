/*
  Warnings:

  - You are about to drop the column `currentQuantity` on the `inventories` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `sub_inventories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."inventories" DROP COLUMN "currentQuantity";

-- AlterTable
ALTER TABLE "public"."sub_inventories" ADD COLUMN     "quantity" DECIMAL(10,2) NOT NULL;
