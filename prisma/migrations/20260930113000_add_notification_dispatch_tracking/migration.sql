ALTER TABLE `notification_dispatch_jobs`
  ADD COLUMN `request_fingerprint` VARCHAR(64) NULL,
  ADD COLUMN `audience_type` ENUM('SPECIFIC_USERS', 'ROLE', 'ALL_USERS', 'UNPAID_TUITION_STUDENTS') NOT NULL DEFAULT 'SPECIFIC_USERS',
  ADD COLUMN `audience_recipient_type` ENUM('STUDENT', 'ADMIN', 'PARENT', 'UNKNOWN') NULL,
  ADD COLUMN `requested_channels` JSON NULL;

CREATE INDEX `idx_notification_dispatch_jobs_status_created`
  ON `notification_dispatch_jobs`(`status`, `created_at`);

ALTER TABLE `notification_dispatch_recipients`
  ADD COLUMN `recipient_type` ENUM('STUDENT', 'ADMIN', 'PARENT', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN `profile_id` INTEGER NULL,
  ADD COLUMN `display_name` VARCHAR(255) NULL,
  ADD COLUMN `email` VARCHAR(120) NULL,
  ADD COLUMN `phone` VARCHAR(30) NULL;

CREATE INDEX `idx_notification_dispatch_recipients_job_type`
  ON `notification_dispatch_recipients`(`notification_dispatch_job_id`, `recipient_type`);
