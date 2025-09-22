/*
  Warnings:

  - You are about to drop the column `thumbnail_url` on the `images` table. All the data in the column will be lost.
  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `thumbnail_url` on the `media_images` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `question_images` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `solution_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `images` DROP COLUMN `thumbnail_url`,
    ADD COLUMN `another_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `media_images` DROP COLUMN `thumbnail_url`,
    ADD COLUMN `another_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `question_images` DROP COLUMN `thumbnail_url`,
    ADD COLUMN `another_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `solution_images` DROP COLUMN `thumbnail_url`,
    ADD COLUMN `another_url` VARCHAR(500) NULL;
