/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `chapter` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `questions` DROP COLUMN `chapter`,
    ADD COLUMN `chapter_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `idx_questions_chapter_id` ON `questions`(`chapter_id`);

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE SET NULL ON UPDATE CASCADE;
