ALTER TABLE `notification_dispatch_jobs`
  ADD COLUMN `source_type` VARCHAR(80) NULL,
  ADD COLUMN `source_id` VARCHAR(120) NULL,
  ADD COLUMN `source_event` VARCHAR(80) NULL;

CREATE INDEX `idx_notification_dispatch_jobs_source`
  ON `notification_dispatch_jobs`(`source_type`, `source_id`);

ALTER TABLE `notification_dispatch_recipients`
  ADD COLUMN `recipient_key` VARCHAR(180) NULL,
  ADD COLUMN `recipient_kind` ENUM('USER', 'EXTERNAL_CONTACT') NOT NULL DEFAULT 'USER',
  ADD COLUMN `source_student_id` INTEGER NULL;

DROP INDEX `uq_notification_dispatch_recipients_job_user` ON `notification_dispatch_recipients`;

CREATE INDEX `idx_notification_dispatch_recipients_job_user`
  ON `notification_dispatch_recipients`(`notification_dispatch_job_id`, `user_id`);

CREATE UNIQUE INDEX `uq_notification_dispatch_recipients_job_key`
  ON `notification_dispatch_recipients`(`notification_dispatch_job_id`, `recipient_key`);

ALTER TABLE `notification_deliveries`
  MODIFY COLUMN `channel` ENUM('IN_APP', 'PUSH', 'ZALO_OA') NOT NULL,
  ADD COLUMN `payload` JSON NULL,
  ADD COLUMN `destination` VARCHAR(255) NULL,
  ADD COLUMN `provider_app_id` VARCHAR(100) NULL;
