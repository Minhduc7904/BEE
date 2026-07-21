-- Seed cấu hình lịch chạy cho đồng bộ SePay. Không cập nhật is_enabled khi job đã tồn tại
-- để tôn trọng thao tác tắt job của admin.
INSERT INTO `background_jobs` (
  `code`,
  `display_name`,
  `cron_expression`,
  `timezone`,
  `is_enabled`,
  `max_runtime_seconds`,
  `created_at`,
  `updated_at`
)
VALUES (
  'SEPAY_TRANSACTION_SYNC',
  'Đồng bộ giao dịch SePay',
  '0 */5 * * * *',
  'Asia/Ho_Chi_Minh',
  TRUE,
  300,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `cron_expression` = VALUES(`cron_expression`),
  `timezone` = VALUES(`timezone`),
  `max_runtime_seconds` = VALUES(`max_runtime_seconds`),
  `updated_at` = VALUES(`updated_at`);

-- Cursor IN_ALL chỉ dành cho giao dịch tiền vào: application luôn gọi SePay V2 với
-- transfer_type = in. Không dùng cursor này cho giao dịch tiền ra hoặc scope khác.
INSERT IGNORE INTO `sepay_transaction_sync_cursors` (
  `scope`,
  `last_since_id`,
  `last_synced_at`,
  `last_error_at`,
  `last_error_message`,
  `created_at`,
  `updated_at`
)
VALUES (
  'IN_ALL',
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
);
