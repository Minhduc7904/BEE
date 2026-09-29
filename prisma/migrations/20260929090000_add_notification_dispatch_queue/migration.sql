-- Mở rộng enum job nền cho dispatcher notification; giữ nguyên các code đã triển khai.
ALTER TABLE `background_jobs`
  MODIFY `code` ENUM(
    'SEPAY_TRANSACTION_SYNC',
    'ASSISTANT_SHIFT_REMINDER',
    'AUDIT_LOG_RETENTION_CLEANUP',
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
    'COMPETITION_SUBMISSION_AUTO_SUBMIT',
    'USER_REFRESH_TOKEN_CLEANUP',
    'NOTIFICATION_DELIVERY_DISPATCHER'
  ) NOT NULL;

-- Queue root: một yêu cầu gửi đơn hoặc batch.
CREATE TABLE `notification_dispatch_jobs` (
  `notification_dispatch_job_id` INTEGER NOT NULL AUTO_INCREMENT,
  `job_type` ENUM('SINGLE', 'BATCH') NOT NULL,
  `status` ENUM('QUEUED', 'PROCESSING', 'SUCCEEDED', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('SYSTEM', 'COURSE', 'LESSON', 'ATTENDANCE', 'TUITION', 'MESSAGE', 'OTHER') NOT NULL DEFAULT 'SYSTEM',
  `level` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
  `data` JSON NULL,
  `scheduled_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `started_at` TIMESTAMP(0) NULL,
  `finished_at` TIMESTAMP(0) NULL,
  `priority` SMALLINT NOT NULL DEFAULT 0,
  `idempotency_key` VARCHAR(100) NOT NULL,
  `recipient_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `total_delivery_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `sent_delivery_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `skipped_delivery_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `dead_delivery_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `created_by_admin_id` INTEGER NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,

  UNIQUE INDEX `uq_notification_dispatch_jobs_idempotency`(`idempotency_key`),
  INDEX `idx_notification_dispatch_jobs_due`(`status`, `scheduled_at`, `priority`),
  INDEX `idx_notification_dispatch_jobs_creator_created`(`created_by_admin_id`, `created_at`),
  PRIMARY KEY (`notification_dispatch_job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Snapshot người nhận; user_id nullable để giữ lịch sử khi tài khoản bị xóa.
CREATE TABLE `notification_dispatch_recipients` (
  `notification_dispatch_recipient_id` INTEGER NOT NULL AUTO_INCREMENT,
  `notification_dispatch_job_id` INTEGER NOT NULL,
  `user_id` INTEGER NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,

  UNIQUE INDEX `uq_notification_dispatch_recipients_job_user`(`notification_dispatch_job_id`, `user_id`),
  INDEX `idx_notification_dispatch_recipients_user_created`(`user_id`, `created_at`),
  PRIMARY KEY (`notification_dispatch_recipient_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Queue giao nhận bền vững cho từng recipient/channel.
CREATE TABLE `notification_deliveries` (
  `notification_delivery_id` INTEGER NOT NULL AUTO_INCREMENT,
  `notification_dispatch_recipient_id` INTEGER NOT NULL,
  `channel` ENUM('IN_APP', 'PUSH') NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'RETRY_WAIT', 'SENT', 'SKIPPED', 'DEAD', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `attempt_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `max_attempts` INTEGER UNSIGNED NOT NULL DEFAULT 3,
  `available_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `claimed_by` VARCHAR(100) NULL,
  `claimed_at` TIMESTAMP(0) NULL,
  `lease_expires_at` TIMESTAMP(0) NULL,
  `provider_message_id` VARCHAR(255) NULL,
  `last_error_code` VARCHAR(100) NULL,
  `last_error_message` TEXT NULL,
  `skip_reason` VARCHAR(100) NULL,
  `sent_at` TIMESTAMP(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,

  UNIQUE INDEX `uq_notification_deliveries_recipient_channel`(`notification_dispatch_recipient_id`, `channel`),
  INDEX `idx_notification_deliveries_due`(`status`, `available_at`, `notification_delivery_id`),
  INDEX `idx_notification_deliveries_lease`(`status`, `lease_expires_at`),
  INDEX `idx_notification_deliveries_recipient_status`(`notification_dispatch_recipient_id`, `status`),
  PRIMARY KEY (`notification_delivery_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Liên kết idempotency nullable; mọi notification hiện có giữ giá trị NULL.
ALTER TABLE `notifications`
  ADD COLUMN `notification_dispatch_recipient_id` INTEGER NULL,
  ADD UNIQUE INDEX `uq_notifications_dispatch_recipient`(`notification_dispatch_recipient_id`);

ALTER TABLE `notification_dispatch_jobs`
  ADD CONSTRAINT `notification_dispatch_jobs_created_by_admin_id_fkey`
  FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `notification_dispatch_recipients`
  ADD CONSTRAINT `notification_dispatch_recipients_job_id_fkey`
  FOREIGN KEY (`notification_dispatch_job_id`) REFERENCES `notification_dispatch_jobs`(`notification_dispatch_job_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notification_dispatch_recipients_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `notification_deliveries`
  ADD CONSTRAINT `notification_deliveries_recipient_id_fkey`
  FOREIGN KEY (`notification_dispatch_recipient_id`) REFERENCES `notification_dispatch_recipients`(`notification_dispatch_recipient_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_dispatch_recipient_id_fkey`
  FOREIGN KEY (`notification_dispatch_recipient_id`) REFERENCES `notification_dispatch_recipients`(`notification_dispatch_recipient_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed dispatcher mỗi phút; không ghi đè is_enabled nếu quản trị viên đã tắt job.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES (
  'NOTIFICATION_DELIVERY_DISPATCHER',
  'Điều phối notification nền',
  '0 * * * * *',
  'Asia/Ho_Chi_Minh',
  TRUE,
  120,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `cron_expression` = VALUES(`cron_expression`),
  `timezone` = VALUES(`timezone`),
  `max_runtime_seconds` = VALUES(`max_runtime_seconds`),
  `updated_at` = VALUES(`updated_at`);
