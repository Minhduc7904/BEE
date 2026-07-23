-- Mở rộng enum job nền, không thay đổi các code đã triển khai.
ALTER TABLE `background_jobs`
  MODIFY `code` ENUM('SEPAY_TRANSACTION_SYNC', 'ASSISTANT_SHIFT_REMINDER') NOT NULL;

-- Lưu trạng thái idempotent riêng cho email điểm danh và email thông báo vắng.
ALTER TABLE `assistant_shift_assignments`
  ADD COLUMN `check_in_reminder_sent_at` DATETIME(0) NULL,
  ADD COLUMN `absence_email_sent_at` DATETIME(0) NULL;

CREATE INDEX `idx_assistant_shift_assignments_check_in_email`
  ON `assistant_shift_assignments`(`should_send_reminder_email`, `check_in_reminder_sent_at`);

CREATE INDEX `idx_assistant_shift_assignments_absence_email`
  ON `assistant_shift_assignments`(`should_send_reminder_email`, `absence_email_sent_at`);

-- Seed job 5 phút/lần; giữ nguyên is_enabled nếu quản lý đã tắt job.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES (
  'ASSISTANT_SHIFT_REMINDER',
  'Nhắc lịch và xác nhận vắng trợ giảng',
  '0 */5 * * * *',
  'Asia/Ho_Chi_Minh',
  TRUE,
  240,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `cron_expression` = VALUES(`cron_expression`),
  `timezone` = VALUES(`timezone`),
  `max_runtime_seconds` = VALUES(`max_runtime_seconds`),
  `updated_at` = VALUES(`updated_at`);
