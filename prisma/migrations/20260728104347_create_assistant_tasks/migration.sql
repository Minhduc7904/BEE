/*
  Warnings:

  - You are about to drop the `course_assistants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `course_assistants` DROP FOREIGN KEY `course_assistants_admin_id_fkey`;

-- DropForeignKey
ALTER TABLE `course_assistants` DROP FOREIGN KEY `course_assistants_course_id_fkey`;

-- AlterTable
ALTER TABLE `assistant_shift_assignments` MODIFY `check_in_reminder_sent_at` TIMESTAMP(0) NULL,
    MODIFY `absence_email_sent_at` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `background_job_locks` MODIFY `locked_at` TIMESTAMP(0) NOT NULL,
    MODIFY `lease_expires_at` TIMESTAMP(0) NOT NULL,
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL;

-- AlterTable
ALTER TABLE `background_jobs` MODIFY `code` ENUM('SEPAY_TRANSACTION_SYNC', 'ASSISTANT_SHIFT_REMINDER', 'AUDIT_LOG_RETENTION_CLEANUP', 'BACKGROUND_JOB_RUN_RETENTION_CLEANUP', 'COMPETITION_SUBMISSION_AUTO_SUBMIT') NOT NULL;

-- DropTable
DROP TABLE `course_assistants`;

-- CreateTable
CREATE TABLE `assistant_tasks` (
    `assistant_task_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NULL,
    `assistant_id` INTEGER NULL,
    `task_type` ENUM('HOMEWORK_ANSWER_KEY', 'PUBLISH_HOMEWORK', 'HOMEWORK_SOLUTION_VIDEO', 'IN_CLASS_EXERCISE_ANSWER_KEY', 'ESSAY_GRADING') NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `is_base_task` BOOLEAN NOT NULL DEFAULT false,
    `deadline_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_tasks_course_status_deadline`(`course_id`, `status`, `deadline_at`),
    INDEX `idx_assistant_tasks_assistant_status_deadline`(`assistant_id`, `status`, `deadline_at`),
    INDEX `idx_assistant_tasks_is_base_task`(`is_base_task`),
    PRIMARY KEY (`assistant_task_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assistant_task_products` (
    `assistant_task_product_id` INTEGER NOT NULL AUTO_INCREMENT,
    `assistant_task_id` INTEGER NULL,
    `name` VARCHAR(255) NULL,
    `quantity` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_task_products_task_id`(`assistant_task_id`),
    PRIMARY KEY (`assistant_task_product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assistant_tasks` ADD CONSTRAINT `assistant_tasks_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assistant_tasks` ADD CONSTRAINT `assistant_tasks_assistant_id_fkey` FOREIGN KEY (`assistant_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assistant_task_products` ADD CONSTRAINT `assistant_task_products_assistant_task_id_fkey` FOREIGN KEY (`assistant_task_id`) REFERENCES `assistant_tasks`(`assistant_task_id`) ON DELETE SET NULL ON UPDATE CASCADE;
