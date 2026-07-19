-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_reporter_id_fkey`;

-- AlterTable
ALTER TABLE `reports` MODIFY `reporter_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
