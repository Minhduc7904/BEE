-- CreateTable
CREATE TABLE `exams` (
    `exam_id` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `grade` TINYINT NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `file_id` INTEGER NULL,
    `solution_file_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_exams_grade_subject`(`grade`, `subject`),
    INDEX `idx_exams_created_by`(`created_by`),
    INDEX `idx_exams_created_at`(`created_at`),
    PRIMARY KEY (`exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitions` (
    `competition_id` VARCHAR(50) NOT NULL,
    `exam_id` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `start_date` TIMESTAMP(0) NOT NULL,
    `end_date` TIMESTAMP(0) NOT NULL,
    `policies` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_competitions_exam_id`(`exam_id`),
    INDEX `idx_competitions_date_range`(`start_date`, `end_date`),
    INDEX `idx_competitions_created_by`(`created_by`),
    INDEX `idx_competitions_created_at`(`created_at`),
    PRIMARY KEY (`competition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_items` (
    `learning_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('HOMEWORK', 'DOCUMENT', 'YOUTUBE', 'EXERCISE') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `document_id` INTEGER NULL,
    `competition_id` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_learning_items_type`(`type`),
    INDEX `idx_learning_items_created_at`(`created_at`),
    PRIMARY KEY (`learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;
