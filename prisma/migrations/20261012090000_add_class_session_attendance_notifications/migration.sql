-- Dấu đã xử lý hai mốc thông báo điểm danh theo buổi học (start + 15 phút, hết giờ) và job nền ATTENDANCE_SESSION_NOTIFIER.
-- Không backfill: cột mới nullable; job chỉ quét các buổi có session_date = hôm nay (giờ Việt Nam) nên buổi của ngày cũ không bị gửi bù.

-- AlterTable
ALTER TABLE `class_sessions`
  ADD COLUMN `absent_reminder_notified_at` TIMESTAMP(0) NULL,
  ADD COLUMN `absence_summary_notified_at` TIMESTAMP(0) NULL;

-- AlterEnum
ALTER TABLE `background_jobs`
  MODIFY `code` ENUM(
    'SEPAY_TRANSACTION_SYNC',
    'ASSISTANT_SHIFT_REMINDER',
    'AUDIT_LOG_RETENTION_CLEANUP',
    'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
    'COMPETITION_SUBMISSION_AUTO_SUBMIT',
    'USER_REFRESH_TOKEN_CLEANUP',
    'NOTIFICATION_DELIVERY_DISPATCHER',
    'BUSINESS_NOTIFICATION_OUTBOX_RELAY',
    'ATTENDANCE_SESSION_NOTIFIER'
  ) NOT NULL;

-- Seed job quét mỗi phút; không ghi đè is_enabled nếu quản trị viên đã tắt job.
INSERT INTO `background_jobs` (
  `code`, `display_name`, `cron_expression`, `timezone`, `is_enabled`,
  `max_runtime_seconds`, `created_at`, `updated_at`
)
VALUES (
  'ATTENDANCE_SESSION_NOTIFIER',
  'Thông báo điểm danh theo mốc buổi học',
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
