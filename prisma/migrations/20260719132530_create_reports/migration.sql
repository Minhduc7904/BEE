-- CreateTable
CREATE TABLE `reports` (
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporter_id` INTEGER NOT NULL,
    `target_type` ENUM('ADMIN', 'QUESTION', 'EXAM', 'CLASS', 'CLASS_SESSION', 'WEBSITE') NOT NULL,
    `reason` ENUM('INCORRECT_TEACHING', 'INCORRECT_CONTENT', 'INAPPROPRIATE_BEHAVIOR', 'CLASS_ISSUE', 'TECHNICAL_ISSUE', 'WEBSITE_ISSUE', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reported_admin_id` INTEGER NULL,
    `question_id` INTEGER NULL,
    `exam_id` INTEGER NULL,
    `class_id` INTEGER NULL,
    `session_id` INTEGER NULL,
    `page_url` VARCHAR(1000) NULL,
    `handled_by_id` INTEGER NULL,
    `handled_at` TIMESTAMP(0) NULL,
    `resolution_note` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_reports_reporter_created`(`reporter_id`, `created_at`),
    INDEX `idx_reports_target_status_created`(`target_type`, `status`, `created_at`),
    INDEX `idx_reports_reported_admin`(`reported_admin_id`),
    INDEX `idx_reports_question`(`question_id`),
    INDEX `idx_reports_exam`(`exam_id`),
    INDEX `idx_reports_class`(`class_id`),
    INDEX `idx_reports_session`(`session_id`),
    INDEX `idx_reports_handler_status`(`handled_by_id`, `status`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reported_admin_id_fkey` FOREIGN KEY (`reported_admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`session_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_handled_by_id_fkey` FOREIGN KEY (`handled_by_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;
