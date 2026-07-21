-- Backfill attempt đang chờ nhưng chưa có hạn để không còn QR vô hạn.
UPDATE `payment_attempts`
SET
    `status` = 'EXPIRED',
    `expires_at` = CURRENT_TIMESTAMP(0) - INTERVAL 1 SECOND,
    `updated_at` = CURRENT_TIMESTAMP(0)
WHERE `expires_at` IS NULL
  AND `status` = 'PENDING';

-- Giữ mốc lịch sử cho các attempt đã kết thúc trước đây.
UPDATE `payment_attempts`
SET `expires_at` = COALESCE(`updated_at`, `created_at`)
WHERE `expires_at` IS NULL
  AND `status` IN ('SUCCEEDED', 'FAILED', 'CANCELLED');

-- Bao phủ trạng thái legacy còn lại, ví dụ EXPIRED cũ thiếu thời hạn.
UPDATE `payment_attempts`
SET `expires_at` = COALESCE(`updated_at`, `created_at`)
WHERE `expires_at` IS NULL;

-- Chỉ khóa NOT NULL sau khi không còn row thiếu hạn.
ALTER TABLE `payment_attempts`
    MODIFY `expires_at` TIMESTAMP(0) NOT NULL;
