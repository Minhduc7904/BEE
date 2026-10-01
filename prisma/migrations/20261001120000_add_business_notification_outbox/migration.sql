ALTER TABLE `background_jobs`
  MODIFY `code` ENUM(
    'SEPAY_TRANSACTION_SYNC',
    'ASSISTANT_SHIFT_REMINDER',
    'AUDIT_LOG_RETENTION_CLEANUP',
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
    'COMPETITION_SUBMISSION_AUTO_SUBMIT',
    'USER_REFRESH_TOKEN_CLEANUP',
    'NOTIFICATION_DELIVERY_DISPATCHER',
    'BUSINESS_NOTIFICATION_OUTBOX_RELAY'
  ) NOT NULL;

CREATE TABLE `business_notification_outbox` (
  `business_notification_outbox_id` INTEGER NOT NULL AUTO_INCREMENT,
  `status` ENUM('PENDING', 'PROCESSING', 'RETRY_WAIT', 'PUBLISHED', 'DEAD') NOT NULL DEFAULT 'PENDING',
  `source_type` VARCHAR(80) NOT NULL,
  `source_id` VARCHAR(120) NOT NULL,
  `source_event` VARCHAR(80) NOT NULL,
  `idempotency_key` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `attempt_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `max_attempts` INTEGER UNSIGNED NOT NULL DEFAULT 10,
  `available_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `claimed_by` VARCHAR(120) NULL,
  `claimed_at` TIMESTAMP(0) NULL,
  `lease_expires_at` TIMESTAMP(0) NULL,
  `last_error_code` VARCHAR(100) NULL,
  `last_error_message` TEXT NULL,
  `published_at` TIMESTAMP(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `uq_business_notification_outbox_idempotency`(`idempotency_key`),
  INDEX `idx_business_notification_outbox_due`(`status`, `available_at`, `business_notification_outbox_id`),
  INDEX `idx_business_notification_outbox_lease`(`status`, `lease_expires_at`),
  INDEX `idx_business_notification_outbox_source`(`source_type`, `source_id`),
  PRIMARY KEY (`business_notification_outbox_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed relay 10 giây/lần; không ghi đè is_enabled nếu quản trị viên đã tắt job.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES (
  'BUSINESS_NOTIFICATION_OUTBOX_RELAY',
  'Chuyển tiếp outbox notification nghiệp vụ',
  '*/10 * * * * *',
  'Asia/Ho_Chi_Minh',
  TRUE,
  60,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `cron_expression` = VALUES(`cron_expression`),
  `timezone` = VALUES(`timezone`),
  `max_runtime_seconds` = VALUES(`max_runtime_seconds`),
  `updated_at` = VALUES(`updated_at`);
