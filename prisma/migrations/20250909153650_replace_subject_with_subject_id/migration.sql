/*
  Warnings:

  - You are about to drop the column `subject` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `exams` table. All the data in the column will be lost.
  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `subject` on the `questions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `idx_courses_grade_subject` ON `courses`;

-- DropIndex
DROP INDEX `idx_exams_grade_subject` ON `exams`;

-- DropIndex
DROP INDEX `idx_questions_subject_grade` ON `questions`;

-- AlterTable
ALTER TABLE `admins` DROP COLUMN `subject`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `courses` DROP COLUMN `subject`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `documents` DROP COLUMN `subject`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `exams` DROP COLUMN `subject`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `questions` DROP COLUMN `subject`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `subjects` (
    `subject_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `subjects_name_key`(`name`),
    UNIQUE INDEX `subjects_code_key`(`code`),
    INDEX `idx_subjects_name`(`name`),
    PRIMARY KEY (`subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters` (
    `chapter_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parent_chapter_id` INTEGER NULL,
    `order_in_parent` INTEGER NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `chapters_slug_key`(`slug`),
    INDEX `idx_chapters_subject_id`(`subject_id`),
    INDEX `idx_chapters_parent_id`(`parent_chapter_id`),
    UNIQUE INDEX `chapters_subject_id_name_parent_chapter_id_key`(`subject_id`, `name`, `parent_chapter_id`),
    UNIQUE INDEX `chapters_subject_id_parent_chapter_id_order_in_parent_key`(`subject_id`, `parent_chapter_id`, `order_in_parent`),
    PRIMARY KEY (`chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_admins_subject_id` ON `admins`(`subject_id`);

-- CreateIndex
CREATE INDEX `idx_courses_grade_subject` ON `courses`(`grade`, `subject_id`);

-- CreateIndex
CREATE INDEX `idx_courses_subject_id` ON `courses`(`subject_id`);

-- CreateIndex
CREATE INDEX `idx_documents_subject_id` ON `documents`(`subject_id`);

-- CreateIndex
CREATE INDEX `idx_exams_grade_subject` ON `exams`(`grade`, `subject_id`);

-- CreateIndex
CREATE INDEX `idx_exams_subject_id` ON `exams`(`subject_id`);

-- CreateIndex
CREATE INDEX `idx_questions_subject_grade` ON `questions`(`subject_id`, `grade`);

-- CreateIndex
CREATE INDEX `idx_questions_subject_id` ON `questions`(`subject_id`);

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_parent_chapter_id_fkey` FOREIGN KEY (`parent_chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;
