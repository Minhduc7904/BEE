/*
  Warnings:

  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `jobs` DROP FOREIGN KEY `jobs_created_by_fkey`;

-- DropTable
DROP TABLE `jobs`;

-- CreateTable
CREATE TABLE `background_jobs` (
    `background_job_id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` ENUM('SEPAY_TRANSACTION_SYNC') NOT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `cron_expression` VARCHAR(100) NOT NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `max_runtime_seconds` INTEGER UNSIGNED NOT NULL DEFAULT 300,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `background_jobs_code_key`(`code`),
    INDEX `idx_background_jobs_enabled`(`is_enabled`),
    PRIMARY KEY (`background_job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `background_job_runs` (
    `background_job_run_id` INTEGER NOT NULL AUTO_INCREMENT,
    `background_job_id` INTEGER NOT NULL,
    `scheduled_at` TIMESTAMP(0) NOT NULL,
    `started_at` TIMESTAMP(0) NOT NULL,
    `finished_at` TIMESTAMP(0) NULL,
    `status` ENUM('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'RUNNING',
    `worker_id` VARCHAR(100) NOT NULL,
    `lock_token` VARCHAR(36) NOT NULL,
    `lease_expires_at` TIMESTAMP(0) NOT NULL,
    `retry_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `error_code` VARCHAR(100) NULL,
    `error_message` TEXT NULL,
    `result_summary` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_background_job_runs_job_status_scheduled`(`background_job_id`, `status`, `scheduled_at`),
    INDEX `idx_background_job_runs_status_lease`(`status`, `lease_expires_at`),
    UNIQUE INDEX `uq_background_job_runs_job_scheduled`(`background_job_id`, `scheduled_at`),
    PRIMARY KEY (`background_job_run_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `background_job_runs` ADD CONSTRAINT `background_job_runs_background_job_id_fkey` FOREIGN KEY (`background_job_id`) REFERENCES `background_jobs`(`background_job_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
