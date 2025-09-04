/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `max_duration_days` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_required_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_role_id_fkey`;

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `roles` DROP COLUMN `max_duration_days`,
    ADD COLUMN `required_by_role_id` INTEGER NULL;

-- DropTable
DROP TABLE `role_permissions`;

-- CreateIndex
CREATE INDEX `idx_roles_required_by` ON `roles`(`required_by_role_id`);

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_required_by_role_id_fkey` FOREIGN KEY (`required_by_role_id`) REFERENCES `roles`(`role_id`) ON DELETE SET NULL ON UPDATE CASCADE;
