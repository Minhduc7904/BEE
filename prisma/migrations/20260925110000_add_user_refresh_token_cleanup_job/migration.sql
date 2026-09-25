-- Mở rộng enum job nền và giữ nguyên toàn bộ code đã triển khai.
ALTER TABLE `background_jobs`
  MODIFY `code` ENUM(
    'SEPAY_TRANSACTION_SYNC',
    'ASSISTANT_SHIFT_REMINDER',
    'AUDIT_LOG_RETENTION_CLEANUP',
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
    'COMPETITION_SUBMISSION_AUTO_SUBMIT',
    'USER_REFRESH_TOKEN_CLEANUP'
  ) NOT NULL;

-- Seed job hằng ngày; không ghi đè is_enabled nếu quản trị viên đã tắt job.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES (
  'USER_REFRESH_TOKEN_CLEANUP',
  'Dọn refresh token hết hạn',
  '0 20 3 * * *',
  'Asia/Ho_Chi_Minh',
  TRUE,
  900,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `cron_expression` = VALUES(`cron_expression`),
  `timezone` = VALUES(`timezone`),
  `max_runtime_seconds` = VALUES(`max_runtime_seconds`),
  `updated_at` = VALUES(`updated_at`);
