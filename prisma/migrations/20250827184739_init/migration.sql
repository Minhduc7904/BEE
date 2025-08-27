/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- CreateTable
CREATE TABLE `questions` (
    `question_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    `image_id` INTEGER NULL,
    `correct_answer` TEXT NULL,
    `solution` TEXT NULL,
    `chapter` VARCHAR(100) NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NOT NULL,
    `solution_youtube_url` VARCHAR(500) NULL,
    `solution_image_id` INTEGER NULL,
    `grade` TINYINT NOT NULL,
    `subject` VARCHAR(100) NULL,
    `created_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_questions_subject_grade`(`subject`, `grade`),
    INDEX `idx_questions_type`(`type`),
    INDEX `idx_questions_difficulty`(`difficulty`),
    INDEX `idx_questions_created_by`(`created_by`),
    INDEX `idx_questions_created_at`(`created_at`),
    PRIMARY KEY (`question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statements` (
    `statement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `question_id` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `order` INTEGER NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `image_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_statements_question_id`(`question_id`),
    INDEX `idx_statements_is_correct`(`is_correct`),
    PRIMARY KEY (`statement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions_exams` (
    `question_id` INTEGER NOT NULL,
    `exam_id` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_question_exams_exam_id`(`exam_id`),
    INDEX `idx_question_exams_question_id`(`question_id`),
    PRIMARY KEY (`question_id`, `exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statements` ADD CONSTRAINT `statements_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;
