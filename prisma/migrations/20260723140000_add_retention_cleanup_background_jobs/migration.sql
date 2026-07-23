-- Hai job retention chạy theo lịch hệ thống; không ghi đè is_enabled nếu quản trị viên đã tắt job.
ALTER TABLE `background_jobs`
  MODIFY `code` ENUM(
    'SEPAY_TRANSACTION_SYNC',
    'ASSISTANT_SHIFT_REMINDER',
    'AUDIT_LOG_RETENTION_CLEANUP',
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP'
  ) NOT NULL;

-- Xóa theo mốc thời gian cần index đơn để tránh full scan khi bảng log/run tăng lớn.
CREATE INDEX `idx_admin_audit_created` ON `admin_audit_logs`(`created_at`);
CREATE INDEX `idx_background_job_runs_finished` ON `background_job_runs`(`finished_at`);

-- Audit log quá 30 ngày và job run đã hoàn tất quá 7 ngày được dọn hằng ngày.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES
  (
    'AUDIT_LOG_RETENTION_CLEANUP',
    'Dọn audit log quá hạn',
    '0 0 3 * * *',
    'Asia/Ho_Chi_Minh',
    TRUE,
    900,
    CURRENT_TIMESTAMP(0),
    CURRENT_TIMESTAMP(0)
  ),
  (
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
    'Dọn lịch sử chạy job quá hạn',
    '0 10 3 * * *',
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
