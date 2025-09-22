/*
  Warnings:

  - You are about to drop the column `another_url` on the `images` table. All the data in the column will be lost.
  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `another_url` on the `media_images` table. All the data in the column will be lost.
  - You are about to drop the column `another_url` on the `question_images` table. All the data in the column will be lost.
  - You are about to drop the column `another_url` on the `solution_images` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[avatar_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `images` DROP COLUMN `another_url`,
    ADD COLUMN `caption` VARCHAR(200) NULL,
    ADD COLUMN `thumbnail_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `media_images` DROP COLUMN `another_url`,
    ADD COLUMN `caption` VARCHAR(200) NULL,
    ADD COLUMN `thumbnail_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `question_images` DROP COLUMN `another_url`,
    ADD COLUMN `caption` VARCHAR(200) NULL,
    ADD COLUMN `thumbnail_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `solution_images` DROP COLUMN `another_url`,
    ADD COLUMN `caption` VARCHAR(200) NULL,
    ADD COLUMN `thumbnail_url` VARCHAR(500) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_avatar_id_key` ON `users`(`avatar_id`);

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `media_images` RENAME INDEX `idx_images_created_at` TO `idx_media_images_created_at`;

-- RenameIndex
ALTER TABLE `question_images` RENAME INDEX `idx_images_created_at` TO `idx_question_images_created_at`;

-- RenameIndex
ALTER TABLE `question_images` RENAME INDEX `idx_images_related` TO `idx_question_images_related`;

-- RenameIndex
ALTER TABLE `solution_images` RENAME INDEX `idx_images_created_at` TO `idx_solution_images_created_at`;
