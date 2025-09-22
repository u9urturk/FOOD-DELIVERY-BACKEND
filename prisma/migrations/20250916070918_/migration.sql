/*
  Warnings:

  - You are about to drop the column `contactPerson` on the `suppliers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `movement_types` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."suppliers" DROP COLUMN "contactPerson",
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "leadTimeDays" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "movement_types_name_key" ON "public"."movement_types"("name");
