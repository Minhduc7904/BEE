/*
  Warnings:

  - The primary key for the `competitions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `competition_id` on the `competitions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.
  - You are about to alter the column `exam_id` on the `competitions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.
  - The primary key for the `exams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `exam_id` on the `exams` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.
  - You are about to alter the column `competition_id` on the `learning_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `competitions` DROP FOREIGN KEY `competitions_exam_id_fkey`;

-- AlterTable
ALTER TABLE `competitions` DROP PRIMARY KEY,
    MODIFY `competition_id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `exam_id` INTEGER NULL,
    ADD PRIMARY KEY (`competition_id`);

-- AlterTable
ALTER TABLE `exams` DROP PRIMARY KEY,
    MODIFY `exam_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`exam_id`);

-- AlterTable
ALTER TABLE `learning_items` MODIFY `competition_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `courses` (
    `course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `thumb_image_id` INTEGER NULL,
    `academic_year` VARCHAR(9) NULL,
    `grade` VARCHAR(10) NULL,
    `subject` VARCHAR(50) NULL,
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `compare_at_cents` INTEGER NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `teacher_id` INTEGER NULL,
    `is_updatable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_courses_visibility`(`visibility`),
    INDEX `idx_courses_grade_subject`(`grade`, `subject`),
    INDEX `idx_courses_teacher_id`(`teacher_id`),
    INDEX `idx_courses_created_at`(`created_at`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses_schedules` (
    `schedule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `room` VARCHAR(100) NULL,

    INDEX `idx_course_schedules_course_id`(`course_id`),
    UNIQUE INDEX `unique_course_schedule`(`course_id`, `day_of_week`, `start_time`),
    PRIMARY KEY (`schedule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `lesson_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `teacher_id` INTEGER NULL,
    `scheduled_at` DATETIME NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_lessons_course_id`(`course_id`),
    INDEX `idx_lessons_teacher_id`(`teacher_id`),
    INDEX `idx_lessons_scheduled_at`(`scheduled_at`),
    INDEX `idx_lessons_created_at`(`created_at`),
    PRIMARY KEY (`lesson_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_learning_items` (
    `lesson_id` INTEGER NOT NULL,
    `learning_item_id` INTEGER NOT NULL,
    `order` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_lesson_learning_items_lesson`(`lesson_id`),
    INDEX `idx_lesson_learning_items_learning_item`(`learning_item_id`),
    PRIMARY KEY (`lesson_id`, `learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`document_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`competition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_schedules` ADD CONSTRAINT `courses_schedules_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
