/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `idx_users_avatar_id` ON `users`(`avatar_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_avatar_id_fkey` FOREIGN KEY (`avatar_id`) REFERENCES `images`(`image_id`) ON DELETE SET NULL ON UPDATE CASCADE;
